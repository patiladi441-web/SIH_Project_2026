"""
app/db/models/argo_profile.py
──────────────────────────────
Argo float profile measurement.

Each row represents one vertical profile: a sequence of (depth, temperature)
pairs measured by an Argo float at a specific (lat, lon, date).

The `geom` column is a PostGIS GEOGRAPHY point (WGS84) used for fast
nearest-neighbour spatial queries via ST_Distance / <-> operator.
"""

from __future__ import annotations

from datetime import date, datetime

from geoalchemy2 import Geography
from sqlalchemy import ARRAY, Date, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ArgoProfile(Base):
    __tablename__ = "argo_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Argo float identifier (e.g. "5904659")
    float_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    # Position
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)

    # PostGIS geography point for spatial queries
    # Type GEOGRAPHY (not GEOMETRY) uses meters by default — better for ocean data
    geom: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326),
        nullable=False,
        index=True,          # spatial index auto-created by GeoAlchemy2
    )

    # Measurement date (not datetime — Argo profiles are daily averages)
    profile_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # Vertical profile arrays — parallel arrays: depths_m[i] ↔ temperature_c[i]
    depths_m: Mapped[list[float]] = mapped_column(ARRAY(Float), nullable=False)
    temperature_c: Mapped[list[float]] = mapped_column(ARRAY(Float), nullable=False)

    # Optional salinity (may be null for older floats)
    salinity_psu: Mapped[list[float] | None] = mapped_column(ARRAY(Float), nullable=True)

    # Data quality flag (A=good, B=probably good, C/D=bad)
    quality_flag: Mapped[str | None] = mapped_column(String(4), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<ArgoProfile id={self.id} float_id={self.float_id!r} "
            f"lat={self.lat} lon={self.lon} date={self.profile_date}>"
        )
