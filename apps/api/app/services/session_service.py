from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api.deps import hash_session_token
from app.models.session import SessionModel
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class SessionPayload:
    session: SessionModel
    raw_token: str


def create_session(db: Session, user: User) -> SessionPayload:
    raw_token = secrets.token_urlsafe(32)
    now = _utcnow()
    session = SessionModel(
        user_id=user.id,
        token_hash=hash_session_token(raw_token),
        created_at=now,
        expires_at=now + timedelta(days=settings.session_ttl_days),
        last_seen_at=now,
    )
    db.add(session)
    db.flush()
    return SessionPayload(session=session, raw_token=raw_token)


def set_session_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
        domain=settings.session_cookie_domain or None,
        max_age=settings.session_ttl_days * 24 * 60 * 60,
        path="/",
    )


def set_oauth_state_cookie(response: Response, state: str) -> None:
    response.set_cookie(
        key=settings.oauth_state_cookie_name,
        value=state,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
        domain=settings.session_cookie_domain or None,
        max_age=600,
        path="/",
    )


def clear_oauth_state_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.oauth_state_cookie_name,
        domain=settings.session_cookie_domain or None,
        path="/",
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        domain=settings.session_cookie_domain or None,
        path="/",
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_same_site,
    )
