from types import SimpleNamespace
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.services.profile_service import (
    SELF_REPORTED_NOTICE,
    VERIFICATION_NOTICE,
    _apply_profile_update_limit,
    serialize_profile,
)


def test_serialize_profile_returns_notices_and_visibility_flags() -> None:
    user = SimpleNamespace(
        is_public=True,
        oauth_accounts=[
            SimpleNamespace(
                github_username="smkge",
                github_url="https://github.com/smkge",
            )
        ],
        profile=SimpleNamespace(
            real_name="Hong Gildong",
            major="Computer Science",
            show_name=True,
            show_major=False,
        ),
        verification=SimpleNamespace(status="verified"),
    )

    result = serialize_profile(user)

    assert result.github_nickname == "smkge"
    assert result.github_link == "https://github.com/smkge"
    assert result.is_public is True
    assert result.verified is True
    assert result.real_name == "Hong Gildong"
    assert result.major == "Computer Science"
    assert result.show_name is True
    assert result.show_major is False
    assert result.self_reported_notice == SELF_REPORTED_NOTICE
    assert result.verification_notice == VERIFICATION_NOTICE


def test_profile_update_limit_blocks_after_five_saves() -> None:
    profile = SimpleNamespace(
        settings_update_count=5,
        settings_update_window_started_at=datetime.now(timezone.utc),
    )

    with pytest.raises(HTTPException) as exc:
        _apply_profile_update_limit(profile)

    assert exc.value.status_code == 429
