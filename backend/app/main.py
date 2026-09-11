"""
app/main.py
────────────
FastAPI application entrypoint.

Run locally:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

In Docker:
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.logging import setup_logging, generate_request_id

# ── Logging (must be first) ───────────────────────────────────────────────────
setup_logging()
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown hooks."""
    logger.info(
        "OceanEmbed API starting up | env=%s | engine=%s",
        settings.app_env,
        settings.ai_engine_url,
    )
    # Pre-warm AI model if available
    try:
        from app.services.transformer_model import engine as model_engine
        model_engine.load()
    except Exception as exc:
        logger.warning("Could not pre-warm model on startup: %s", exc)

    yield
    logger.info("OceanEmbed API shutting down")


# ── App instance ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="OceanEmbed API",
    description=(
        "Reconstructs ocean subsurface temperature profiles (0–2000m) from "
        "satellite surface data using AI. SIH 2026 — Amitesh + Vinay Track.\n\n"
        "**Mock AI mode**: set `AI_ENGINE_URL=mock` in `.env` (default). "
        "Replace with real model URL when ready."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request ID middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request_id = generate_request_id()
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "detail": "An unexpected error occurred. Check server logs.",
            "request_id": getattr(request.state, "request_id", None),
        },
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(v1_router, prefix=settings.api_v1_prefix)


# ── Health / Readiness probes ─────────────────────────────────────────────────
@app.get("/health", tags=["Infrastructure"], summary="Liveness probe")
async def health() -> dict:
    """Simple liveness check — returns 200 if the process is running."""
    return {"status": "ok", "env": settings.app_env}


@app.get("/ready", tags=["Infrastructure"], summary="Readiness probe")
async def ready() -> dict:
    """
    Readiness probe — checks DB + Redis connectivity.
    Returns 200 only when both dependencies are reachable.
    Used by Docker/k8s health checks before routing traffic.
    """
    from app.services.cache_service import ping_redis
    from app.db.session import engine
    from sqlalchemy import text

    results: dict[str, str] = {}

    # Check Redis
    try:
        redis_ok = await ping_redis()
        results["redis"] = "ok" if redis_ok else "unreachable"
    except Exception as e:
        results["redis"] = f"error: {e}"

    # Check DB
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        results["db"] = "ok"
    except Exception as e:
        results["db"] = f"error: {e}"

    all_ok = all(v == "ok" for v in results.values())
    return JSONResponse(
        status_code=status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "ready" if all_ok else "degraded", **results},
    )
