from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User, Verification, VerificationRequest
from app.schemas.verification import VerificationStatusResponse
from app.services.email_service import send_verification_email

VERIFICATION_NOTICE = "Verification only confirms control of a @yonsei.ac.kr email address."
ALLOWED_DOMAIN = "@yonsei.ac.kr"
GENERIC_REQUEST_ERROR = "Verification request could not be completed."
GENERIC_CONFIRM_ERROR = "Verification could not be completed."


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _validate_yonsei_email(email: str) -> str:
    normalized = _normalize_email(email)
    if not normalized.endswith(ALLOWED_DOMAIN):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @yonsei.ac.kr email addresses are allowed.",
        )
    return normalized


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _get_pending_request(db: Session, user_id) -> VerificationRequest | None:
    stmt = (
        select(VerificationRequest)
        .where(
            VerificationRequest.user_id == user_id,
            VerificationRequest.status == "pending",
        )
        .order_by(VerificationRequest.created_at.desc())
    )
    return db.scalars(stmt).first()


def _get_latest_request_for_email(db: Session, email: str) -> VerificationRequest | None:
    stmt = (
        select(VerificationRequest)
        .where(VerificationRequest.yonsei_email == email)
        .order_by(VerificationRequest.created_at.desc())
    )
    return db.scalars(stmt).first()


def _count_recent_requests_for_user(db: Session, user_id, now: datetime) -> int:
    window_start = now - timedelta(days=1)
    stmt = select(func.count()).where(
        VerificationRequest.user_id == user_id,
        VerificationRequest.created_at >= window_start,
    )
    return db.scalar(stmt) or 0


def _count_recent_requests_for_email(db: Session, email: str, now: datetime) -> int:
    window_start = now - timedelta(days=1)
    stmt = select(func.count()).where(
        VerificationRequest.yonsei_email == email,
        VerificationRequest.created_at >= window_start,
    )
    return db.scalar(stmt) or 0


def _ensure_email_is_available(db: Session, user: User, email: str) -> None:
    stmt = select(Verification).where(
        Verification.verified_email == email,
        Verification.status == "verified",
    )
    existing = db.scalars(stmt).first()
    if existing is not None and existing.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=GENERIC_REQUEST_ERROR,
        )


def request_verification_code(db: Session, user: User, email: str) -> dict[str, bool]:
    normalized_email = _validate_yonsei_email(email)
    now = _utcnow()
    _ensure_email_is_available(db, user, normalized_email)

    latest_for_email = _get_latest_request_for_email(db, normalized_email)
    if latest_for_email is not None:
        cooldown = timedelta(seconds=settings.verification_request_cooldown_seconds)
        if latest_for_email.created_at + cooldown > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=GENERIC_REQUEST_ERROR,
            )

    recent_request_count = _count_recent_requests_for_user(db, user.id, now)
    if recent_request_count >= settings.verification_request_max_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=GENERIC_REQUEST_ERROR,
        )

    recent_email_request_count = _count_recent_requests_for_email(db, normalized_email, now)
    if recent_email_request_count >= settings.verification_request_max_per_email_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=GENERIC_REQUEST_ERROR,
        )

    existing = _get_pending_request(db, user.id)

    if existing is not None:
        cooldown = timedelta(seconds=settings.verification_request_cooldown_seconds)
        if existing.created_at + cooldown > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=GENERIC_REQUEST_ERROR,
            )
        existing.status = "superseded"

    code = _generate_code()
    verification_request = VerificationRequest(
        user_id=user.id,
        yonsei_email=normalized_email,
        code_hash=_hash_code(code),
        expires_at=now + timedelta(minutes=settings.verification_code_ttl_minutes),
        attempt_count=0,
        status="pending",
        created_at=now,
    )
    db.add(verification_request)

    try:
        send_verification_email(to_email=normalized_email, code=code)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=GENERIC_REQUEST_ERROR,
        ) from exc

    db.commit()
    return {"ok": True}


def confirm_verification_code(db: Session, user: User, email: str, code: str) -> dict[str, bool]:
    normalized_email = _validate_yonsei_email(email)
    normalized_code = code.strip()
    now = _utcnow()

    verification_request = _get_pending_request(db, user.id)
    if verification_request is None or verification_request.yonsei_email != normalized_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=GENERIC_CONFIRM_ERROR,
        )

    if verification_request.expires_at <= now:
        verification_request.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=GENERIC_CONFIRM_ERROR,
        )

    verification_request.attempt_count += 1
    if verification_request.attempt_count > settings.verification_max_attempts:
        verification_request.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=GENERIC_CONFIRM_ERROR,
        )

    if verification_request.code_hash != _hash_code(normalized_code):
        if verification_request.attempt_count >= settings.verification_max_attempts:
            verification_request.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=GENERIC_CONFIRM_ERROR,
        )

    verification_request.status = "verified"

    verification = user.verification
    if verification is None:
        verification = Verification(
            user_id=user.id,
            verified_email=normalized_email,
            verified_at=now,
            status="verified",
        )
        db.add(verification)
    else:
        verification.verified_email = normalized_email
        verification.verified_at = now
        verification.status = "verified"

    db.commit()
    return {"verified": True}


def get_verification_status(user: User) -> VerificationStatusResponse:
    verification = user.verification
    verified = bool(verification and verification.status == "verified")
    return VerificationStatusResponse(
        verified=verified,
        email=verification.verified_email if verified else None,
        verified_at=verification.verified_at if verified else None,
        verification_notice=VERIFICATION_NOTICE,
    )
