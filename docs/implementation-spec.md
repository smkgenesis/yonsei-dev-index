# Yonsei Dev Index Implementation Spec

## 1. Scope

This spec covers the first shippable version of `ysdevidx.com`.

The product must do only this:

- let a user register with GitHub
- optionally verify a `@yonsei.ac.kr` email
- list registered developers on the homepage
- link the nickname and GitHub link directly to the developer's GitHub profile

Anything beyond this is out of scope for V1.

## 2. Tech Stack

### Frontend

- Next.js
- App Router
- TypeScript

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

### Database

- PostgreSQL

### Auth

- GitHub OAuth
- server-issued session cookie

### Email

- transactional email provider for verification codes

## 3. Repository Layout

```text
yonsei-dev-index/
  apps/
    api/
      app/
        api/
        core/
        models/
        schemas/
        services/
      alembic/
      tests/
    web/
      src/
        app/
        components/
        lib/
  docs/
    architecture.md
    implementation-spec.md
  .env.example
  README.md
```

## 4. Data Model

### 4.1 `users`

Purpose:

- one row per registered developer

Fields:

- `id` UUID primary key
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()
- `last_login_at` timestamptz not null default now()
- `is_public` boolean not null default true

Notes:

- `is_public=false` hides the user from the public directory
- GitHub login should create the user as public by default

### 4.2 `oauth_accounts`

Purpose:

- stores GitHub identity linkage

Fields:

- `id` UUID primary key
- `user_id` UUID not null references `users(id)` on delete cascade
- `provider` text not null
- `provider_user_id` text not null
- `github_username` text not null
- `github_url` text not null

Constraints:

- unique (`provider`, `provider_user_id`)
- unique (`provider`, `github_username`)

Notes:

- `provider` is always `github` in V1
- `github_username` should be updated on re-login if it changed

### 4.3 `profiles`

Purpose:

- stores optional fields for public display

Fields:

- `user_id` UUID primary key references `users(id)` on delete cascade
- `real_name` text null
- `major` text null
- `show_name` boolean not null default false
- `show_major` boolean not null default false

Notes:

- `real_name` and `major` are optional
- `show_name` and `show_major` control public visibility independently
- `real_name` and `major` are self-reported fields

### 4.4 `verifications`

Purpose:

- stores completed Yonsei verification state

Fields:

- `id` UUID primary key
- `user_id` UUID not null references `users(id)` on delete cascade
- `verified_email` text not null
- `verified_at` timestamptz not null
- `status` text not null

Constraints:

- unique (`user_id`)

Rules:

- `verified_email` must end with `@yonsei.ac.kr`
- `status` is `verified` or `revoked`

### 4.5 `verification_requests`

Purpose:

- stores pending code verification attempts

Fields:

- `id` UUID primary key
- `user_id` UUID not null references `users(id)` on delete cascade
- `yonsei_email` text not null
- `code_hash` text not null
- `expires_at` timestamptz not null
- `attempt_count` integer not null default 0
- `status` text not null
- `created_at` timestamptz not null default now()

Rules:

- only one active pending request per user
- new request invalidates older pending request
- raw code must never be stored

## 5. Public Directory Row Contract

Each row in the homepage table needs only this data:

- `github_nickname`
- `github_link`
- `verified`
- `name`
- `major`

Backend response shape:

```json
{
  "github_nickname": "smkge",
  "github_link": "https://github.com/smkge",
  "verified": true,
  "name": "Hong Gildong",
  "major": "Computer Science"
}
```

Display rules:

- `github_nickname` always visible
- `github_link` always visible
- `verified` shown only when true
- `name` shown only if `show_name=true` and value exists
- `major` shown only if `show_major=true` and value exists
- missing optional values render as `-`

Trust rules:

- `verified=true` means the user verified control of a `@yonsei.ac.kr` email address
- `name` and `major` remain self-reported even when verification exists
- the UI must not imply official verification of name or major

## 6. API Contract

Base path:

- `/api/v1`

### 6.1 Auth

#### `GET /api/v1/auth/github/start`

Behavior:

- redirects to GitHub OAuth authorization URL

#### `GET /api/v1/auth/github/callback`

Behavior:

- exchanges code for GitHub token
- fetches GitHub user profile
- creates or updates local user
- issues session cookie
- redirects to web app

Redirect target:

- `/`

#### `POST /api/v1/auth/logout`

Behavior:

- invalidates session
- clears cookie

Response:

```json
{
  "ok": true
}
```

#### `GET /api/v1/auth/me`

Response:

```json
{
  "authenticated": true,
  "user": {
    "github_nickname": "smkge",
    "github_link": "https://github.com/smkge",
    "is_public": true,
    "verified": false,
    "name": null,
    "major": null,
    "show_name": false,
    "show_major": false
  }
}
```

### 6.2 Directory

#### `GET /api/v1/developers`

Query params:

- `sort`: `nickname_asc` | `nickname_desc` | `oldest` | `newest`
- `page`: integer, default `1`
- `page_size`: integer, default `50`, max `100`
- `verified`: optional boolean filter
- `q`: optional simple keyword search

Sorting rules:

