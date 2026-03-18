from types import SimpleNamespace

from app.services.verification_service import VERIFICATION_NOTICE, get_verification_status


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
