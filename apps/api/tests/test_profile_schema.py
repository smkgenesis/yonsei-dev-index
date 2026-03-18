from app.schemas.profile import ProfileUpdateRequest


def test_profile_update_normalizes_blank_strings_to_none() -> None:
    payload = ProfileUpdateRequest(
        is_public=True,
        real_name="   ",
        major="  ",
        show_name=False,
        show_major=False,
    )

    assert payload.real_name is None
    assert payload.major is None


def test_profile_update_requires_name_when_show_name_is_true() -> None:
    try:
        ProfileUpdateRequest(
            is_public=True,
            real_name="",
            major=None,
            show_name=True,
            show_major=False,
        )
    except ValueError as exc:
        assert "show_name=true" in str(exc)
    else:
        raise AssertionError("Expected validation error for missing real_name.")


def test_profile_update_requires_major_when_show_major_is_true() -> None:
    try:
        ProfileUpdateRequest(
            is_public=True,
            real_name=None,
            major="",
            show_name=False,
            show_major=True,
        )
    except ValueError as exc:
        assert "show_major=true" in str(exc)
    else:
        raise AssertionError("Expected validation error for missing major.")


def test_profile_update_rejects_long_name() -> None:
    try:
        ProfileUpdateRequest(
            is_public=True,
            real_name="ABCDEFGHIJK",
            major=None,
            show_name=False,
            show_major=False,
        )
    except ValueError as exc:
        assert "10 characters" in str(exc)
    else:
        raise AssertionError("Expected validation error for long real_name.")


def test_profile_update_rejects_link_like_major() -> None:
    try:
        ProfileUpdateRequest(
            is_public=True,
            real_name=None,
            major="https://example.com",
            show_name=False,
            show_major=False,
        )
    except ValueError as exc:
        assert "must not contain links" in str(exc)
    else:
        raise AssertionError("Expected validation error for major containing a link.")
