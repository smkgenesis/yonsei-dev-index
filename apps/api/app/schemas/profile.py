from __future__ import annotations

from pydantic import BaseModel, ConfigDict, model_validator


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

        if self.show_name and not self.real_name:
            raise ValueError("show_name=true requires a non-empty real_name.")
        if self.show_major and not self.major:
            raise ValueError("show_major=true requires a non-empty major.")
        return self
