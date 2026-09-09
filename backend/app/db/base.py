"""
app/db/base.py
──────────────
SQLAlchemy declarative base shared by all models.
Import `Base` here — never create a new Base elsewhere.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """All ORM models inherit from this class."""
    pass
