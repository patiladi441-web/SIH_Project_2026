"""
app/api/v1/argo.py
───────────────────
GET /api/v1/argo-nearest — returns the nearest real Argo float profile.
"""

from __future__ import annotations

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_dependency
from app.schemas.argo import ArgoProfileResponse
from app.services.argo_lookup import find_nearest_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/argo-nearest", tags=["Argo Profiles"])


@router.get(
    "",
    response_model=ArgoProfileResponse,
    summary="Find nearest Argo float profile",
    description=(
        "Returns the geographically nearest real Argo float profile within "
        "±15 days of the requested date. Used by the frontend to show ground-truth "
        "comparison alongside the AI reconstruction."
    ),
)
async def get_nearest_argo(
    lat: float = Query(..., ge=-90, le=90, description="Latitude (decimal degrees)"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude (decimal degrees)"),
    date: date = Query(..., description="Target date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db_dependency),
) -> ArgoProfileResponse:
    profile = await find_nearest_profile(db, lat, lon, date)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No Argo profiles found near the requested location/date. "
                "Try seeding sample data with: python scripts/seed_argo_sample.py"
            ),
        )

    return profile
