# Yonsei Dev Index

**Yonsei Dev Index** is a low-friction directory for Yonsei-affiliated developers built around GitHub identity.

Production:

- [ysdevidx.com](https://ysdevidx.com)

---

## English

### What It Is

Yonsei Dev Index is intentionally small.

It does only this:

1. A user signs in with GitHub.
2. Their GitHub identity is registered in the directory.
3. They can optionally verify a `@yonsei.ac.kr` email address.
4. Visitors browse the main directory page.
5. Clicking a nickname or link goes directly to that developer's GitHub profile.

This project is not a community platform, portfolio builder, or social network.

### Why It Exists

The problem is simple:

> Yonsei developers often do not know who is building what.

Instead of building a heavy internal community product, Yonsei Dev Index provides a thin public index that makes GitHub-based developer identity easier to discover.

### Product Principles

- Keep signup friction low.
- GitHub is the primary identity.
- The homepage is the product.
- Browsing matters more than search.
- Store as little extra data as possible.
- Do not add community features.

### Core Features

- GitHub OAuth login
- automatic directory registration on first login
- homepage directory table
- optional Yonsei email verification
- optional self-reported `Name`
- optional self-reported `Major`
- profile visibility toggle
- sorting, filtering, and pagination

### Trust Model

The trust model is intentionally narrow.

- `GitHub Nickname` and `GitHub Link` come from GitHub login
- `Verified` means the user verified control of a `@yonsei.ac.kr` email address
- `Name` and `Major` are optional self-reported fields

Important:

- `Verified` does **not** mean the user's real name or major was officially verified by Yonsei
- the product should not imply stronger identity verification than email control

### Security Notes

Current protections include:

- server-side session cookies
- hashed session tokens in the database
- GitHub OAuth state validation
- profile field validation
- verification code expiry
- verification attempt limit
- verification request cooldown
- daily verification request cap
- daily profile save cap
- unique verified Yonsei email per account

This is an MVP, not a hardened enterprise-grade identity system.

### Tech Stack

- Frontend: `Next.js`
- Backend: `FastAPI`
- Database: `PostgreSQL`
- Auth: `GitHub OAuth`
- Email: `Resend`
- DNS / domain: `Cloudflare`
- Deployment:
  - Web: `Vercel`
  - API: `Render`
  - Database: `Supabase Postgres`

### Repository Structure

```text
.
├─ apps/
│  ├─ api/      # FastAPI app, models, services, Alembic migrations, tests
│  └─ web/      # Next.js app
├─ docs/        # architecture, implementation, technical, and local dev docs
├─ compose.yaml # local PostgreSQL
└─ .env.example
```

### Local Development

1. Copy `.env.example` to `.env`
2. Start PostgreSQL
3. Start the API
4. Start the web app

Use `postgresql+psycopg://...` for `DATABASE_URL`.

#### Database

```bash
docker compose up -d db
```

#### API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
python -m alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Web

```bash
cd apps/web
npm install
npm run dev
```

Local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Health: `http://localhost:8000/api/v1/health`

### Tests

#### API

```bash
cd apps/api
pytest
```

#### Web

```bash
cd apps/web
npm run lint
npm run build
```

### Related Docs

- [Architecture](C:/Users/smkge/Develop/yonsei-dev-index/docs/architecture.md)
- [Implementation Spec](C:/Users/smkge/Develop/yonsei-dev-index/docs/implementation-spec.md)
- [Technical Spec](C:/Users/smkge/Develop/yonsei-dev-index/docs/technical-spec.md)
- [Local Development](C:/Users/smkge/Develop/yonsei-dev-index/docs/local-development.md)

---

## 한국어

### 무엇을 하는 서비스인가

Yonsei Dev Index는 아주 얇은 디렉터리 서비스입니다.

정말 이 정도만 합니다.

1. 사용자가 GitHub로 로그인합니다.
2. GitHub 정체성을 기준으로 디렉터리에 자동 등록됩니다.
3. 원하면 `@yonsei.ac.kr` 메일로 인증합니다.
4. 방문자는 메인 페이지에서 개발자 목록을 훑어봅니다.
5. 닉네임이나 링크를 누르면 바로 해당 GitHub 프로필로 이동합니다.

이 서비스는 커뮤니티, 포트폴리오 빌더, 소셜 네트워크가 아닙니다.

### 왜 만들었는가

문제는 단순합니다.

> 연세대 개발자들이 서로 누가 무엇을 하는지 잘 모른다.

그래서 무거운 커뮤니티를 만드는 대신, GitHub 기반 정체성을 얇게 연결하는 인덱스를 만드는 쪽을 택했습니다.

### 제품 원칙

- 가입 마찰을 낮게 유지한다.
- GitHub를 기본 정체성으로 삼는다.
- 메인 페이지가 곧 제품이다.
- 검색보다 훑어보기가 중요하다.
- 부가 데이터를 최소한으로만 저장한다.
- 커뮤니티 기능은 넣지 않는다.

### 핵심 기능

- GitHub OAuth 로그인
- 첫 로그인 시 자동 등록
- 메인 디렉터리 테이블
- 선택적 연세 메일 인증
- 선택적 `Name`
- 선택적 `Major`
- 공개/숨김 전환
- 정렬, 필터, 페이지네이션

### 신뢰 모델

이 서비스의 신뢰 모델은 의도적으로 좁습니다.

- `GitHub Nickname`, `GitHub Link`는 GitHub 로그인에서 옵니다
- `Verified`는 `@yonsei.ac.kr` 메일 소유를 확인했다는 뜻입니다
- `Name`, `Major`는 사용자가 직접 적는 optional self-reported field입니다

중요:

- `Verified`는 실명이나 학과가 학교 차원에서 검증되었다는 뜻이 아닙니다
- 이 서비스는 이메일 소유 이상을 인증한다고 주장하지 않습니다

### 보안 관련 메모

현재 들어간 보호 장치는 다음과 같습니다.

- 서버 저장형 세션 쿠키
- DB 내 세션 토큰 해시 저장
- GitHub OAuth state 검증
- 프로필 필드 검증
- 인증 코드 만료
- 인증 코드 시도 횟수 제한
- 인증 코드 요청 쿨다운
- 인증 코드 일일 요청 제한
- 프로필 저장 일일 제한
- 인증된 연세 메일의 계정 간 중복 사용 방지

다만 이 프로젝트는 MVP이며, 대규모 공격 모델까지 전부 방어하는 엔터프라이즈급 인증 시스템은 아닙니다.

### 기술 스택

- 프론트엔드: `Next.js`
- 백엔드: `FastAPI`
- 데이터베이스: `PostgreSQL`
- 인증: `GitHub OAuth`
- 메일: `Resend`
- DNS / 도메인: `Cloudflare`
- 배포:
  - Web: `Vercel`
  - API: `Render`
  - DB: `Supabase Postgres`

### 레포 구조

```text
.
├─ apps/
│  ├─ api/      # FastAPI 앱, 모델, 서비스, Alembic, 테스트
│  └─ web/      # Next.js 앱
├─ docs/        # 아키텍처 / 구현 명세 / 기술 문서
├─ compose.yaml # 로컬 PostgreSQL
└─ .env.example
```

### 로컬 실행

1. `.env.example`을 `.env`로 복사합니다
2. PostgreSQL을 띄웁니다
3. API를 실행합니다
4. Web을 실행합니다

`DATABASE_URL`은 `postgresql+psycopg://...` 형태를 사용합니다.

#### DB

```bash
docker compose up -d db
```

#### API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
python -m alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Web

```bash
cd apps/web
npm install
npm run dev
```

로컬 주소:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Health: `http://localhost:8000/api/v1/health`

### 테스트

#### API

```bash
cd apps/api
pytest
```

#### Web

```bash
cd apps/web
npm run lint
npm run build
```

### 문서

- [Architecture](C:/Users/smkge/Develop/yonsei-dev-index/docs/architecture.md)
- [Implementation Spec](C:/Users/smkge/Develop/yonsei-dev-index/docs/implementation-spec.md)
- [Technical Spec](C:/Users/smkge/Develop/yonsei-dev-index/docs/technical-spec.md)
- [Local Development](C:/Users/smkge/Develop/yonsei-dev-index/docs/local-development.md)

## License

MIT
