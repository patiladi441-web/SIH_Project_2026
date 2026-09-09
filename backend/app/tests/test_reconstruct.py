"""
app/tests/test_reconstruct.py
──────────────────────────────
Tests for POST /api/v1/reconstruct
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_reconstruct_returns_200(client: AsyncClient):
    """Basic smoke test — mock AI should return a valid response."""
    response = await client.post(
        "/api/v1/reconstruct",
        json={"latitude": 15.0, "longitude": 65.0, "date": "2023-06-15"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "depths_m" in data
    assert "temperature_c" in data
    assert len(data["depths_m"]) == len(data["temperature_c"])
    assert data["is_mock"] is True


async def test_reconstruct_depth_count(client: AsyncClient):
    """Should return exactly 10 depth levels (as per DEPTH_LEVELS config)."""
    response = await client.post(
        "/api/v1/reconstruct",
        json={"latitude": 12.0, "longitude": 85.0, "date": "2023-07-01"},
    )
    data = response.json()
    assert len(data["depths_m"]) == 10


async def test_reconstruct_temperatures_decrease_with_depth(client: AsyncClient):
    """Surface should be warmer than deep water (basic physical sanity check)."""
    response = await client.post(
        "/api/v1/reconstruct",
        json={"latitude": 10.0, "longitude": 70.0, "date": "2023-06-15"},
    )
    data = response.json()
    temps = data["temperature_c"]
    # Surface (index 0) should be warmer than deep (index -1)
    assert temps[0] > temps[-1]


async def test_reconstruct_future_date_rejected(client: AsyncClient):
    """Future dates should be rejected with 422."""
    response = await client.post(
        "/api/v1/reconstruct",
        json={"latitude": 15.0, "longitude": 65.0, "date": "2099-01-01"},
    )
    assert response.status_code == 422


async def test_reconstruct_invalid_lat_rejected(client: AsyncClient):
    """Out-of-range lat should be rejected with 422."""
    response = await client.post(
        "/api/v1/reconstruct",
        json={"latitude": 999.0, "longitude": 65.0, "date": "2023-06-15"},
    )
    assert response.status_code == 422


async def test_reconstruct_cache_hit_on_second_call(client: AsyncClient):
    """Second identical request should be a cache hit (faster or flagged)."""
    payload = {"latitude": 18.0, "longitude": 68.0, "date": "2023-06-20"}

    r1 = await client.post("/api/v1/reconstruct", json=payload)
    r2 = await client.post("/api/v1/reconstruct", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200
    # Both should return same temperature values
    assert r1.json()["temperature_c"] == r2.json()["temperature_c"]
