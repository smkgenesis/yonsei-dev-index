from __future__ import annotations

from datetime import datetime
import re
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator

ALLOWED_ORGANIZATION_KINDS = {"student_team", "campus_org", "startup", "external"}
ORG_NAME_PATTERN = re.compile(r"^[A-Za-z0-9가-힣&()'.,+/\- ]+$")
GITHUB_SLUG_PATTERN = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37})$")


def _reject_htmlish_text(value: str, *, field_name: str) -> str:
    if any(char in value for char in "<>{}[]"):
        raise ValueError(f"{field_name} must not contain HTML-like or bracket characters.")
    if re.search(r"https?://|www\.", value, re.IGNORECASE):
        raise ValueError(f"{field_name} must not contain links.")
    if any(ord(char) < 32 for char in value):
        raise ValueError(f"{field_name} must not contain control characters.")
    return value


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

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        _reject_htmlish_text(value, field_name="name")
        if not ORG_NAME_PATTERN.fullmatch(value):
            raise ValueError(
                "name may only contain Korean, English, numbers, spaces, and basic punctuation."
            )
        return value

    @field_validator("one_liner")
    @classmethod
    def validate_one_liner(cls, value: str) -> str:
        _reject_htmlish_text(value, field_name="one_liner")
        return value

    @field_validator("additional_context")
    @classmethod
    def validate_additional_context(cls, value: str | None) -> str | None:
        if value is None:
            return None
        _reject_htmlish_text(value, field_name="additional_context")
        return value

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
        parsed = urlparse(normalized)
        if parsed.scheme != "https" or parsed.netloc.lower() != "github.com":
            raise ValueError("GitHub URL must start with https://github.com/.")
        if parsed.query or parsed.fragment:
            raise ValueError("GitHub URL must not include query strings or fragments.")

        path_parts = [part for part in parsed.path.split("/") if part]
        if len(path_parts) != 1:
            raise ValueError("GitHub URL must point to a single GitHub user or organization.")

        slug = path_parts[0]
        if not GITHUB_SLUG_PATTERN.fullmatch(slug):
            raise ValueError("GitHub URL must use a valid GitHub account or organization slug.")

        return f"https://github.com/{slug}"


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
