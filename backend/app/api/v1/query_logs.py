"""
app/api/v1/query_logs.py
─────────────────────────
GET /api/v1/query-logs — returns paginated query history from PostgreSQL.

Each entry is an audit record written by /reconstruct whenever a user
queries a location. Used by the frontend "Query History" panel.
"""

from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.query_log import QueryLog
from app.db.session import get_db_dependency

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/query-logs", tags=["Query Logs"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class QueryLogEntry(BaseModel):
    id: int
    lat: float
    lon: float
    query_date: str           # ISO date string YYYY-MM-DD
    response_time_ms: int | None
    cache_hit: bool
    status_code: int
    created_at: str           # ISO datetime string

    model_config = {"from_attributes": True}


class QueryLogsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    cache_hit_rate: float     # 0.0 – 1.0
    logs: list[QueryLogEntry]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=QueryLogsResponse,
    summary="List recent query history",
    description=(
        "Returns a paginated list of past /reconstruct queries logged in "
        "PostgreSQL, sorted newest-first. Includes cache-hit rate for the "
        "current page and overall record count."
    ),
)
async def list_query_logs(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    db: AsyncSession = Depends(get_db_dependency),
) -> QueryLogsResponse:
    # Total count
    count_result = await db.execute(select(func.count()).select_from(QueryLog))
    total: int = count_result.scalar_one()

    # Paginated rows — newest first
    offset = (page - 1) * page_size
    stmt = (
        select(QueryLog)
        .order_by(QueryLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).scalars().all()

    # Cache-hit rate across returned rows
    hits = sum(1 for r in rows if r.cache_hit)
    cache_hit_rate = hits / len(rows) if rows else 0.0

    entries = [
        QueryLogEntry(
            id=r.id,
            lat=r.lat,
            lon=r.lon,
            query_date=str(r.query_date),
            response_time_ms=r.response_time_ms,
            cache_hit=r.cache_hit,
            status_code=r.status_code,
            created_at=r.created_at.isoformat() if isinstance(r.created_at, datetime) else str(r.created_at),
        )
        for r in rows
    ]

    logger.info(
        "query_logs: page=%d page_size=%d total=%d hit_rate=%.2f",
        page, page_size, total, cache_hit_rate,
    )

    return QueryLogsResponse(
        total=total,
        page=page,
        page_size=page_size,
        cache_hit_rate=round(cache_hit_rate, 3),
        logs=entries,
    )
