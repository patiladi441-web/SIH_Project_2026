"""
scripts/seed_regions.py
────────────────────────
Inserts demo ocean regions (Arabian Sea, Bay of Bengal) into the DB.
Safe to re-run — skips if region already exists.

Usage:
    cd backend/
    python scripts/seed_regions.py
"""

from __future__ import annotations

import asyncio
import sys
import os

# Allow running from backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.region import Region

REGIONS = [
    {
        "name": "Arabian Sea",
        "lat_min": 5.0,
        "lat_max": 25.0,
        "lon_min": 55.0,
        "lon_max": 78.0,
        "description": (
            "The Arabian Sea lies northwest of the Indian subcontinent. "
            "Critical for Indian Ocean Dipole monitoring and monsoon prediction."
        ),
    },
    {
        "name": "Bay of Bengal",
        "lat_min": 5.0,
        "lat_max": 22.0,
        "lon_min": 80.0,
        "lon_max": 100.0,
        "description": (
            "The Bay of Bengal is a semi-enclosed sea in the northeastern Indian Ocean. "
            "High cyclone activity and freshwater input from major rivers."
        ),
    },
    {
        "name": "Indian Ocean Equatorial Zone",
        "lat_min": -10.0,
        "lat_max": 10.0,
        "lon_min": 40.0,
        "lon_max": 100.0,
        "description": (
            "Equatorial Indian Ocean region spanning both Arabian Sea and "
            "Bay of Bengal approaches. Key for global heat transport studies."
        ),
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        inserted = 0
        skipped = 0
        for region_data in REGIONS:
            existing = (
                await db.execute(
                    select(Region).where(Region.name == region_data["name"])
                )
            ).scalar_one_or_none()

            if existing:
                print(f"  [SKIP] Region already exists: {region_data['name']}")
                skipped += 1
                continue

            region = Region(**region_data)
            db.add(region)
            inserted += 1
            print(f"  [ADD]  {region_data['name']}")

        await db.commit()
        print(f"\nDone — inserted: {inserted}, skipped: {skipped}")


if __name__ == "__main__":
    print("Seeding ocean regions...")
    asyncio.run(seed())
