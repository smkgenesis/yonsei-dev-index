from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import Profile, User
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest

SELF_REPORTED_NOTICE = "Name and major are optional self-reported fields."
VERIFICATION_NOTICE = "Verification only confirms control of a @yonsei.ac.kr email address."


def serialize_profile(user: User) -> ProfileResponse:
    oauth_account = user.oauth_accounts[0] if user.oauth_accounts else None
    profile = user.profile
    verification = user.verification

    return ProfileResponse(
        github_nickname=oauth_account.github_username if oauth_account else None,
        github_link=oauth_account.github_url if oauth_account else None,
        is_public=user.is_public,
        verified=bool(verification and verification.status == "verified"),
        real_name=profile.real_name if profile else None,
        major=profile.major if profile else None,
        show_name=profile.show_name if profile else False,
        show_major=profile.show_major if profile else False,
        self_reported_notice=SELF_REPORTED_NOTICE,
        verification_notice=VERIFICATION_NOTICE,
    )


def update_profile(db: Session, user: User, payload: ProfileUpdateRequest) -> ProfileResponse:
    profile = user.profile
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.flush()

    user.is_public = payload.is_public
    profile.real_name = payload.real_name
    profile.major = payload.major
    profile.show_name = payload.show_name
    profile.show_major = payload.show_major

    db.commit()
    db.refresh(user)
    return serialize_profile(user)
