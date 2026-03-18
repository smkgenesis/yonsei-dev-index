from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Optional

from fastapi import Cookie, Depends
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.session import SessionModel
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_current_user(
    db: Session = Depends(get_db),
    session_token: Optional[str] = Cookie(default=None, alias=settings.session_cookie_name),
) -> Optional[User]:
    if not session_token:
        return None

    token_hash = hash_session_token(session_token)
    stmt = (
        select(SessionModel)
        .options(
            joinedload(SessionModel.user).joinedload(User.profile),
            joinedload(SessionModel.user).joinedload(User.verification),
            joinedload(SessionModel.user).joinedload(User.oauth_accounts),
        )
        .where(SessionModel.token_hash == token_hash)
    )
    session_model = db.scalar(stmt)
    if session_model is None:
        return None

    now = _utcnow()
    if session_model.expires_at <= now:
        db.delete(session_model)
        db.commit()
        return None

    session_model.last_seen_at = now
    db.commit()
    return session_model.user


def require_current_user(current_user: Optional[User] = Depends(get_current_user)) -> User:
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return current_user
