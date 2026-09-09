"""
app/api/v1/regions.py
──────────────────────
GET /api/v1/regions — returns all seeded ocean regions.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.region import Region
from app.db.session import get_db_dependency
from app.schemas.region import RegionResponse, RegionsListResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/regions", tags=["Regions"])


@router.get(
    "",
    response_model=RegionsListResponse,
    summary="List all ocean regions",
    description=(
        "Returns the list of pre-defined ocean regions (e.g. Arabian Sea, "
        "Bay of Bengal). These regions are used by the batch pre-computation "
        "Celery task to warm the cache."
    ),
)
async def list_regions(
    db: AsyncSession = Depends(get_db_dependency),
) -> RegionsListResponse:
    result = await db.execute(select(Region).order_by(Region.name))
    regions = result.scalars().all()

    logger.info("regions: returning %d regions", len(regions))
    return RegionsListResponse(
        count=len(regions),
        regions=[RegionResponse.model_validate(r) for r in regions],
    )
