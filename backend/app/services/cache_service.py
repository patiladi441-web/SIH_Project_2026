"""
app/services/cache_service.py
──────────────────────────────
Redis-backed cache for /reconstruct results.

Key format: "recon:{lat_2dp}:{lon_2dp}:{date}"
  e.g.     "recon:12.50:72.30:2023-06-15"

Rounding lat/lon to 2 decimal places (~1.1 km precision) avoids cache misses
for trivially different coordinates (e.g. 12.5001 vs 12.5002).
"""

from __future__ import annotations

import json
import logging
from datetime import date

import redis.asyncio as aioredis

from app.core.config import settings
from app.schemas.reconstruct import ReconstructResult

logger = logging.getLogger(__name__)

# Module-level Redis pool (created once, reused across requests)
_redis_pool: aioredis.Redis | None = None


def _get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


def make_cache_key(lat: float, lon: float, query_date: date) -> str:
    """Build the canonical Redis key for a reconstruction request."""
    return f"recon:{lat:.2f}:{lon:.2f}:{query_date.isoformat()}"


async def get_cached(lat: float, lon: float, query_date: date) -> ReconstructResult | None:
    """
    Try to retrieve a cached ReconstructResult from Redis.
    Returns None on cache miss or Redis unavailability (fail-open).
    """
    key = make_cache_key(lat, lon, query_date)
    try:
        r = _get_redis()
        raw = await r.get(key)
        if raw is None:
            return None
        data = json.loads(raw)
        result = ReconstructResult(**data)
        result.cache_hit = True
        logger.debug("cache_service: HIT key=%s", key)
        return result
    except Exception as exc:
        logger.warning("cache_service: Redis GET failed (fail-open): %s", exc)
        return None


async def set_cached(
    lat: float,
    lon: float,
    query_date: date,
    result: ReconstructResult,
    ttl: int | None = None,
) -> str:
    """
    Store a ReconstructResult in Redis.
    Returns the cache key on success, empty string on failure.
    """
    key = make_cache_key(lat, lon, query_date)
    ttl = ttl or settings.cache_ttl_seconds
    try:
        r = _get_redis()
        # Exclude nearest_argo from cache payload to keep size small;
        # it's re-fetched from DB on cache hit if needed.
        payload = result.model_dump(exclude={"nearest_argo"})
        await r.setex(key, ttl, json.dumps(payload))
        logger.debug("cache_service: SET key=%s ttl=%ds", key, ttl)
        return key
    except Exception as exc:
        logger.warning("cache_service: Redis SET failed (fail-open): %s", exc)
        return ""


async def invalidate(lat: float, lon: float, query_date: date) -> bool:
    """Delete a specific cache entry. Returns True if the key existed."""
    key = make_cache_key(lat, lon, query_date)
    try:
        r = _get_redis()
        deleted = await r.delete(key)
        return bool(deleted)
    except Exception as exc:
        logger.warning("cache_service: Redis DEL failed: %s", exc)
        return False


async def ping_redis() -> bool:
    """Health check — returns True if Redis is reachable."""
    try:
        r = _get_redis()
        return await r.ping()
    except Exception:
        return False
