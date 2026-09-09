# OceanEmbed — Backend Plan (Amitesh + Vinay Track)

> Is file ko Antigravity/Claude Sonnet backend coding agent ke liye likha gaya hai.
> Model abhi ready nahi hai — is plan me AI engine ko ek **mock/stub microservice** ke through
> integrate kiya jayega jo baad me real trained model se replace ho jayega, bina backend code
> chede.

---

## 0. Problem — Ek Baar Hinglish Me Samjho

**Problem kya hai:**
Satellite se hume samundar ki **upar ki surface** ka data continuously milta hai (temperature,
height, salinity, winds). Lekin samundar ke **andar, depth me** temperature kaisa hai (jo cyclones,
monsoon, fisheries decide karta hai) — wo sirf Argo floats naam ke instruments se milta hai, jo
bahut kam (sparse) hain aur har 10 din me ek jagah measure karte hain.

**Hum kya solve kar rahe hain:**
Ek AI model bana rahe hain jo surface satellite data dekh kar **predict** kare ki neeche (0-2000m
depth tak) temperature kaisa hoga — bina wahan Argo float bheje. Yani surface data se subsurface
data "reconstruct" karna.

**Backend (hamara track) ka kaam kya hai:**
Backend AI model nahi banata — backend ek **pipeline/service layer** hai jo:
1. Bade satellite datasets (NetCDF files) ko download/store/serve karta hai.
2. User ki query (lat, lon, date) leta hai.
3. Us query ko AI engine (model) ko forward karta hai, result wapas leta hai.
4. Result ko cache karta hai (taaki same query dobara AI model tak na jaye — fast response).
5. Nearest real Argo float ka data bhi dhoondh kar deta hai (comparison ke liye — "AI ne jo bola
   wo sach ke kitna paas hai" dikhane ke liye).
6. Sab kuch Docker me packaged, ek command me deployable.

**Kaise solve karenge (backend approach):**
- FastAPI se REST API banayenge (`/reconstruct`, `/argo-nearest`, `/regions`).
- PostgreSQL + PostGIS me geospatial data (Argo profiles, regions) store karenge.
- Redis se caching + Celery se background/batch jobs (poore region ka pre-computation).
- AI model abhi nahi hai, isliye ek **fake/mock AI client** banayenge jo random-but-realistic
  profile return karega — jab real model ready ho, sirf ek file (`ai_client.py`) replace karni
  hogi, baaki backend untouched rahega.
- Docker Compose se sab services (backend, postgres, redis, nginx, [ai-engine placeholder])
  ek saath chalayenge.

---

## 1. Backend Tech Stack (Recap)

| Layer | Choice |
|---|---|
| Language/Framework | Python 3.11 + FastAPI |
| Geospatial data read | xarray, netCDF4, h5netcdf |
| DB | PostgreSQL 16 + PostGIS |
| ORM | SQLAlchemy 2.0 (async) + Alembic (migrations) |
| Cache | Redis 7 |
| Background jobs | Celery + Redis broker |
| Object storage | Local volume / MinIO (S3-compatible) |
| API docs | OpenAPI/Swagger (auto via FastAPI) |
| Containerization | Docker + docker-compose |
| Reverse proxy | Nginx |
| Testing | pytest + httpx (async test client) |
| Config | pydantic-settings + `.env` |

---

## 2. Folder Structure (production-grade, easy to explain)

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entrypoint
│   ├── core/
│   │   ├── config.py           # settings via pydantic-settings
│   │   ├── logging.py          # structured logging setup
│   │   └── security.py         # (future) API keys/auth
│   ├── api/
│   │   └── v1/
│   │       ├── router.py       # combines all route modules
│   │       ├── reconstruct.py  # POST /reconstruct
│   │       ├── argo.py         # GET /argo-nearest
│   │       └── regions.py      # GET /regions
│   ├── db/
│   │   ├── session.py          # async engine + session maker
│   │   ├── base.py             # declarative base
│   │   └── models/
│   │       ├── argo_profile.py
│   │       ├── region.py
│   │       └── reconstruction_cache.py
│   ├── schemas/                # Pydantic request/response models
│   │   ├── reconstruct.py
│   │   ├── argo.py
│   │   └── region.py
│   ├── services/
│   │   ├── ai_client.py        # ⚠️ swap point for real model later (mock now)
│   │   ├── argo_lookup.py      # PostGIS nearest-neighbour query logic
│   │   ├── cache_service.py    # Redis get/set for reconstructions
│   │   └── ingestion/
│   │       ├── download.py     # fetch NetCDF datasets from sources
│   │       └── loader.py       # parse NetCDF -> DB/file store
│   ├── workers/
│   │   ├── celery_app.py
│   │   └── tasks.py            # batch pre-computation jobs
│   └── tests/
│       ├── test_reconstruct.py
│       ├── test_argo.py
│       └── test_regions.py
├── alembic/                    # DB migrations
├── scripts/
│   ├── seed_regions.py         # insert demo regions (Arabian Sea, BoB)
│   └── seed_argo_sample.py     # load a small sample Argo dataset
├── Dockerfile
├── docker-compose.yml          # postgres, redis, backend, nginx, (ai-engine stub)
├── .env.example
├── requirements.txt
└── README.md
```

**Why this structure:** `api/` (routes) is separated from `services/` (business logic) is
separated from `db/` (models) — so koi bhi naya dev/agent ek folder dekh kar samajh jaye "yahan
sirf routes hain, yahan sirf DB models hain." `ai_client.py` ek single file hai — model integrate
karte waqt sirf yehi file badalni hai.

---

## 3. Phase-Wise Plan

### Phase 0 — Bootstrap (Day 1)
- [ ] Init repo structure exactly as Section 2.
- [ ] `requirements.txt`: fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, alembic, redis,
      celery, xarray, netCDF4, pydantic-settings, pytest, httpx.
- [ ] `app/core/config.py` — load DB_URL, REDIS_URL, AI_ENGINE_URL, GRID_RESOLUTION,
      DEPTH_LEVELS (fixed list: 0,10,20,50,100,200,500,1000,1500,2000) from `.env`.
- [ ] `app/main.py` — FastAPI app with `/health` endpoint.
- [ ] Dockerfile (multi-stage, slim python base).
- [ ] `docker-compose.yml` v1: `backend`, `postgres` (postgis/postgis image), `redis`.
- [ ] **Definition of done:** `docker-compose up` → `curl localhost:8000/health` returns 200.

### Phase 1 — Data Model + Schema
- [ ] Design tables (SQLAlchemy models + Alembic migration):
  - `regions(id, name, lat_min, lat_max, lon_min, lon_max)`
  - `argo_profiles(id, float_id, lat, lon, date, depths_m[], temperature_c[])` — geography
    column via PostGIS for lat/lon.
  - `reconstruction_cache(id, lat, lon, date, depths_m[], temperature_c[], confidence[],
    nearest_argo_id, created_at)`
  - `query_logs(id, lat, lon, date, response_time_ms, cache_hit, created_at)`
- [ ] Enable PostGIS extension in migration.
- [ ] `scripts/seed_regions.py` — insert 2 demo regions (Arabian Sea, Bay of Bengal).
- [ ] **Definition of done:** Alembic migration runs clean; regions table seeded and queryable.

### Phase 2 — Read-Only Endpoints (no AI dependency yet)
- [ ] `GET /regions` — returns seeded regions (matches contract in Section 6.2 of roadmap doc).
- [ ] Data ingestion utility (`services/ingestion/download.py` + `loader.py`) — download a small
      sample Argo dataset (or accept a manually-placed NetCDF/CSV file), parse into
      `argo_profiles` table.
- [ ] `services/argo_lookup.py` — PostGIS `ST_Distance` / `ORDER BY geom <-> point LIMIT 1` query
      to find nearest Argo profile to a given lat/lon/date.
- [ ] `GET /argo-nearest?lat=&lon=&date=` — wraps `argo_lookup.py`.
- [ ] **Definition of done:** with sample seeded data, `/argo-nearest` returns nearest real
      profile in <200ms.

### Phase 3 — Mock AI Client + `/reconstruct` (model-independent)
> Model abhi nahi hai — is phase ka goal hai ki poora `/reconstruct` flow kaam kare **mock data
> ke saath**, taaki frontend turant integrate ho sake, aur baad me sirf `ai_client.py` swap ho.

- [ ] `services/ai_client.py`:
  - Define interface: `async def predict_profile(lat, lon, date) -> ReconstructResult`.
  - Mock implementation: return plausible fake depth-temperature curve (e.g. decreasing
    temperature with depth + small noise) + fake confidence scores.
  - Read `AI_ENGINE_URL` from config — when real model microservice exists, just switch this
    function to call `POST {AI_ENGINE_URL}/predict-profile` via httpx instead of generating mock
    data. **No other file needs to change.**
- [ ] `POST /reconstruct` (contract exactly as roadmap Section 6.1):
  - Request: `{latitude, longitude, date}`
  - Flow: check `cache_service` (Redis) → if miss, check `reconstruction_cache` table → if miss,
    call `ai_client.predict_profile()` → join with `argo_lookup` for `nearest_argo` → store in
    cache (Redis + DB) → log to `query_logs` → return response.
  - Response: `{depths_m, temperature_c, confidence?, nearest_argo}`
- [ ] **Definition of done:** end-to-end `/reconstruct` call works fully on mock data, cache hit
      on 2nd identical call is measurably faster, response matches exact contract shape.

### Phase 4 — Caching, Batch Jobs, Async Infra
- [ ] `services/cache_service.py` — Redis key = `hash(lat,lon,date)`, TTL configurable.
- [ ] `workers/celery_app.py` + `workers/tasks.py` — Celery task `precompute_region(region_id,
      date_range)` that loops over the region's grid at `GRID_RESOLUTION` and calls
      `/reconstruct` logic directly (not via HTTP) to warm the cache.
- [ ] Add `celery-worker` service to `docker-compose.yml`.
- [ ] Add simple admin trigger: `POST /admin/precompute` (protect later with API key).
- [ ] **Definition of done:** triggering precompute for a demo region fills
      `reconstruction_cache`; subsequent `/reconstruct` calls for that grid are cache hits.

### Phase 5 — Production Hardening
- [ ] Structured logging (JSON logs, request IDs) via `core/logging.py`.
- [ ] Global exception handlers (consistent error JSON shape).
- [ ] Input validation edge cases: lat/lon out of range, date out of dataset coverage,
      region-not-covered → proper 4xx responses, not 500s.
- [ ] Rate limiting on `/reconstruct` (basic, e.g. slowapi) to protect against demo-day abuse.
- [ ] Health/readiness probes (`/health`, `/ready` — checks DB + Redis connectivity).
- [ ] pytest suite: unit tests for `argo_lookup`, `cache_service`, `ai_client` (mock mode);
      integration test for full `/reconstruct` round trip using test DB.
- [ ] `.env.example` fully documented; secrets never committed.
- [ ] README.md: how to run locally, run tests, run migrations, seed data.
- [ ] **Definition of done:** `docker-compose up --build` from a clean clone gives a fully
      working, migrated, seeded, tested backend with zero manual steps beyond `.env` copy.

### Phase 6 — Finale/Demo Prep
- [ ] Nginx reverse proxy in front of backend (single entry point, matches roadmap Section 6.3).
- [ ] Pre-warm cache for exact demo region + date range (run Celery precompute task).
- [ ] Export a DB snapshot / backup dataset in case live network/data source fails at venue.
- [ ] Final `docker-compose.yml` includes: `backend`, `postgres`, `redis`, `celery-worker`,
      `nginx`, and a placeholder `ai-engine` service block (commented out until Kaushik/Adinath's
      model image is ready — swap `ai_client.py` target URL to it).
- [ ] Load-test `/reconstruct` and `/regions` (e.g. with `hey` or `locust`) for expected demo
      concurrency.

---

## 4. AI Model Swap-In (for later, no action now)

Jab model ready ho jaye, sirf yeh karna hai:
1. `ai_client.py` me mock function ko replace karo real HTTP call se:
   `POST {AI_ENGINE_URL}/predict-profile` with `{lat, lon, date}` → expects same
   `{depths_m, temperature_c, confidence}` shape.
2. `docker-compose.yml` me `ai-engine` service uncomment karo (AI team ka Docker image).
3. `.env` me `AI_ENGINE_URL=http://ai-engine:PORT` set karo.
4. Koi aur backend code change nahi chahiye — API contract already frozen (Section 6.1).

---

## 5. Weekly Checkpoint Mapping (Backend View)

| Roadmap Week | This Plan's Phase |
|---|---|
| Week 1 | Phase 0 + Phase 1 |
| Week 2 | Phase 2 |
| Week 3 | Phase 3 |
| Week 4 | Phase 4 + Phase 5 (start) |
| Week 5/Finale | Phase 5 (finish) + Phase 6 |
