from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

ALLOWED_ORGANIZATION_KINDS = {"student_team", "campus_org", "startup", "external"}


class OrganizationSubmissionCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    kind: str = Field(min_length=1, max_length=32)
    github_url: str = Field(min_length=1, max_length=500)
    one_liner: str = Field(min_length=1, max_length=120)
    additional_context: str | None = Field(default=None, max_length=1000)

    @field_validator("name", "one_liner", "additional_context")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_ORGANIZATION_KINDS:
            raise ValueError("Invalid organization kind.")
        return normalized

    @field_validator("github_url")
    @classmethod
    def validate_github_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.startswith("https://github.com/"):
            raise ValueError("GitHub URL must start with https://github.com/.")
        return normalized.rstrip("/")


class OrganizationSubmissionItemResponse(BaseModel):
    id: str
    name: str
    kind: str
    github_url: str
    one_liner: str
    additional_context: str | None
    status: str
    review_note: str | None
    created_at: datetime
    applicant_github_nickname: str | None


class OrganizationSubmissionListResponse(BaseModel):
    items: list[OrganizationSubmissionItemResponse]


class OrganizationSubmissionReviewRequest(BaseModel):
    review_note: str | None = Field(default=None, max_length=500)

    @field_validator("review_note")
    @classmethod
    def strip_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None
