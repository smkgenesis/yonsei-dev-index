from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import desc, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.user import Organization, OrganizationSubmission, User
from app.schemas.organization_submission import (
    OrganizationSubmissionCreateRequest,
    OrganizationSubmissionItemResponse,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_submission(submission: OrganizationSubmission) -> OrganizationSubmissionItemResponse:
    applicant_nickname = None
    applicant_accounts = submission.applicant_user.oauth_accounts if submission.applicant_user else []
    if applicant_accounts:
        applicant_nickname = applicant_accounts[0].github_username

    return OrganizationSubmissionItemResponse(
        id=str(submission.id),
        name=submission.name,
        kind=submission.kind,
        github_url=submission.github_url,
        one_liner=submission.one_liner,
        additional_context=submission.additional_context,
        status=submission.status,
        created_at=submission.created_at,
        applicant_github_nickname=applicant_nickname,
    )


def create_submission(
    db: Session,
    applicant: User,
    payload: OrganizationSubmissionCreateRequest,
) -> OrganizationSubmissionItemResponse:
    existing_org_stmt = select(Organization).where(
        or_(Organization.name == payload.name, Organization.github_url == payload.github_url)
    )
    if db.scalar(existing_org_stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This organization is already listed.",
        )

    existing_submission_stmt = select(OrganizationSubmission).where(
        OrganizationSubmission.status == "pending",
        or_(
            OrganizationSubmission.name == payload.name,
            OrganizationSubmission.github_url == payload.github_url,
        ),
    )
    if db.scalar(existing_submission_stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending request already exists for this organization.",
        )

    submission = OrganizationSubmission(
        applicant_user_id=applicant.id,
        name=payload.name,
        kind=payload.kind,
        github_url=payload.github_url,
        one_liner=payload.one_liner,
        additional_context=payload.additional_context,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    submission.applicant_user = applicant
    return _serialize_submission(submission)


def list_submissions(db: Session) -> dict[str, list[OrganizationSubmissionItemResponse]]:
    stmt = (
        select(OrganizationSubmission)
        .options(
            joinedload(OrganizationSubmission.applicant_user).joinedload(User.oauth_accounts),
        )
        .order_by(
            OrganizationSubmission.status.asc(),
            desc(OrganizationSubmission.created_at),
        )
    )
    rows = db.execute(stmt).unique().scalars().all()
    return {"items": [_serialize_submission(row) for row in rows]}


def approve_submission(
    db: Session,
    *,
    submission_id: str,
    reviewer: User,
) -> OrganizationSubmissionItemResponse:
    stmt = (
        select(OrganizationSubmission)
        .options(joinedload(OrganizationSubmission.applicant_user).joinedload(User.oauth_accounts))
        .where(OrganizationSubmission.id == submission_id)
    )
    submission = db.scalar(stmt)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    if submission.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending submissions can be approved.",
        )

    existing_org_stmt = select(Organization).where(
        or_(Organization.name == submission.name, Organization.github_url == submission.github_url)
    )
    if db.scalar(existing_org_stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This organization is already listed.",
        )

    organization = Organization(
        name=submission.name,
        kind=submission.kind,
        github_url=submission.github_url,
        one_liner=submission.one_liner,
        is_public=True,
    )
    db.add(organization)

    submission.status = "approved"
    submission.reviewed_at = _utcnow()
    submission.reviewer_user_id = reviewer.id

    db.commit()
    db.refresh(submission)
    return _serialize_submission(submission)


def reject_submission(
    db: Session,
    *,
    submission_id: str,
    reviewer: User,
) -> OrganizationSubmissionItemResponse:
    stmt = (
        select(OrganizationSubmission)
        .options(joinedload(OrganizationSubmission.applicant_user).joinedload(User.oauth_accounts))
        .where(OrganizationSubmission.id == submission_id)
    )
    submission = db.scalar(stmt)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found.")

    if submission.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending submissions can be rejected.",
        )

    submission.status = "rejected"
    submission.reviewed_at = _utcnow()
    submission.reviewer_user_id = reviewer.id
    db.commit()
    db.refresh(submission)
    return _serialize_submission(submission)
