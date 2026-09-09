"""
app/core/config.py
──────────────────
Centralised settings loaded from environment variables / .env file.
All other modules import `settings` from here — never os.getenv() directly.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    app_name: str = "OceanEmbed API"
    app_env: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"

    # ── Database ──────────────────────────────────────────────────────────────
    db_url: str = "postgresql+asyncpg://oceanembed:secret@localhost:5432/oceanembed"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # ── AI Engine ─────────────────────────────────────────────────────────────
    # When "mock", ai_client.py generates synthetic data.
    # Set to a real URL (e.g. http://ai-engine:8001) to forward to the model.
    ai_engine_url: str = "mock"

    # ── Grid / depth config ───────────────────────────────────────────────────
    grid_resolution: float = 0.25  # degrees

    # Accepts both formats:
    #   comma-separated:  DEPTH_LEVELS=0,10,20,50,100
    #   JSON array:       DEPTH_LEVELS=[0,10,20,50,100]
    depth_levels: List[int] = [0, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000]

    @field_validator("depth_levels", mode="before")
    @classmethod
    def parse_depth_levels(cls, v: Any) -> Any:
        """Accept comma-separated string OR JSON array string for DEPTH_LEVELS."""
        if isinstance(v, str):
            # Strip brackets if present (e.g. "[0,10,20]" → "0,10,20")
            v = v.strip().lstrip("[").rstrip("]")
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        return v

    # ── Celery ────────────────────────────────────────────────────────────────
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ── Security ──────────────────────────────────────────────────────────────
    admin_api_key: str = "changeme"  # override in production .env

    @property
    def is_mock_ai(self) -> bool:
        """Returns True when running with the stub AI client."""
        return self.ai_engine_url.lower() == "mock"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton pattern)."""
    return Settings()


# Convenience import alias used throughout the codebase
settings = get_settings()
