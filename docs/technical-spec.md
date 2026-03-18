# Yonsei Dev Index Technical Spec

## 1. Purpose

This document fixes the technical baseline for V1.

It defines:

- the chosen stack
- the responsibility of each layer
- runtime and deployment boundaries
- environment variables
- technical decisions that should not drift during implementation

## 2. Chosen Stack

### Frontend

- Next.js
- TypeScript
- App Router

### Backend

- FastAPI
- Python 3.11
- SQLAlchemy
- Alembic
- Pydantic

### Database

- PostgreSQL 16

### Authentication

- GitHub OAuth App
- server-side session cookie

### Email

- transactional email provider via SMTP or API

### Deployment

- Web app on `ysdevidx.com`
- API on `api.ysdevidx.com`

## 3. Why This Stack

### Next.js

Use Next.js because:

- V1 needs a simple web UI, not a client-heavy SPA
- the homepage directory is straightforward to render with server components or standard data fetching
- TypeScript helps keep API integration clear

### FastAPI

Use FastAPI because:

- GitHub OAuth and email verification are ordinary backend flows
- request/response modeling is simple with Pydantic
- it is fast to build and easy to test

### PostgreSQL

Use PostgreSQL because:

- the data model is small and relational
- pagination and sorting queries are trivial
- no separate search engine is needed for V1

### Session Cookie Auth

Use server-issued session cookies because:

- the frontend does not need direct GitHub tokens
- auth stays simple for both browser navigation and API calls
- security boundaries are clearer than storing OAuth state in the frontend

## 4. Architecture Overview

```text
Browser
  -> Next.js web app (`ysdevidx.com`)
  -> FastAPI API (`api.ysdevidx.com`)
  -> PostgreSQL
  -> GitHub OAuth
  -> Email provider
```

Flow summary:

1. user interacts with the Next.js app
2. login starts through the FastAPI backend
3. FastAPI completes GitHub OAuth
4. FastAPI stores user/profile data in PostgreSQL
5. FastAPI sets session cookie
6. Next.js fetches directory or settings data from the API
7. email verification is handled by FastAPI through the email provider

## 5. Layer Responsibilities

### 5.1 Next.js

Owns:

- homepage directory UI
- login button UI
- settings screens
- query-string driven sorting, filtering, and pagination state

Does not own:

- OAuth token exchange
- session issuance
- verification code generation
- database access

### 5.2 FastAPI

Owns:

- GitHub OAuth start/callback
- session creation and invalidation
- directory API
- user profile update API
- verification request/confirm API
- server-side validation

Does not own:

- visual rendering
- frontend route layout

### 5.3 PostgreSQL

Owns:

- users
- GitHub identity linkage
- optional profile fields
- verification state
- verification request lifecycle

## 6. API and Host Boundaries

### Web origin

- `https://ysdevidx.com`

### API origin

- `https://api.ysdevidx.com`

### API base path

- `/api/v1`

### GitHub callback

- `https://api.ysdevidx.com/api/v1/auth/github/callback`

### Session cookie

- domain: `.ysdevidx.com`
- `HttpOnly=true`
- `Secure=true`
- `SameSite=Lax`

## 7. Frontend Technical Decisions

### Rendering

V1 can use normal Next.js data fetching without introducing heavy client state tools.

Recommended approach:

- render homepage from server side data fetch or route-level fetch
- keep sorting, filtering, and page state in URL query parameters
- use small client components only where interaction requires it

### Styling

Keep styling simple and table-oriented.

Recommended baseline:

- plain CSS modules or a lightweight global stylesheet
- no heavy design system for V1
- no component library unless implementation speed clearly improves

### State Management

Do not introduce a global client state library.

Use:

- URL state for directory controls
- local component state for forms
- API responses as the source of truth

## 8. Backend Technical Decisions

### API style

- REST only

Do not introduce:

- GraphQL
- RPC frameworks

### Database access

- SQLAlchemy ORM for models and queries
- Alembic for schema migrations

### Validation

- Pydantic models for all request and response contracts

### Sessions

Recommended approach:

- opaque session ID stored in cookie
- session persisted server-side

For V1, session storage may be:

- PostgreSQL

Redis is not required in V1.

### Verification code policy

- 6-digit or similarly short code
- hash before storage
- expiry around 10 minutes
- invalidate older pending requests
- rate-limit requests and confirmation attempts

## 9. Database Technical Decisions

### Version

- PostgreSQL 16

### Required capabilities

- standard relational integrity
- indexes for pagination and sorting
- simple text search if `q` is enabled

### Suggested indexes

- `users(created_at)`
- `oauth_accounts(github_username)`
- `verifications(user_id)`
- partial or supporting indexes for directory listing as needed

No advanced search infrastructure is required.

## 10. Email Delivery

The product only needs transactional verification mail.

Requirements:

- send verification code to `@yonsei.ac.kr`
- support low email volume reliably
- expose delivery failures clearly in logs

Acceptable implementations:

- SMTP provider
- email API provider

V1 does not require a custom mail pipeline.

## 11. Environment Variables

Backend:

- `APP_ENV`
- `APP_SECRET_KEY`
- `DATABASE_URL`
- `SESSION_COOKIE_DOMAIN`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `EMAIL_FROM`
- `EMAIL_PROVIDER_API_KEY` or SMTP credentials

Frontend:

- `NEXT_PUBLIC_WEB_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Production recommendations:

- `NEXT_PUBLIC_WEB_URL=https://ysdevidx.com`
- `NEXT_PUBLIC_API_BASE_URL=https://api.ysdevidx.com/api/v1`
- `DATABASE_URL=postgresql+psycopg://...`
- `SESSION_COOKIE_DOMAIN=.ysdevidx.com`
- `GITHUB_CALLBACK_URL=https://api.ysdevidx.com/api/v1/auth/github/callback`

## 12. Local Development Setup

Local components:

- Next.js app
- FastAPI app
- PostgreSQL

Suggested local host mapping:

- web: `http://localhost:3000`
- api: `http://localhost:8000`

Local callback example:

- `http://localhost:8000/api/v1/auth/github/callback`

## 13. Logging and Errors

### Backend logging

Log:

- auth start/callback success and failure
- verification request success and failure
- email send failures
- validation failures worth operational visibility

Do not log:

- raw verification codes
- secrets
- OAuth tokens

### Frontend error handling

Show concise messages for:

- GitHub login failure
- verification email send failure
- invalid or expired verification code
- profile save failure

## 14. Testing Scope

### Backend tests

- auth callback user creation/update
- directory listing sorting and pagination
- profile update validation
- verification request and confirmation flow

### Frontend tests

- homepage table rendering
- sort and pagination interaction
- profile form behavior
- verification form behavior

### End-to-end checks

- GitHub login happy path
- first login creates visible row
- verification badge appears after successful email confirmation

## 15. Non-Goals

Do not add these technologies in V1:

- Redis
- Elasticsearch / OpenSearch / Meilisearch
- GraphQL
- WebSockets
- background job platform unless email delivery later requires it
- microservices
- heavy UI framework

## 16. Technical Success Criteria

The implementation is technically successful if:

- the web app and API are cleanly separated by host
- GitHub OAuth works in local and production environments
- first login creates a public directory row automatically
- homepage listing is stable under sorting and pagination
- Yonsei email verification works reliably
- no unnecessary infrastructure was introduced
