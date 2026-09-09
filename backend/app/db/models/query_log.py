"""
app/db/models/query_log.py
───────────────────────────
Audit log of every /reconstruct request.
Used for monitoring, analytics, and identifying hot spots for pre-computation.
"""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    query_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Performance
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cache_hit: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # HTTP status of the response
    status_code: Mapped[int] = mapped_column(Integer, default=200, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    def __repr__(self) -> str:
        return (
            f"<QueryLog id={self.id} lat={self.lat} lon={self.lon} "
            f"cache_hit={self.cache_hit} ms={self.response_time_ms}>"
        )
