"""
app/db/session.py
─────────────────
Async SQLAlchemy engine + session factory.

Usage in endpoints / services:
    async with get_db() as db:
        result = await db.execute(...)
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.db_url,
    echo=settings.app_env == "development",  # log SQL only in dev
    pool_pre_ping=True,                       # test connection on checkout
    pool_size=10,
    max_overflow=20,
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager that yields a database session and handles
    commit/rollback automatically.

    Example:
        async with get_db() as db:
            await db.execute(select(Region))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db_dependency() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency version of get_db (use with Depends()).

    Example:
        @router.get("/foo")
        async def foo(db: AsyncSession = Depends(get_db_dependency)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
