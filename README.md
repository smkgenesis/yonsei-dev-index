# Yonsei Dev Index

**Yonsei Dev Index** is a lightweight public index for Yonsei-affiliated developers built around GitHub accounts.

Production:

- [ysdevidx.com](https://ysdevidx.com)

---

## English

### What This Project Is

Yonsei Dev Index is intentionally narrow.

It is not a community platform, a social network, or a portfolio builder.
It is a public index that helps people quickly see who is building, studying, and shipping things around Yonsei through GitHub.

### Core Product Flow

1. A user signs in with GitHub.
2. Their GitHub account is registered in the public directory.
3. They can optionally verify control of a `@yonsei.ac.kr` email address.
4. They can optionally fill in `Name` and `Major`.
5. Visitors browse the directory and jump out to the user's GitHub profile.

### Organizations

The product also includes an `Organizations` section.

This page is deliberately small:

- it lists development-related organizations
- it links to their public GitHub pages
- it allows logged-in users to submit organization requests
- it allows an admin to review and approve or decline those requests

Approved organizations appear in the public Organizations page.

### Trust Model

The trust model is intentionally limited.

- `GitHub Nickname` and `GitHub Link` come from GitHub OAuth.
- `Verified` means the user verified control of a `@yonsei.ac.kr` email address.
- `Name` and `Major` are optional self-reported fields.

Important:

- `Verified` does **not** mean Yonsei officially verified the user's real name or major.
- This product should not imply a stronger identity claim than email control.

### Current Features

- GitHub OAuth sign-in
- automatic registration on first login
- public directory with search, sorting, verification filter, and pagination
- optional Yonsei email verification
- optional self-reported `Name` and `Major`
- profile visibility controls
- Organizations page with search, sorting, and pagination
- organization request submission flow
- admin organization review flow
- applicant-side request status view in `My Profile`

### Security Notes

Current protections include:

- server-side session cookies
- hashed session tokens in the database
- GitHub OAuth state validation
- strict profile input validation
- verification code expiry and attempt limits
- verification request cooldowns and daily caps
- unique verified Yonsei email per account
- request origin checks for authenticated state-changing API calls
- production browser security headers

This is still a small public MVP, not an enterprise identity system.

### Deployment

- Web: `Vercel`
- API: `Render`
- Database: `Supabase Postgres`
- Email: `Resend`
- DNS / domain: `Cloudflare`

Because the API currently runs on a free Render instance, the backend may occasionally wake from sleep. The web app is designed to show a loading state instead of failing hard during that window.

### Repository Structure

```text
.
|- apps/
|  |- api/      # FastAPI app, SQLAlchemy models, services, Alembic migrations
|  `- web/      # Next.js app
|- docs/        # architecture, implementation, release notes, and local dev docs
|- compose.yaml # local PostgreSQL
`- .env.example
```

### Local Development

1. Copy `.env.example` to `.env`
2. Start local PostgreSQL
3. Run API migrations
4. Start the API
5. Start the web app

Use a `postgresql+psycopg://...` connection string for `DATABASE_URL`.

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

### Verification and Builds

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

- [Architecture](docs/architecture.md)
- [B2B Product Direction](docs/b2b-product-direction.md)
- [Implementation Spec](docs/implementation-spec.md)
- [Technical Spec](docs/technical-spec.md)
- [Local Development](docs/local-development.md)
- [Release Notes 1.0.0](docs/releases/1.0.0.md)
- [Release Notes 1.0.1](docs/releases/1.0.1.md)

---

## 한국어

### 이 프로젝트는 무엇인가

Yonsei Dev Index는 연세대 개발자들을 위한 아주 가벼운 공개 목록 서비스입니다.

커뮤니티 플랫폼도 아니고, SNS도 아니고, 포트폴리오 빌더도 아닙니다.
핵심은 단순합니다. 연세대 안에서 누가 개발을 하고 있는지, 어떤 GitHub를 운영하고 있는지 빠르게 볼 수 있게 만드는 것입니다.

### 기본 흐름

1. 사용자가 GitHub로 로그인합니다.
2. GitHub 계정을 기준으로 공개 목록에 등록됩니다.
3. 원하면 `@yonsei.ac.kr` 메일 인증을 할 수 있습니다.
4. 원하면 `Name`, `Major`를 입력할 수 있습니다.
5. 방문자는 메인 목록을 보고 각 사용자의 GitHub로 이동할 수 있습니다.

### Organizations

이 프로젝트에는 `Organizations` 탭도 있습니다.

이 페이지는 의도적으로 작게 유지하고 있습니다.

- 개발 관련 조직을 보여주고
- 해당 조직의 공개 GitHub 링크를 연결하고
- 로그인한 사용자가 새 조직 등록을 신청할 수 있고
- 관리자가 그 신청을 승인 또는 거절할 수 있습니다

승인된 조직만 공개 Organizations 페이지에 올라갑니다.

### 신뢰 모델

이 서비스의 신뢰 범위는 의도적으로 좁습니다.

- `GitHub Nickname`, `GitHub Link`는 GitHub OAuth에서 가져옵니다.
- `Verified`는 사용자가 `@yonsei.ac.kr` 메일을 실제로 제어하고 있다는 뜻입니다.
- `Name`, `Major`는 사용자가 직접 입력하는 선택 정보입니다.

중요한 점:

- `Verified`는 실명이나 학과가 학교 차원에서 공식 검증되었다는 뜻이 아닙니다.
- 이 서비스는 이메일 소유 확인 이상을 주장하지 않습니다.

### 현재 기능

- GitHub OAuth 로그인
- 첫 로그인 시 자동 등록
- 검색, 정렬, 인증 필터, 페이지네이션이 있는 공개 개발자 목록
- 선택적 연세 메일 인증
- 선택적 `Name`, `Major`
- 프로필 공개/숨김 설정
- 검색, 정렬, 페이지네이션이 있는 Organizations 페이지
- Organization 신청 폼
- 관리자 승인/거절 플로우
- `My Profile`에서 본인 신청 상태 확인

### 보안 메모

현재 들어간 보호 장치는 다음과 같습니다.

- 서버 기반 세션 쿠키
- DB 내 세션 토큰 해시 저장
- GitHub OAuth state 검증
- 프로필 입력값 검증
- 인증 코드 만료와 시도 횟수 제한
- 인증 코드 요청 쿨다운과 일일 제한
- 계정 간 연세 메일 중복 인증 방지
- 인증된 상태 변경 요청에 대한 origin 검사
- 프로덕션 웹 보안 헤더

다만 여전히 작은 공개형 MVP이며, 대규모 공격을 상정한 엔터프라이즈 인증 시스템은 아닙니다.

### 배포 구조

- Web: `Vercel`
- API: `Render`
- Database: `Supabase Postgres`
- Email: `Resend`
- DNS / domain: `Cloudflare`

현재 API는 Render 무료 인스턴스를 사용하고 있어서 가끔 슬립에서 깨어나는 시간이 필요할 수 있습니다. 이 구간에는 사이트가 바로 죽은 것처럼 보이지 않도록 로딩 상태를 우선 보여주도록 구성했습니다.

### 레포 구조

```text
.
|- apps/
|  |- api/      # FastAPI 앱, SQLAlchemy 모델, 서비스, Alembic 마이그레이션
|  `- web/      # Next.js 앱
|- docs/        # 아키텍처, 구현 명세, 릴리즈 노트, 로컬 개발 문서
|- compose.yaml # 로컬 PostgreSQL
`- .env.example
```

### 로컬 개발

1. `.env.example`을 `.env`로 복사합니다.
2. 로컬 PostgreSQL을 실행합니다.
3. API 마이그레이션을 적용합니다.
4. API를 실행합니다.
5. Web을 실행합니다.

`DATABASE_URL`은 `postgresql+psycopg://...` 형식을 사용합니다.

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

로컬 주소:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Health: `http://localhost:8000/api/v1/health`

### 검증과 빌드

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

### 관련 문서

- [Architecture](docs/architecture.md)
- [B2B Product Direction](docs/b2b-product-direction.md)
- [Implementation Spec](docs/implementation-spec.md)
- [Technical Spec](docs/technical-spec.md)
- [Local Development](docs/local-development.md)
- [Release Notes 1.0.0](docs/releases/1.0.0.md)
- [Release Notes 1.0.1](docs/releases/1.0.1.md)

## License

MIT
