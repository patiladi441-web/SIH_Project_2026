"""
app/workers/tasks.py
─────────────────────
Celery background tasks for batch pre-computation.

`precompute_region` iterates over a region's grid at GRID_RESOLUTION and
calls the reconstruct logic directly (not via HTTP) to warm the cache.

Trigger via:
    POST /api/v1/admin/precompute   { "region_id": 1, "date": "2023-06-15" }
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="precompute_region", bind=True, max_retries=3)
def precompute_region(self, region_id: int, target_date: str) -> dict:
    """
    Celery task: pre-warm the reconstruction cache for an entire region.

    Args:
        region_id:   ID of the Region row to process.
        target_date: ISO date string (YYYY-MM-DD).

    Returns:
        dict with keys: region_id, date, total_points, completed, errors
    """
    return asyncio.run(_async_precompute(region_id, target_date))


async def _async_precompute(region_id: int, target_date: str) -> dict:
    """Inner async implementation — runs inside asyncio.run() from Celery."""
    import numpy as np
    from app.core.config import settings
    from app.db.session import AsyncSessionLocal
    from app.db.models.region import Region
    from app.services import ai_client, cache_service
    from sqlalchemy import select

    query_date = date.fromisoformat(target_date)
    resolution = settings.grid_resolution

    async with AsyncSessionLocal() as db:
        region = (
            await db.execute(select(Region).where(Region.id == region_id))
        ).scalar_one_or_none()

        if region is None:
            logger.error("precompute: region_id=%d not found", region_id)
            return {"error": f"Region {region_id} not found"}

        lats = np.arange(region.lat_min, region.lat_max + resolution, resolution)
        lons = np.arange(region.lon_min, region.lon_max + resolution, resolution)
        total_points = len(lats) * len(lons)

        logger.info(
            "precompute: region=%s date=%s grid=%dx%d total=%d",
            region.name, target_date, len(lats), len(lons), total_points,
        )

        completed = errors = 0
        for lat in lats:
            for lon in lons:
                try:
                    # Skip if already cached
                    cached = await cache_service.get_cached(lat, lon, query_date)
                    if cached:
                        completed += 1
                        continue

                    result = await ai_client.predict_profile(lat, lon, query_date)
                    await cache_service.set_cached(lat, lon, query_date, result)
                    completed += 1
                except Exception as exc:
                    errors += 1
                    logger.warning(
                        "precompute: error at lat=%.2f lon=%.2f: %s", lat, lon, exc
                    )

    logger.info(
        "precompute: done region=%s completed=%d errors=%d",
        region.name, completed, errors,
    )
    return {
        "region_id": region_id,
        "date": target_date,
        "total_points": total_points,
        "completed": completed,
        "errors": errors,
    }
