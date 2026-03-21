from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.verification_service import (
    GENERIC_REQUEST_ERROR,
    VERIFICATION_NOTICE,
    get_verification_status,
)
from app.services import verification_service


def test_get_verification_status_for_verified_user() -> None:
    user = SimpleNamespace(
        verification=SimpleNamespace(
            status="verified",
            verified_email="user@yonsei.ac.kr",
            verified_at="2026-03-19T00:00:00Z",
        )
    )

    result = get_verification_status(user)

    assert result.verified is True
    assert result.email == "user@yonsei.ac.kr"
    assert result.verification_notice == VERIFICATION_NOTICE


def test_get_verification_status_for_unverified_user() -> None:
    user = SimpleNamespace(verification=None)

    result = get_verification_status(user)

    assert result.verified is False
    assert result.email is None
    assert result.verified_at is None
    assert result.verification_notice == VERIFICATION_NOTICE


def test_request_verification_code_rejects_email_already_verified_by_another_account() -> None:
    user = SimpleNamespace(id="user-1")
    existing_verification = SimpleNamespace(user_id="user-2")
    fake_db = SimpleNamespace(
        scalars=lambda stmt: SimpleNamespace(first=lambda: existing_verification),
    )

    with pytest.raises(HTTPException) as exc:
        verification_service._ensure_email_is_available(fake_db, user, "user@yonsei.ac.kr")

    assert exc.value.status_code == 409
    assert exc.value.detail == GENERIC_REQUEST_ERROR


def test_count_recent_requests_for_user_uses_scalar_count() -> None:
    now = datetime.now(timezone.utc)
    fake_db = SimpleNamespace(scalar=lambda stmt: 5)

    result = verification_service._count_recent_requests_for_user(fake_db, "user-1", now)

    assert result == 5


def test_count_recent_requests_for_email_uses_scalar_count() -> None:
    now = datetime.now(timezone.utc)
    fake_db = SimpleNamespace(scalar=lambda stmt: 3)

    result = verification_service._count_recent_requests_for_email(
        fake_db, "user@yonsei.ac.kr", now
    )

    assert result == 3
