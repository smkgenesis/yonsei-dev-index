from __future__ import annotations

from uuid import UUID
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    hash_session_token,
    is_admin_user,
    require_admin_user,
    require_current_user,
)
from app.core.config import settings
from app.db.session import get_db
from app.models.session import SessionModel
from app.models.user import User
from app.schemas.organization import OrganizationListResponse
from app.schemas.organization_submission import (
    OrganizationSubmissionCreateRequest,
    OrganizationSubmissionItemResponse,
    OrganizationSubmissionListResponse,
)
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest
from app.schemas.verification import (
    VerificationConfirmPayload,
    VerificationRequestPayload,
    VerificationStatusResponse,
)
from app.services.auth_service import (
    exchange_code_for_token,
    fetch_github_identity,
    generate_oauth_state,
    upsert_user_from_github,
)
from app.services.directory_service import SortOption, list_developers
from app.services.organization_service import OrganizationSortOption, list_organizations
from app.services.organization_submission_service import (
    approve_submission,
    create_submission,
    list_submissions,
    reject_submission,
)
from app.services.profile_service import serialize_profile, update_profile
from app.services.session_service import (
    clear_oauth_state_cookie,
    clear_session_cookie,
    create_session,
    set_oauth_state_cookie,
    set_session_cookie,
)
from app.services.verification_service import (
    confirm_verification_code,
    get_verification_status,
    request_verification_code,
)

router = APIRouter()


@router.get("/health")
def healthcheck(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@router.get("/auth/github/start")
async def auth_github_start() -> Response:
    if not settings.github_client_id or not settings.github_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth is not configured.",
        )

    state = generate_oauth_state()
    query = urlencode(
        {
            "client_id": settings.github_client_id,
            "redirect_uri": settings.github_callback_url,
            "scope": settings.github_oauth_scope,
            "state": state,
        }
    )
    response = RedirectResponse(
        url=f"{settings.github_oauth_authorize_url}?{query}",
        status_code=status.HTTP_302_FOUND,
    )
    set_oauth_state_cookie(response, state)
    return response


@router.get("/auth/github/callback")
async def auth_github_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db),
    oauth_state: str | None = Cookie(default=None, alias=settings.oauth_state_cookie_name),
) -> Response:
    if not oauth_state or oauth_state != state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state.")

    access_token = await exchange_code_for_token(code)
    identity = await fetch_github_identity(access_token)
    user = upsert_user_from_github(db, identity)

    response = RedirectResponse(url=settings.app_web_url, status_code=status.HTTP_302_FOUND)
    session_payload = create_session(db, user)
    db.commit()
    set_session_cookie(response, session_payload.raw_token)
    clear_oauth_state_cookie(response)
    return response


@router.post("/auth/logout")
def logout(
    db: Session = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> Response:
    if session_token:
        session_stmt = select(SessionModel).where(
            SessionModel.token_hash == hash_session_token(session_token)
        )
        session_model = db.scalar(session_stmt)
        if session_model is not None:
            db.delete(session_model)
            db.commit()

    response = JSONResponse({"ok": True})
    clear_session_cookie(response)
    return response


@router.get("/auth/me")
def auth_me(current_user: User | None = Depends(get_current_user)) -> dict[str, object]:
    if current_user is None:
        return {"authenticated": False, "user": None}

    oauth_account = current_user.oauth_accounts[0] if current_user.oauth_accounts else None
    profile = current_user.profile
    verification = current_user.verification

    return {
        "authenticated": True,
        "is_admin": is_admin_user(current_user),
        "user": {
            "github_nickname": oauth_account.github_username if oauth_account else None,
            "github_link": oauth_account.github_url if oauth_account else None,
            "is_public": current_user.is_public,
            "verified": bool(verification and verification.status == "verified"),
            "name": profile.real_name if profile and profile.show_name else None,
            "major": profile.major if profile and profile.show_major else None,
            "show_name": profile.show_name if profile else False,
            "show_major": profile.show_major if profile else False,
        },
    }


@router.get("/developers")
def developers(
    sort: SortOption = Query(default="newest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    verified: bool | None = Query(default=None),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return list_developers(
        db,
        sort=sort,
        page=page,
        page_size=page_size,
        verified=verified,
        q=q,
    )


@router.get("/organizations", response_model=OrganizationListResponse)
def organizations(
    sort: OrganizationSortOption = Query(default="name_asc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return list_organizations(
        db,
        sort=sort,
        page=page,
        page_size=page_size,
        q=q,
    )


@router.post("/organization-submissions", response_model=OrganizationSubmissionItemResponse)
def create_organization_submission(
    payload: OrganizationSubmissionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> OrganizationSubmissionItemResponse:
    return create_submission(db, current_user, payload)


@router.get(
    "/admin/organization-submissions",
    response_model=OrganizationSubmissionListResponse,
)
def get_organization_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> dict[str, list[OrganizationSubmissionItemResponse]]:
    return list_submissions(db)


@router.post(
    "/admin/organization-submissions/{submission_id}/approve",
    response_model=OrganizationSubmissionItemResponse,
)
def post_approve_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> OrganizationSubmissionItemResponse:
    return approve_submission(db, submission_id=str(submission_id), reviewer=current_user)


@router.post(
    "/admin/organization-submissions/{submission_id}/reject",
    response_model=OrganizationSubmissionItemResponse,
)
def post_reject_submission(
    submission_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> OrganizationSubmissionItemResponse:
    return reject_submission(db, submission_id=str(submission_id), reviewer=current_user)


@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(require_current_user)) -> ProfileResponse:
    return serialize_profile(current_user)


@router.get("/me/access")
def get_my_access(current_user: User = Depends(require_current_user)) -> dict[str, object]:
    return {"ok": True, "is_admin": is_admin_user(current_user)}


@router.patch("/me/profile", response_model=ProfileResponse)
def patch_my_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ProfileResponse:
    return update_profile(db, current_user, payload)


@router.post("/me/profile/hide")
def hide_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> ProfileResponse:
    payload = ProfileUpdateRequest(
        is_public=False,
        real_name=current_user.profile.real_name if current_user.profile else None,
        major=current_user.profile.major if current_user.profile else None,
        show_name=current_user.profile.show_name if current_user.profile else False,
        show_major=current_user.profile.show_major if current_user.profile else False,
    )
    return update_profile(db, current_user, payload, count_toward_limit=False)


@router.delete("/me/account")
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> Response:
    db.delete(current_user)
    db.commit()

    response = JSONResponse({"ok": True})
    clear_session_cookie(response)
    return response


@router.post("/me/verification/email/request")
def post_verification_email_request(
    payload: VerificationRequestPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> dict[str, bool]:
    return request_verification_code(db, current_user, payload.email)


@router.post("/me/verification/email/confirm")
def post_verification_email_confirm(
    payload: VerificationConfirmPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user),
) -> dict[str, bool]:
    return confirm_verification_code(db, current_user, payload.email, payload.code)


@router.get("/me/verification", response_model=VerificationStatusResponse)
def get_my_verification(
    current_user: User = Depends(require_current_user),
) -> VerificationStatusResponse:
    return get_verification_status(current_user)


api_router = router
