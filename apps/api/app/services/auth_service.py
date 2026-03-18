from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import OAuthAccount, Profile, User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class GitHubIdentity:
    provider_user_id: str
    github_username: str
    github_url: str


def generate_oauth_state() -> str:
    return secrets.token_urlsafe(32)


async def exchange_code_for_token(code: str) -> str:
    payload = {
        "client_id": settings.github_client_id,
        "client_secret": settings.github_client_secret,
        "code": code,
        "redirect_uri": settings.github_callback_url,
    }
    headers = {"Accept": "application/json"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(settings.github_oauth_token_url, data=payload, headers=headers)
    response.raise_for_status()
    data = response.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub token exchange failed.",
        )
    return access_token


async def fetch_github_identity(access_token: str) -> GitHubIdentity:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {access_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(settings.github_api_user_url, headers=headers)
    response.raise_for_status()
    data: dict[str, Any] = response.json()
    login = data.get("login")
    provider_user_id = data.get("id")
    html_url = data.get("html_url")
    if not login or not provider_user_id or not html_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub user profile was incomplete.",
        )
    return GitHubIdentity(
        provider_user_id=str(provider_user_id),
        github_username=login,
        github_url=html_url,
    )


def upsert_user_from_github(db: Session, identity: GitHubIdentity) -> User:
    oauth_stmt = select(OAuthAccount).where(
        OAuthAccount.provider == "github",
        OAuthAccount.provider_user_id == identity.provider_user_id,
    )
    oauth_account = db.scalar(oauth_stmt)
    now = _utcnow()

    if oauth_account is not None:
        user = oauth_account.user
        user.last_login_at = now
        oauth_account.github_username = identity.github_username
        oauth_account.github_url = identity.github_url
        db.commit()
        db.refresh(user)
        return user

    user = User(last_login_at=now, is_public=True)
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id)
    oauth_account = OAuthAccount(
        user_id=user.id,
        provider="github",
        provider_user_id=identity.provider_user_id,
        github_username=identity.github_username,
        github_url=identity.github_url,
    )
    db.add(profile)
    db.add(oauth_account)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="GitHub account could not be linked.",
        ) from exc

    db.refresh(user)
    return user
