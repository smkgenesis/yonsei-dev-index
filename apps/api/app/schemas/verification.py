from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VerificationRequestPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str


class VerificationConfirmPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str
    code: str


class VerificationStatusResponse(BaseModel):
    verified: bool
    email: str | None
    verified_at: datetime | None
    verification_notice: str
