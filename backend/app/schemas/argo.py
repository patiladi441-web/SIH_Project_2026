"""
app/schemas/argo.py
────────────────────
Pydantic schemas for the /argo-nearest endpoint.
"""

from __future__ import annotations

from datetime import date as Date

from pydantic import BaseModel, Field


class ArgoNearestRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    date: Date = Field(..., description="Target date (YYYY-MM-DD)")


class ArgoProfileResponse(BaseModel):
    id: int
    float_id: str
    lat: float
    lon: float
    profile_date: Date
    depths_m: list[float]
    temperature_c: list[float]
    salinity_psu: list[float] | None = None
    quality_flag: str | None = None
    # Distance from query point in kilometres
    distance_km: float | None = Field(None, description="Distance from query point (km)")

    model_config = {"from_attributes": True}
