"""Initial schema: regions, argo_profiles, reconstruction_cache, query_logs

Revision ID: 0001_initial
Revises: 
Create Date: 2026-09-08
"""

from __future__ import annotations
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enable PostGIS ────────────────────────────────────────────────────────
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # ── regions ───────────────────────────────────────────────────────────────
    op.create_table(
        "regions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(128), nullable=False, unique=True),
        sa.Column("lat_min", sa.Float(), nullable=False),
        sa.Column("lat_max", sa.Float(), nullable=False),
        sa.Column("lon_min", sa.Float(), nullable=False),
        sa.Column("lon_max", sa.Float(), nullable=False),
        sa.Column("description", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_regions_name", "regions", ["name"])

    # ── argo_profiles ─────────────────────────────────────────────────────────
    op.create_table(
        "argo_profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("float_id", sa.String(32), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column(
            "geom",
            geoalchemy2.Geography(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("profile_date", sa.Date(), nullable=False),
        sa.Column("depths_m", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column("temperature_c", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column("salinity_psu", sa.ARRAY(sa.Float()), nullable=True),
        sa.Column("quality_flag", sa.String(4), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_argo_profiles_float_id", "argo_profiles", ["float_id"])
    op.create_index("ix_argo_profiles_profile_date", "argo_profiles", ["profile_date"])
    # PostGIS spatial index (GIST) — created automatically by GeoAlchemy2
    # but we also add it explicitly for clarity:
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_argo_profiles_geom "
        "ON argo_profiles USING GIST (geom)"
    )

    # ── reconstruction_cache ──────────────────────────────────────────────────
    op.create_table(
        "reconstruction_cache",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("query_date", sa.Date(), nullable=False),
        sa.Column("depths_m", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column("temperature_c", sa.ARRAY(sa.Float()), nullable=False),
        sa.Column("confidence", sa.ARRAY(sa.Float()), nullable=True),
        sa.Column(
            "nearest_argo_id",
            sa.Integer(),
            sa.ForeignKey("argo_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("is_mock", sa.Boolean(), default=True, nullable=False),
        sa.Column("cache_key", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_reconstruction_cache_lat", "reconstruction_cache", ["lat"])
    op.create_index("ix_reconstruction_cache_lon", "reconstruction_cache", ["lon"])
    op.create_index("ix_reconstruction_cache_query_date", "reconstruction_cache", ["query_date"])
    op.create_index("ix_reconstruction_cache_cache_key", "reconstruction_cache", ["cache_key"])

    # ── query_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "query_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("query_date", sa.Date(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("cache_hit", sa.Boolean(), default=False, nullable=False),
        sa.Column("status_code", sa.Integer(), default=200, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("query_logs")
    op.drop_table("reconstruction_cache")
    op.drop_table("argo_profiles")
    op.drop_table("regions")
