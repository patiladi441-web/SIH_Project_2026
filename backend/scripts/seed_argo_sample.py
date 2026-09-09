"""
scripts/seed_argo_sample.py
─────────────────────────────
Load sample Argo float profiles into the argo_profiles table.

This script inserts synthetic (but realistic) profiles so the
/argo-nearest endpoint returns data without needing a real NetCDF file.

To use a real Argo NetCDF file instead:
    from app.services.ingestion.loader import load_argo_netcdf
    asyncio.run(load_argo_netcdf("data/raw/argo_sample.nc", db))

Usage:
    cd backend/
    python scripts/seed_argo_sample.py
"""

from __future__ import annotations

import asyncio
import math
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.services.ingestion.loader import load_synthetic_argo
from app.core.config import settings

DEPTH_LEVELS = settings.depth_levels


def _synthetic_temp(lat: float, lon: float, depth: int, d: date) -> float:
    """Generate a plausible temperature at a given depth (same formula as ai_client mock)."""
    month = d.month
    season = 2.0 * math.cos(2 * math.pi * (month - 7) / 12)
    surface = 28.0 - 0.4 * abs(lat) + season
    if depth == 0:
        return round(surface, 2)
    elif depth <= 50:
        return round(surface - depth * 0.04, 2)
    elif depth <= 500:
        return round(surface * math.exp(-depth / 200) + 4.0, 2)
    else:
        return round(2.5, 2)


def make_profile(float_id: str, lat: float, lon: float, d: date) -> dict:
    return {
        "float_id": float_id,
        "lat": lat,
        "lon": lon,
        "profile_date": d,
        "depths_m": [float(d) for d in DEPTH_LEVELS],
        "temperature_c": [_synthetic_temp(lat, lon, dep, d) for dep in DEPTH_LEVELS],
        "quality_flag": "A",
    }


# 20 sample profiles scattered across Arabian Sea and Bay of Bengal
SAMPLE_PROFILES = [
    # Arabian Sea
    make_profile("5900001", 15.0, 62.0, date(2023, 6, 10)),
    make_profile("5900001", 15.1, 62.5, date(2023, 6, 20)),
    make_profile("5900002", 18.0, 65.0, date(2023, 6, 15)),
    make_profile("5900003", 12.0, 60.0, date(2023, 7, 1)),
    make_profile("5900004", 20.0, 70.0, date(2023, 7, 5)),
    make_profile("5900005", 10.0, 58.0, date(2023, 6, 25)),
    make_profile("5900006", 22.0, 67.0, date(2023, 8, 1)),
    make_profile("5900007", 8.0,  63.0, date(2023, 8, 15)),
    # Bay of Bengal
    make_profile("5900010", 12.0, 85.0, date(2023, 6, 12)),
    make_profile("5900010", 12.5, 85.5, date(2023, 6, 22)),
    make_profile("5900011", 15.0, 88.0, date(2023, 6, 18)),
    make_profile("5900012", 18.0, 90.0, date(2023, 7, 3)),
    make_profile("5900013", 10.0, 82.0, date(2023, 7, 8)),
    make_profile("5900014", 20.0, 92.0, date(2023, 7, 12)),
    make_profile("5900015", 8.0,  86.0, date(2023, 8, 5)),
    make_profile("5900016", 17.0, 94.0, date(2023, 8, 20)),
    # Equatorial
    make_profile("5900020", 2.0,  75.0, date(2023, 6, 15)),
    make_profile("5900021", -2.0, 80.0, date(2023, 7, 1)),
    make_profile("5900022", 5.0,  70.0, date(2023, 7, 15)),
    make_profile("5900023", -5.0, 85.0, date(2023, 8, 1)),
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        n = await load_synthetic_argo(db, SAMPLE_PROFILES)
        print(f"Inserted {n} Argo profiles.")


if __name__ == "__main__":
    print("Seeding Argo sample profiles...")
    asyncio.run(seed())
