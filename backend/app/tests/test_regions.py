"""
app/tests/test_regions.py
──────────────────────────
Tests for GET /api/v1/regions
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_regions_returns_200(client: AsyncClient):
    """Regions endpoint should always return 200 (even with empty DB)."""
    response = await client.get("/api/v1/regions")
    assert response.status_code == 200


async def test_regions_response_shape(client: AsyncClient):
    """Response should have count and regions keys."""
    response = await client.get("/api/v1/regions")
    data = response.json()
    assert "count" in data
    assert "regions" in data
    assert isinstance(data["regions"], list)
    assert data["count"] == len(data["regions"])


async def test_health_check(client: AsyncClient):
    """Liveness probe should always return 200."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
