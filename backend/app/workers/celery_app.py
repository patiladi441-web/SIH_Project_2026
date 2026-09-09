"""
app/workers/celery_app.py
──────────────────────────
Celery application instance.
Import `celery_app` here for tasks and in docker-compose worker command.
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "oceanembed",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
    broker_connection_retry_on_startup=True,
)
