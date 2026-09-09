"""
app/api/v1/reconstruct.py
──────────────────────────
POST /api/v1/reconstruct — the main inference endpoint.

Flow:
  1. Check Redis cache → return immediately on HIT
  2. Check DB cache (reconstruction_cache table) → populate Redis + return on HIT
  3. Call ai_client.predict_profile() → get mock (or real) result
  4. Run argo_lookup concurrently → attach nearest_argo to result
  5. Store result in Redis + DB cache
  6. Log query to query_logs
  7. Return result

Cache hit on step 1 is measurably faster (no DB round-trip).
"""

from __future__ import annotations

import logging
import time
from datetime import date as DateType

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.query_log import QueryLog
from app.db.models.reconstruction_cache import ReconstructionCache
from app.db.session import get_db_dependency
from app.schemas.reconstruct import ReconstructRequest, ReconstructResult
from app.services import ai_client, cache_service, argo_lookup

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reconstruct", tags=["Reconstruction"])


@router.post(
    "",
    response_model=ReconstructResult,
    summary="Reconstruct subsurface ocean temperature profile",
    description=(
        "Given a surface location and date, returns the predicted vertical "
        "temperature profile from 0–2000m depth. Results are cached in Redis "
        "and PostgreSQL for fast subsequent lookups."
    ),
    status_code=status.HTTP_200_OK,
)
async def reconstruct(
    body: ReconstructRequest,
    db: AsyncSession = Depends(get_db_dependency),
) -> ReconstructResult:
    t_start = time.perf_counter()
    lat, lon, query_date = body.latitude, body.longitude, body.date
    cache_hit = False

    # ── Validate coordinate range ────────────────────────────────────────────
    _validate_ocean_query(lat, lon, query_date)

    # ── Step 1: Redis cache check ────────────────────────────────────────────
    result = await cache_service.get_cached(lat, lon, query_date)

    if result is not None:
        cache_hit = True
        logger.info(
            "reconstruct: REDIS HIT lat=%.4f lon=%.4f date=%s", lat, lon, query_date
        )
    else:
        # ── Step 2: DB cache check ───────────────────────────────────────────
        db_cached = await _check_db_cache(db, lat, lon, query_date)

        if db_cached:
            cache_hit = True
            result = db_cached
            # Re-populate Redis from DB
            await cache_service.set_cached(lat, lon, query_date, result)
        else:
            # ── Step 3: AI model call ────────────────────────────────────────
            result = await ai_client.predict_profile(lat, lon, query_date)

            # ── Step 4: Nearest Argo lookup (parallel would be ideal; sequential for now) ──
            nearest = await argo_lookup.find_nearest_profile(db, lat, lon, query_date)
            result.nearest_argo = nearest

            # ── Step 5: Store in caches ──────────────────────────────────────
            cache_key = await cache_service.set_cached(lat, lon, query_date, result)
            await _store_db_cache(db, lat, lon, query_date, result, cache_key, nearest)

    result.cache_hit = cache_hit

    # ── Step 6: Log query ────────────────────────────────────────────────────
    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    await _log_query(db, lat, lon, query_date, elapsed_ms, cache_hit)

    logger.info(
        "reconstruct: done lat=%.4f lon=%.4f date=%s cache=%s ms=%d",
        lat, lon, query_date, cache_hit, elapsed_ms,
    )
    return result


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_ocean_query(lat: float, lon: float, query_date: DateType) -> None:
    """Raise 422 for clearly invalid inputs before hitting any service."""
    from app.core.config import settings
    from datetime import date

    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lat must be in [-90, 90] and lon in [-180, 180].",
        )
    if query_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot reconstruct for a future date.",
        )


async def _check_db_cache(
    db: AsyncSession, lat: float, lon: float, query_date: DateType
) -> ReconstructResult | None:
    cache_key = cache_service.make_cache_key(lat, lon, query_date)
    stmt = select(ReconstructionCache).where(
        ReconstructionCache.cache_key == cache_key
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        return None

    from app.schemas.argo import ArgoProfileResponse
    return ReconstructResult(
        depths_m=row.depths_m,
        temperature_c=row.temperature_c,
        confidence=row.confidence,
        nearest_argo=None,  # loaded separately if needed
        cache_hit=True,
        is_mock=row.is_mock,
    )


async def _store_db_cache(
    db: AsyncSession,
    lat: float,
    lon: float,
    query_date: DateType,
    result: ReconstructResult,
    cache_key: str,
    nearest=None,
) -> None:
    try:
        row = ReconstructionCache(
            lat=lat,
            lon=lon,
            query_date=query_date,
            depths_m=result.depths_m,
            temperature_c=result.temperature_c,
            confidence=result.confidence,
            nearest_argo_id=nearest.id if nearest else None,
            is_mock=result.is_mock,
            cache_key=cache_key or cache_service.make_cache_key(lat, lon, query_date),
        )
        db.add(row)
        await db.flush()
    except Exception as exc:
        logger.warning("reconstruct: DB cache store failed (non-fatal): %s", exc)


async def _log_query(
    db: AsyncSession,
    lat: float,
    lon: float,
    query_date: DateType,
    response_time_ms: int,
    cache_hit: bool,
) -> None:
    try:
        log = QueryLog(
            lat=lat,
            lon=lon,
            query_date=query_date,
            response_time_ms=response_time_ms,
            cache_hit=cache_hit,
            status_code=200,
        )
        db.add(log)
        await db.flush()
    except Exception as exc:
        logger.warning("reconstruct: query log failed (non-fatal): %s", exc)
