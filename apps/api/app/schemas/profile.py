from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, model_validator

URL_PATTERN = re.compile(r"https?://|www\.", re.IGNORECASE)
HTML_PATTERN = re.compile(r"[<>]")
NAME_PATTERN = re.compile(r"^[A-Za-z가-힣\s]+$")
MAJOR_PATTERN = re.compile(r"^[A-Za-z가-힣0-9\s&()/\-]+$")
REAL_NAME_MAX_LENGTH = 10
MAJOR_MAX_LENGTH = 20


class ProfileResponse(BaseModel):
    github_nickname: str | None
    github_link: str | None
    is_public: bool
    verified: bool
    real_name: str | None
    major: str | None
    show_name: bool
    show_major: bool
    self_reported_notice: str
    verification_notice: str


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_public: bool
    real_name: str | None = None
    major: str | None = None
    show_name: bool
    show_major: bool

    @model_validator(mode="after")
    def validate_visibility_requirements(self) -> "ProfileUpdateRequest":
        normalized_real_name = self.real_name.strip() if self.real_name else None
        normalized_major = self.major.strip() if self.major else None

        self.real_name = normalized_real_name or None
        self.major = normalized_major or None

        if self.real_name:
            if len(self.real_name) > REAL_NAME_MAX_LENGTH:
                raise ValueError(f"real_name must be {REAL_NAME_MAX_LENGTH} characters or fewer.")
            if URL_PATTERN.search(self.real_name) or HTML_PATTERN.search(self.real_name):
                raise ValueError("real_name must not contain links or HTML-like characters.")
            if not NAME_PATTERN.fullmatch(self.real_name):
                raise ValueError("real_name may only contain Korean, English, and spaces.")

        if self.major:
            if len(self.major) > MAJOR_MAX_LENGTH:
                raise ValueError(f"major must be {MAJOR_MAX_LENGTH} characters or fewer.")
            if URL_PATTERN.search(self.major) or HTML_PATTERN.search(self.major):
                raise ValueError("major must not contain links or HTML-like characters.")
            if not MAJOR_PATTERN.fullmatch(self.major):
                raise ValueError(
                    "major may only contain Korean, English, numbers, spaces, and basic separators."
                )

        if self.show_name and not self.real_name:
            raise ValueError("show_name=true requires a non-empty real_name.")
        if self.show_major and not self.major:
            raise ValueError("show_major=true requires a non-empty major.")
        return self
