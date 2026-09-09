"""
alembic/env.py
───────────────
Alembic migration environment.
Reads DB_URL from app settings (overrides alembic.ini sqlalchemy.url).
Includes all models via app.db.models so autogenerate works correctly.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

# Load app settings (reads .env)
from app.core.config import settings

# Import all models so Alembic metadata is populated
from app.db.base import Base
import app.db.models  # noqa: F401 — side-effect import registers all models

# Alembic Config object
config = context.config

# For offline mode (SQL script generation) we need a sync/psycopg2 URL.
# For online async mode we use settings.db_url directly (asyncpg).
offline_url = settings.db_url.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)
config.set_main_option("sqlalchemy.url", offline_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL script)."""
    url = config.get_main_option("sqlalchemy.url")  # psycopg2 URL — OK for offline
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations using async engine.

    IMPORTANT: We build the engine directly from settings.db_url (asyncpg)
    — NOT from the alembic config URL (which is psycopg2 for offline mode).
    Using psycopg2 here caused:
        InvalidRequestError: asyncio extension requires an async driver
    """
    connectable = create_async_engine(
        settings.db_url,        # ← asyncpg:// URL — async driver required here
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
