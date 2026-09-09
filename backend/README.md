# OceanEmbed — Backend

FastAPI backend for reconstructing ocean subsurface temperature profiles
(0–2000m) from satellite surface data. SIH 2026 — Amitesh + Vinay Track.

---

## Quick Start (Docker — recommended)

```bash
cd backend/
cp .env.example .env          # edit if needed (defaults work out of the box)
docker-compose up --build
```

Then open:
- **API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health
- **Readiness**: http://localhost:8000/ready

The backend automatically:
1. Runs Alembic migrations on startup
2. Seeds Arabian Sea + Bay of Bengal regions
3. Starts in mock AI mode (`AI_ENGINE_URL=mock`)

---

## Local Development (without Docker)

### Prerequisites
- Python 3.11+
- PostgreSQL 16 with PostGIS extension
- Redis 7

```bash
cd backend/
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt

cp .env.example .env          # set DB_URL and REDIS_URL to local instances

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed_regions.py
python scripts/seed_argo_sample.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Running Tests

```bash
cd backend/
pip install -r requirements.txt
pytest -v
```

Tests use the FastAPI test client (no Docker / DB needed for unit tests).

---

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/ready` | Readiness probe (checks DB + Redis) |
| GET | `/api/v1/regions` | List ocean regions |
| GET | `/api/v1/argo-nearest?lat=&lon=&date=` | Nearest Argo float profile |
| POST | `/api/v1/reconstruct` | Reconstruct subsurface temperature |

### POST /api/v1/reconstruct

**Request:**
```json
{
  "latitude": 15.0,
  "longitude": 65.0,
  "date": "2023-06-15"
}
```

**Response:**
```json
{
  "depths_m": [0, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000],
  "temperature_c": [28.1, 27.8, 27.2, 25.1, 20.3, 13.2, 6.1, 3.8, 2.7, 2.5],
  "confidence": [0.95, 0.93, 0.91, 0.87, 0.80, 0.72, 0.58, 0.45, 0.38, 0.32],
  "nearest_argo": { ... },
  "cache_hit": false,
  "is_mock": true
}
```

---

## Swapping in the Real AI Model

When Kaushik/Adinath's model is ready:

1. Set `AI_ENGINE_URL=http://ai-engine:8001` in `.env`
2. Uncomment the `ai-engine` block in `docker-compose.yml`
3. **Only `app/services/ai_client.py` changes** — all other code stays the same

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── core/                # config, logging, security
│   ├── api/v1/              # route handlers
│   ├── db/                  # SQLAlchemy models + session
│   ├── schemas/             # Pydantic request/response models
│   ├── services/            # business logic (ai_client, argo_lookup, cache)
│   ├── workers/             # Celery app + tasks
│   └── tests/               # pytest test suite
├── alembic/                 # DB migrations
├── scripts/                 # seed scripts
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── requirements.txt
```

---

## Celery Worker (Batch Pre-computation)

```bash
# In a separate terminal (or use docker-compose celery-worker service)
celery -A app.workers.celery_app worker --loglevel=info
```

Trigger pre-computation for a region (after seeding):
```bash
curl -X POST http://localhost:8000/api/v1/admin/precompute \
  -H "Content-Type: application/json" \
  -d '{"region_id": 1, "date": "2023-06-15"}'
```
