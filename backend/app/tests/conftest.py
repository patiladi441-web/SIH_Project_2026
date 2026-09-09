"""
app/tests/conftest.py
──────────────────────
pytest fixtures shared across all test modules.
Uses an in-memory SQLite DB for unit tests (no Docker needed for unit tests).
Integration tests can target a real Postgres via TEST_DB_URL env var.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Async HTTP client targeting the FastAPI test app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c
