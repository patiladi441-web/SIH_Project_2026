"""
app/services/ingestion/download.py
────────────────────────────────────
Utilities to fetch NetCDF datasets from remote sources.

Currently supports:
  - Copernicus Marine (CMEMS) via direct URL
  - NOAA Argo GDAC via FTP/HTTPS mirror

Usage:
    asyncio.run(download_argo_gdac(output_dir="data/raw"))
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

# Public mirrors — no auth required for sample data
ARGO_SAMPLE_URL = (
    "https://data-argo.ifremer.fr/dac/aoml/5904659/profiles/R5904659_001.nc"
)


async def download_file(url: str, dest_path: Path, chunk_size: int = 1 << 20) -> Path:
    """
    Stream-download a file from `url` to `dest_path`.
    Returns dest_path on success.
    """
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info("download: starting %s → %s", url, dest_path)
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length", 0))
            downloaded = 0

            with open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size):
                    f.write(chunk)
                    downloaded += len(chunk)

    logger.info(
        "download: complete %s (%.1f MB)", dest_path.name, downloaded / 1e6
    )
    return dest_path


async def download_argo_sample(output_dir: str = "data/raw") -> Path:
    """
    Download a single Argo float profile NetCDF for demo/seed purposes.
    Returns the path to the downloaded file.
    """
    dest = Path(output_dir) / "argo_sample.nc"
    if dest.exists():
        logger.info("download: sample already exists at %s, skipping", dest)
        return dest
    return await download_file(ARGO_SAMPLE_URL, dest)
