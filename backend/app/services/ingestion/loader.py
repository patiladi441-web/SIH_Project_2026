"""
app/services/ingestion/loader.py
──────────────────────────────────
Parse NetCDF Argo profile files and load them into the argo_profiles table.

Handles both:
  - Individual profile files (R{float_id}_{cycle}.nc)
  - Synthetic/CSV data for testing without real NetCDF files

Usage (from seed script):
    asyncio.run(load_argo_netcdf("data/raw/argo_sample.nc", db_session))
"""

from __future__ import annotations

import logging
from datetime import date
from pathlib import Path
from typing import Any

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.argo_profile import ArgoProfile

logger = logging.getLogger(__name__)


async def load_argo_netcdf(nc_path: str | Path, db: AsyncSession) -> int:
    """
    Parse a NetCDF Argo profile file and insert records into argo_profiles.
    Returns the number of profiles inserted.
    """
    try:
        import netCDF4 as nc  # type: ignore
        import numpy as np
    except ImportError:
        raise RuntimeError("netCDF4 is required for NetCDF ingestion. pip install netCDF4")

    nc_path = Path(nc_path)
    logger.info("loader: opening %s", nc_path)

    with nc.Dataset(nc_path, "r") as ds:
        float_id = str(getattr(ds, "platform_number", nc_path.stem)).strip()
        n_prof = ds.dimensions["N_PROF"].size

        lats = ds.variables["LATITUDE"][:].filled(float("nan"))
        lons = ds.variables["LONGITUDE"][:].filled(float("nan"))
        dates_raw = ds.variables["JULD"][:]  # Julian days since 1950-01-01
        depths = ds.variables.get("PRES") or ds.variables.get("DEPH")
        temps = ds.variables["TEMP"]

        profiles_inserted = 0
        for i in range(n_prof):
            lat, lon = float(lats[i]), float(lons[i])
            if np.isnan(lat) or np.isnan(lon):
                continue

            # Convert JULD (days since 1950-01-01) → date
            try:
                from datetime import timedelta
                base = date(1950, 1, 1)
                profile_date = base + timedelta(days=float(dates_raw[i]))
            except Exception:
                continue

            depth_vals = list(float(d) for d in depths[i, :].compressed())
            temp_vals = list(float(t) for t in temps[i, :].compressed())

            if len(depth_vals) != len(temp_vals) or not depth_vals:
                continue

            geom = from_shape(Point(lon, lat), srid=4326)

            profile = ArgoProfile(
                float_id=float_id,
                lat=lat,
                lon=lon,
                geom=geom,
                profile_date=profile_date,
                depths_m=depth_vals,
                temperature_c=temp_vals,
            )
            db.add(profile)
            profiles_inserted += 1

    await db.commit()
    logger.info("loader: inserted %d profiles from %s", profiles_inserted, nc_path.name)
    return profiles_inserted


async def load_synthetic_argo(db: AsyncSession, profiles: list[dict[str, Any]]) -> int:
    """
    Insert synthetic Argo profiles directly (no NetCDF needed).
    Used for seeding test data and demos.

    Each dict in `profiles` should have keys:
        float_id, lat, lon, profile_date, depths_m, temperature_c
    """
    from shapely.geometry import Point
    from geoalchemy2.shape import from_shape

    inserted = 0
    for p in profiles:
        geom = from_shape(Point(p["lon"], p["lat"]), srid=4326)
        profile = ArgoProfile(
            float_id=p["float_id"],
            lat=p["lat"],
            lon=p["lon"],
            geom=geom,
            profile_date=p["profile_date"],
            depths_m=p["depths_m"],
            temperature_c=p["temperature_c"],
            salinity_psu=p.get("salinity_psu"),
            quality_flag=p.get("quality_flag", "A"),
        )
        db.add(profile)
        inserted += 1

    await db.commit()
    logger.info("loader: inserted %d synthetic profiles", inserted)
    return inserted
