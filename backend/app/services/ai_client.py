"""
app/services/ai_client.py
──────────────────────────
⚠️  THE SINGLE SWAP POINT FOR THE REAL AI MODEL ⚠️

Right now this is a MOCK implementation that returns a plausible
depth-temperature profile without hitting any model.

When Kaushik/Adinath's model microservice is ready:
  1. Set AI_ENGINE_URL=http://ai-engine:8001 in .env
  2. Replace the _mock_predict() call below with _real_predict()
  3. No other file in the codebase needs to change.

The public interface (predict_profile signature + return type) is FROZEN.
"""

from __future__ import annotations

import logging
import math
import random
from datetime import date

import httpx

from app.core.config import settings
from app.schemas.reconstruct import ReconstructResult

logger = logging.getLogger(__name__)

# ── Public Interface (FROZEN — do not rename or change signature) ─────────────


async def predict_profile(
    lat: float,
    lon: float,
    query_date: date,
) -> ReconstructResult:
    """
    Predict subsurface temperature profile at (lat, lon) for query_date.

    Returns a ReconstructResult with depths_m, temperature_c, confidence.
    nearest_argo is filled in by the /reconstruct endpoint handler (not here).

    Args:
        lat:        Latitude in decimal degrees.
        lon:        Longitude in decimal degrees.
        query_date: Date for the reconstruction.

    Returns:
        ReconstructResult — populated with depths and temperatures.
    """
    if settings.is_mock_ai:
        logger.debug("ai_client: MOCK mode — generating synthetic profile")
        return await _mock_predict(lat, lon, query_date)
    else:
        logger.info(
            "ai_client: forwarding to real model at %s", settings.ai_engine_url
        )
        return await _real_predict(lat, lon, query_date)


# ── Mock Implementation ───────────────────────────────────────────────────────


async def _mock_predict(lat: float, lon: float, query_date: date) -> ReconstructResult:
    """
    Generate a plausible (but fake) depth-temperature profile.

    The curve approximates real ocean thermal structure:
      - Surface (~28°C in tropics) based on lat/season
      - Thermocline: sharp drop between 50–500m
      - Deep water: stabilises near 2–4°C below 1000m
      - Small random noise added for realism
    """
    depths = settings.depth_levels

    # Surface temperature: warmer near equator, rough seasonal adjustment
    month = query_date.month
    season_offset = 2.0 * math.cos(2 * math.pi * (month - 7) / 12)
    surface_temp = 28.0 - 0.4 * abs(lat) + season_offset

    # Seed RNG with (lat, lon, date) for reproducibility on same query
    rng = random.Random(f"{lat:.2f}_{lon:.2f}_{query_date.isoformat()}")

    temps: list[float] = []
    confidences: list[float] = []

    for depth in depths:
        if depth == 0:
            t = surface_temp + rng.gauss(0, 0.3)
        elif depth <= 50:
            # Warm mixed layer
            t = surface_temp - depth * 0.04 + rng.gauss(0, 0.3)
        elif depth <= 500:
            # Thermocline — exponential decay
            t = surface_temp * math.exp(-depth / 200) + 4.0 + rng.gauss(0, 0.5)
        else:
            # Deep water
            t = 2.5 + rng.gauss(0, 0.2)

        temps.append(round(t, 3))

        # Confidence: higher near surface (more satellite data), lower deep
        conf = max(0.3, 0.95 - depth / 3000) + rng.gauss(0, 0.02)
        confidences.append(round(min(1.0, max(0.0, conf)), 3))

    return ReconstructResult(
        depths_m=[float(d) for d in depths],
        temperature_c=temps,
        confidence=confidences,
        nearest_argo=None,  # filled in by reconstruct.py handler
        cache_hit=False,
        is_mock=True,
    )


# ── Real Implementation (activate by setting AI_ENGINE_URL) ──────────────────


async def _real_predict(lat: float, lon: float, query_date: date) -> ReconstructResult:
    """
    Forward the request to the real AI model microservice.
    Expected request:  POST {AI_ENGINE_URL}/predict-profile
                       Body: { "lat": float, "lon": float, "date": "YYYY-MM-DD" }
    Expected response: { "depths_m": [...], "temperature_c": [...], "confidence": [...] }
    """
    payload = {
        "lat": lat,
        "lon": lon,
        "date": query_date.isoformat(),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.ai_engine_url}/predict-profile",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    return ReconstructResult(
        depths_m=data["depths_m"],
        temperature_c=data["temperature_c"],
        confidence=data.get("confidence"),
        nearest_argo=None,
        cache_hit=False,
        is_mock=False,
    )
