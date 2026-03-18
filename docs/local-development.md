# Local Development

## Prerequisites

- Python 3.11
- Node.js 20
- Docker Desktop or another Docker runtime

## Environment

1. Copy `.env.example` to `.env`.
2. Fill in GitHub OAuth and email provider values.
3. Keep `DATABASE_URL` in `postgresql+psycopg://...` format.

## Database

Start PostgreSQL:

```bash
docker compose up -d db
```

## API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Web

```bash
cd apps/web
npm install
npm run dev
```

## Local URLs

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Health check: `http://localhost:8000/api/v1/health`
