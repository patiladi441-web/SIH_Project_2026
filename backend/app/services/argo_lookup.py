"""
app/services/argo_lookup.py
────────────────────────────
Find the nearest Argo float profile to a (lat, lon, date) query.

Uses PostGIS geography <-> operator (KNN index scan) — sub-millisecond
for tables with tens of thousands of profiles.

The date window (±DATE_WINDOW_DAYS) avoids returning profiles that are
temporally far from the query date, which could skew comparisons.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from sqlalchemy import cast, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.argo_profile import ArgoProfile
from app.schemas.argo import ArgoProfileResponse

logger = logging.getLogger(__name__)

# Search profiles within ±15 days of the query date
DATE_WINDOW_DAYS = 15


async def find_nearest_profile(
    db: AsyncSession,
    lat: float,
    lon: float,
    query_date: date,
) -> ArgoProfileResponse | None:
    """
    Find the geographically nearest Argo profile within DATE_WINDOW_DAYS
    of query_date.

    Args:
        db:         Async SQLAlchemy session.
        lat:        Latitude in decimal degrees.
        lon:        Longitude in decimal degrees.
        query_date: Target date for the search.

    Returns:
        ArgoProfileResponse with distance_km populated, or None if no
        profiles exist in the DB.
    """
    date_from = query_date - timedelta(days=DATE_WINDOW_DAYS)
    date_to = query_date + timedelta(days=DATE_WINDOW_DAYS)

    # Build query point as PostGIS geography
    query_point = ST_SetSRID(ST_MakePoint(lon, lat), 4326)

    # KNN query — ST_Distance returns metres for GEOGRAPHY type
    stmt = (
        select(
            ArgoProfile,
            ST_Distance(ArgoProfile.geom, query_point).label("dist_m"),
        )
        .where(
            ArgoProfile.profile_date.between(date_from, date_to)
        )
        .order_by(text("dist_m ASC"))
        .limit(1)
    )

    result = await db.execute(stmt)
    row = result.first()

    if row is None:
        logger.debug(
            "argo_lookup: no profiles found near lat=%.4f lon=%.4f date=%s",
            lat, lon, query_date,
        )
        return None

    profile, dist_m = row
    dist_km = round(dist_m / 1000, 2)

    logger.debug(
        "argo_lookup: nearest float_id=%s dist=%.1f km date=%s",
        profile.float_id, dist_km, profile.profile_date,
    )

    return ArgoProfileResponse(
        id=profile.id,
        float_id=profile.float_id,
        lat=profile.lat,
        lon=profile.lon,
        profile_date=profile.profile_date,
        depths_m=profile.depths_m,
        temperature_c=profile.temperature_c,
        salinity_psu=profile.salinity_psu,
        quality_flag=profile.quality_flag,
        distance_km=dist_km,
    )
