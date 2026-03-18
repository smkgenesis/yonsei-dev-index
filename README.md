# Yonsei Dev Index

Yonsei Dev Index is a low-friction directory of Yonsei-affiliated developers built around GitHub identity.

Production domain:

- `ysdevidx.com`

## Product

The product does only this:

1. A user signs in with GitHub.
2. Their GitHub profile is registered in the directory.
3. They can optionally verify with a Yonsei email.
4. Visitors open the main page and browse other developers.
5. Clicking the nickname or link sends the visitor to that developer's GitHub profile.

That is the whole product.

## Core Principles

- Friction must stay low.
- GitHub is the primary identity.
- The main page is the directory.
- Browsing matters more than search.
- We store as little extra data as possible.

## MVP

Required:

- GitHub OAuth login
- automatic registration from GitHub
- automatic public listing after GitHub login
- homepage developer list
- `GitHubNickname`
- `GitHubLink`
- optional Yonsei verification
- optional real name
- optional major
- profile visibility on/off

Optional:

- simple search
- verified-only filter
- sort by nickname / oldest / newest
- pagination

Explicitly excluded:

- social features
- messaging
- recommendations
- complex search
- internal portfolio pages

## Main UI

The main page should be a minimal directory table.

Columns:

- `GitHubNickname`
- `GitHubLink`
- `Verified` (optional)
- `Name` (optional)
- `Major` (optional)

Click behavior:

- the GitHub nickname links directly to the user's GitHub profile
- the GitHub link column also links directly to the user's GitHub profile

Default directory behavior:

- default sort: `Newest First`
- additional sorts: `GitHubNickname A-Z`, `Oldest First`
- default page size: `50`

The service should help users discover people quickly and then leave for GitHub immediately.

## Verification

Yonsei verification is optional and email-based.

Verification means:

- the user controls a Yonsei email address

Verification enables:

- a `Yonsei Email Verified` badge

Important trust rule:

- `Name` and `Major` are optional self-reported fields
- only the Yonsei email verification badge should be treated as a trust marker
- the product must not imply that name or major were officially verified by Yonsei

## Architecture

- Frontend: Next.js
- Backend: FastAPI
- Database: PostgreSQL
- Auth: GitHub OAuth

Recommended hosts:

- Web: `https://ysdevidx.com`
- API: `https://api.ysdevidx.com`

See [docs/architecture.md](/C:/Users/smkge/Develop/yonsei-dev-index/docs/architecture.md) for the full minimal design.
See [docs/implementation-spec.md](/C:/Users/smkge/Develop/yonsei-dev-index/docs/implementation-spec.md) for the build spec.
See [docs/technical-spec.md](/C:/Users/smkge/Develop/yonsei-dev-index/docs/technical-spec.md) for the technical baseline.
See [docs/local-development.md](/C:/Users/smkge/Develop/yonsei-dev-index/docs/local-development.md) for local setup.

## Running Locally

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Start the API from `apps/api`.
4. Start the web app from `apps/web`.

Use `postgresql+psycopg://...` for `DATABASE_URL`.

API:

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Health: `http://localhost:8000/api/v1/health`

## Testing

API tests:

```bash
cd apps/api
pytest
```

Web checks:

```bash
cd apps/web
npm run lint
npm run build
```

## License

MIT
