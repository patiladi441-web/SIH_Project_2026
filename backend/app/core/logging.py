"""
app/core/logging.py
───────────────────
Structured JSON logging setup.
Call `setup_logging()` once at app startup (in main.py).
All modules use `logging.getLogger(__name__)` normally after that.
"""

from __future__ import annotations

import logging
import sys
import uuid

from pythonjsonlogger import jsonlogger

from app.core.config import settings


class RequestIdFilter(logging.Filter):
    """Injects a `request_id` field into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        if not hasattr(record, "request_id"):
            record.request_id = "—"
        return True


def setup_logging() -> None:
    """Configure root logger with JSON formatter and correct level."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s %(request_id)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(log_level)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def generate_request_id() -> str:
    return uuid.uuid4().hex[:12]
