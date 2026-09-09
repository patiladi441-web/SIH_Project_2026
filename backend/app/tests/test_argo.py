"""
app/tests/test_argo.py
───────────────────────
Tests for GET /api/v1/argo-nearest
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_argo_nearest_404_when_empty_db(client: AsyncClient):
    """Should return 404 when no Argo profiles exist in DB."""
    response = await client.get(
        "/api/v1/argo-nearest",
        params={"lat": 15.0, "lon": 65.0, "date": "2023-06-15"},
    )
    # Empty DB → 404 is correct behaviour
    assert response.status_code == 404


async def test_argo_nearest_invalid_lat(client: AsyncClient):
    """Out-of-range lat should return 422."""
    response = await client.get(
        "/api/v1/argo-nearest",
        params={"lat": 999.0, "lon": 65.0, "date": "2023-06-15"},
    )
    assert response.status_code == 422


async def test_argo_nearest_missing_params(client: AsyncClient):
    """Missing required query params should return 422."""
    response = await client.get("/api/v1/argo-nearest", params={"lat": 15.0})
    assert response.status_code == 422
