"""
app/api/v1/router.py
─────────────────────
Combines all v1 route modules into a single APIRouter.
Included in main.py with prefix /api/v1.
"""

from fastapi import APIRouter

from app.api.v1 import argo, query_logs, reconstruct, regions

router = APIRouter()

router.include_router(regions.router)
router.include_router(argo.router)
router.include_router(reconstruct.router)
router.include_router(query_logs.router)
