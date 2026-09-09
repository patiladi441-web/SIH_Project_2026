# app/db/models/__init__.py
# Import all models here so Alembic autogenerate can detect them.
from app.db.models.region import Region  # noqa: F401
from app.db.models.argo_profile import ArgoProfile  # noqa: F401
from app.db.models.reconstruction_cache import ReconstructionCache  # noqa: F401
from app.db.models.query_log import QueryLog  # noqa: F401