- `nickname_asc`: order by `github_username` ascending
- `nickname_desc`: order by `github_username` descending
- `oldest`: order by `users.created_at` ascending
- `newest`: order by `users.created_at` descending

Response:

```json
{
  "items": [
    {
      "github_nickname": "smkge",
      "github_link": "https://github.com/smkge",
      "verified": true,
      "name": "Hong Gildong",
      "major": "Computer Science"
    }
  ],
  "page": 1,
  "page_size": 50,
  "total": 1,
  "total_pages": 1,
  "sort": "newest"
}
```

Behavior rules:

- return public users only
- apply optional verified filter
- `q` should search only over GitHub nickname, name, and major
- empty optional values should be serialized as `null` and rendered as `-` in the frontend

### 6.3 Profile Settings

#### `GET /api/v1/me/profile`

Response:

```json
{
  "github_nickname": "smkge",
  "github_link": "https://github.com/smkge",
  "is_public": true,
  "verified": false,
  "real_name": null,
  "major": null,
  "show_name": false,
  "show_major": false
}
```

#### `PATCH /api/v1/me/profile`

Request:

```json
{
  "is_public": true,
  "real_name": "Hong Gildong",
  "major": "Computer Science",
  "show_name": true,
  "show_major": true
}
```

Validation rules:

- empty strings should be normalized to null
- `show_name=true` requires non-empty `real_name`
- `show_major=true` requires non-empty `major`

Response:

- same shape as `GET /api/v1/me/profile`

### 6.4 Verification

#### `POST /api/v1/me/verification/email/request`

Request:

```json
{
  "email": "user@yonsei.ac.kr"
}
```

Validation rules:

- must end with `@yonsei.ac.kr`
- rate-limited per user

Behavior:

- generate short numeric or alphanumeric code
- hash code
- email code
- invalidate previous pending request

Response:

```json
{
  "ok": true
}
```

#### `POST /api/v1/me/verification/email/confirm`

Request:

```json
{
  "email": "user@yonsei.ac.kr",
  "code": "123456"
}
```

Behavior:

- verify active request
- compare hash
- check expiry
- create or update `verifications`

Response:

```json
{
  "verified": true
}
```

#### `GET /api/v1/me/verification`

Response:

```json
{
  "verified": true,
  "email": "user@yonsei.ac.kr",
  "verified_at": "2026-03-18T12:00:00Z"
}
```

## 7. Frontend Screens

### 7.1 Homepage `/`

Purpose:

- primary product surface

Required UI:

- title
- GitHub login button when logged out
- sort dropdown
- optional verified-only toggle
- optional search input
- developer table
- pagination

Table columns:

- `GitHubNickname`
- `GitHubLink`
- `Verified`
- `Name`
- `Major`

Interaction rules:

- clicking nickname opens GitHub profile
- clicking link opens GitHub profile
- sort updates query state
- page changes preserve sort/filter state
- rows themselves do not need a separate internal detail action in V1

Default state:

- `sort=newest`
- `page=1`
- `page_size=50`

Sort options:

- `Newest First`
- `Oldest First`
- `GitHub Nickname A-Z`
- `GitHub Nickname Z-A`

### 7.2 Settings `/settings/profile`

Purpose:

- let user manage optional fields and visibility

Fields:

- public toggle
- real name input
- show name toggle
- major input
- show major toggle

Rules:

- GitHub nickname and GitHub link are read-only
- save action persists through `PATCH /api/v1/me/profile`
- include explanatory copy that name and major are optional self-reported fields

### 7.3 Verification `/settings/verification`

Purpose:

- request and confirm Yonsei email verification

States:

- not verified
- pending code entry
- verified

Fields:

- email input
- code input
- request code button
- confirm code button

Rules:

- email must be `@yonsei.ac.kr`
- verified state should be clearly visible
- explanatory copy should state that verification confirms email control only

## 8. Auth Flow

### Login

1. user clicks GitHub login
2. frontend navigates to `/api/v1/auth/github/start`
3. backend redirects to GitHub
4. GitHub redirects back to callback
5. backend creates/updates user and sets cookie
6. backend redirects to `/`

### Re-login update rules

On successful login:

- refresh `last_login_at`
- update `github_username` if changed
- update `github_url` if changed
- keep optional local fields unchanged
- create the account as public by default on first login

## 9. Security Rules

- session cookie must be `HttpOnly`
- session cookie must be `Secure` in production
- session cookie domain should be `.ysdevidx.com`
- verification code must be hashed
- verification requests must be rate-limited
- only public users appear in the directory

## 10. Out of Scope

The following must not be built in V1:

- social graph
- likes/comments
- messaging
- internal repository viewer
- internal portfolio page
- recommendation engine
- complex moderation tooling

## 11. Delivery Plan

### Phase 1

- repo scaffold
- database setup
- auth flow

### Phase 2

- directory API
- homepage table
- pagination and sorting

### Phase 3

- profile settings
- visibility rules

### Phase 4

- Yonsei email verification
- verified badge

### Phase 5

- optional simple search

## 12. Success Criteria

V1 is successful if:

- GitHub login creates a usable directory entry immediately
- homepage lists public developers with working GitHub links
- sorting and pagination work reliably
- optional verification works for `@yonsei.ac.kr`
- no extra product surface dilutes the core flow
