"""
app/schemas/region.py
──────────────────────
Pydantic schemas for the /regions endpoint.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class RegionResponse(BaseModel):
    id: int
    name: str
    lat_min: float = Field(..., description="Southern boundary (degrees)")
    lat_max: float = Field(..., description="Northern boundary (degrees)")
    lon_min: float = Field(..., description="Western boundary (degrees)")
    lon_max: float = Field(..., description="Eastern boundary (degrees)")
    description: str | None = None

    model_config = {"from_attributes": True}


class RegionsListResponse(BaseModel):
    count: int
    regions: list[RegionResponse]
