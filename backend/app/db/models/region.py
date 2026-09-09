"""
app/db/models/region.py
────────────────────────
Ocean region bounding box — e.g. Arabian Sea, Bay of Bengal.
Used by the batch pre-computation Celery task to know which grid to warm.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Region(Base):
    __tablename__ = "regions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)

    # Bounding box in decimal degrees
    lat_min: Mapped[float] = mapped_column(Float, nullable=False)
    lat_max: Mapped[float] = mapped_column(Float, nullable=False)
    lon_min: Mapped[float] = mapped_column(Float, nullable=False)
    lon_max: Mapped[float] = mapped_column(Float, nullable=False)

    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<Region id={self.id} name={self.name!r} "
            f"bbox=[{self.lat_min},{self.lon_min} → {self.lat_max},{self.lon_max}]>"
        )
