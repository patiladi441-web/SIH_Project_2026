"""
app/core/security.py
────────────────────
Placeholder for API key / auth logic (Phase 5+).
Import and use `verify_admin_key` as a FastAPI dependency when ready.
"""

from __future__ import annotations

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import settings

_api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)


async def verify_admin_key(api_key: str | None = Security(_api_key_header)) -> str:
    """
    FastAPI dependency — validates the X-Admin-Key header for admin endpoints.

    Usage:
        @router.post("/admin/precompute", dependencies=[Depends(verify_admin_key)])
        async def precompute(): ...
    """
    if api_key != settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing admin API key.",
        )
    return api_key
