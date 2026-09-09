"""
app/schemas/reconstruct.py
───────────────────────────
Pydantic schemas for the /reconstruct endpoint.

CONTRACT (frozen — matches roadmap Section 6.1):
  Request:  { latitude, longitude, date }
  Response: { depths_m, temperature_c, confidence?, nearest_argo? }

Do NOT change the field names here without coordinating with the frontend
and the AI team (ai_client.py output shape must match this schema).
"""

from __future__ import annotations

from datetime import date as Date

from pydantic import BaseModel, Field

from app.schemas.argo import ArgoProfileResponse


class ReconstructRequest(BaseModel):
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude in decimal degrees (WGS84)",
        examples=[12.5],
    )
    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude in decimal degrees (WGS84)",
        examples=[72.3],
    )
    date: Date = Field(
        ...,
        description="Date for reconstruction (YYYY-MM-DD)",
        examples=["2023-06-15"],
    )


class ReconstructResult(BaseModel):
    """
    Internal data class — returned by ai_client.predict_profile().
    Also used as the /reconstruct response body.
    """

    depths_m: list[float] = Field(
        ..., description="Depth levels in metres (0 = surface)"
    )
    temperature_c: list[float] = Field(
        ..., description="Reconstructed temperature (°C) at each depth level"
    )
    confidence: list[float] | None = Field(
        None,
        description="Model confidence score [0–1] at each depth level (None for mock)",
    )
    nearest_argo: ArgoProfileResponse | None = Field(
        None,
        description="Nearest real Argo float profile for comparison",
    )
    cache_hit: bool = Field(
        False,
        description="True if this result was served from cache",
    )
    is_mock: bool = Field(
        True,
        description="True while running the stub AI client",
    )
