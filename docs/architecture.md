# Yonsei Dev Index Minimal Design

## 1. Product Statement

Yonsei Dev Index is a low-friction directory of Yonsei-affiliated developers.

Its job is simple:

- let someone register with GitHub
- optionally let them verify with a Yonsei email
- list registered developers on the homepage
- send visitors to each developer's GitHub profile

If a feature does not support that flow, it should not be in V1.

Primary domain:

- `ysdevidx.com`

Recommended hosts:

- Web: `https://ysdevidx.com`
- API: `https://api.ysdevidx.com`

## 2. Product Principles

### Principle 1: Minimize friction

Joining should take one GitHub login and, at most, a couple of optional fields.

### Principle 2: GitHub is the source of identity

The main public identifier is the GitHub username.
Not real name.
Not an internal profile slug.

### Principle 3: The homepage is the product

Do not build a landing page plus a directory.
The homepage should immediately show the developer list.

### Principle 4: Route users to GitHub quickly

The directory exists to help users find people.
GitHub is where they inspect projects and code.

### Principle 5: Store only what is necessary

Do not invent a large internal profile model.
Only store the minimum fields needed to list someone cleanly.

## 3. User Flow

### Registration flow

1. User clicks `Sign in with GitHub`.
2. OAuth completes.
3. The system creates a directory entry using GitHub data.
4. The entry is public by default because GitHub login is treated as registration intent.
5. User may optionally add:
   - real name
   - major
6. User may optionally verify with a Yonsei email.
7. Their profile appears in the public list unless they later hide it.

### Visitor flow

1. Visitor opens `ysdevidx.com`.
2. Visitor sees a directory table immediately.
3. Visitor clicks a GitHub nickname or GitHub link.
4. Visitor lands on that developer's GitHub profile.

That is the primary product loop.

## 4. Main Page UI

The homepage should be a compact table, not a marketing page and not a card-heavy interface.

Required columns:

- `GitHubNickname`
- `GitHubLink`

Optional columns:

- `Verified`
- `Name`
- `Major`

Display rules:

- `GitHubNickname` is always shown
- `GitHubLink` is always shown
- `Verified` only if the user completed Yonsei email verification
- `Name` only if user chose to provide and show it
- `Major` only if user chose to provide and show it

Link rules:

- clicking `GitHubNickname` goes directly to the GitHub profile
- clicking `GitHubLink` goes directly to the GitHub profile

V1 does not require an internal profile detail page.

Directory defaults:

- default sort: `Newest First`
- additional sorts: `GitHubNickname A-Z`, `Oldest First`
- default page size: `50`
- pagination starts once the result set exceeds `50`

## 5. Minimal Data Model

The system only needs one public directory record per user plus auth and verification state.

### `users`

- `id`
- `created_at`
- `updated_at`
- `last_login_at`
- `is_public`

### `oauth_accounts`

- `id`
- `user_id`
- `provider`
- `provider_user_id`
- `github_username`
- `github_url`

### `profiles`

- `user_id`
- `real_name`
- `major`
- `show_name`
- `show_major`

### `verifications`

- `id`
- `user_id`
- `verified_email`
- `verified_at`
- `status`

### `verification_requests`

- `id`
- `user_id`
- `yonsei_email`
- `code_hash`
- `expires_at`
- `status`

That is enough for V1.

Notably absent on purpose:

- no bio requirement
- no stack taxonomy requirement
- no repo cache requirement
- no social graph

## 6. Minimum Public Surface

Publicly visible fields:

- GitHub nickname
- GitHub link
- verified badge, if verified
- name, if user opted in
- major, if user opted in

That is the directory.

There is no need to replicate GitHub repositories in our own UI for V1.
The click-through target is GitHub itself.

## 7. Verification Design

Verification is optional.

Meaning:

- the user controls a Yonsei email address

Verification gives:

- a `Yonsei Email Verified` marker in the list

Name and major are not trust markers.
They are optional self-reported fields and must not be presented as institutionally verified facts.

Recommended UI wording:

- `Verified` means the user verified control of a `@yonsei.ac.kr` email address
- `Name` and `Major` are optional self-reported fields

Security rules:

- store only a hash of the code
- expire codes quickly
- rate-limit requests and attempts

## 8. Minimal API

### Auth

- `GET /api/v1/auth/github/start`
- `GET /api/v1/auth/github/callback`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Directory

- `GET /api/v1/developers`

This returns only the fields needed for the table.

### Self-service profile

- `GET /api/v1/me/profile`
- `PATCH /api/v1/me/profile`

Editable fields:

- `real_name`
- `major`
- `show_name`
- `show_major`
- `is_public`

### Verification

- `POST /api/v1/me/verification/email/request`
- `POST /api/v1/me/verification/email/confirm`
- `GET /api/v1/me/verification`

Anything beyond this should be treated as non-essential.

## 9. Search and Filtering

Search is not core.

V1 should work even if search is absent.

If included, keep it minimal:

- one keyword input over GitHub nickname, name, and major
- optional verified-only filter

Do not design the product around search.
Design it around fast browsing.

## 10. Auth and Cookie Model

Use server-issued session cookies after GitHub OAuth.

Recommended production cookie settings:

- domain: `.ysdevidx.com`
- `HttpOnly=true`
- `Secure=true`
- `SameSite=Lax`

Recommended GitHub callback:

- `https://api.ysdevidx.com/api/v1/auth/github/callback`

## 11. Stack Choice

Keep the implementation boring:

- Next.js frontend
- FastAPI backend
- PostgreSQL database

Do not add:

- GraphQL
- Redis on day one
- search infrastructure
- event systems
- microservices

## 12. Repository Shape

```text
yonsei-dev-index/
  apps/
    api/
    web/
  docs/
    architecture.md
  .env.example
  README.md
```

That is enough structure for V1.

## 13. Build Order

1. backend and frontend skeleton
2. GitHub OAuth
3. user table and directory API
4. homepage directory table
5. profile visibility and optional self-reported fields
6. Yonsei email verification
7. optional basic search

## 14. Final V1 Definition

V1 is successful if:

- a developer can join with GitHub in very few steps
- the homepage immediately shows the developer directory
- each row links directly to GitHub
- verified users can optionally expose more identity information

That is the product.
