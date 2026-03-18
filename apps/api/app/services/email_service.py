from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)
RESEND_EMAILS_URL = "https://api.resend.com/emails"


def send_verification_email(*, to_email: str, code: str) -> None:
    if not settings.email_provider_api_key:
        raise RuntimeError("Email provider API key is not configured.")
    if not settings.email_from:
        raise RuntimeError("EMAIL_FROM is not configured.")

    payload: dict[str, Any] = {
        "from": settings.email_from,
        "to": [to_email],
        "subject": "Yonsei Dev Index verification code",
        "text": (
            f"Your Yonsei Dev Index verification code is {code}. "
            f"It expires in {settings.verification_code_ttl_minutes} minutes."
        ),
        "html": (
            "<p>Your Yonsei Dev Index verification code is "
            f"<strong>{code}</strong>.</p>"
            f"<p>This code expires in {settings.verification_code_ttl_minutes} minutes.</p>"
        ),
    }

    with httpx.Client(timeout=10.0) as client:
        response = client.post(
            RESEND_EMAILS_URL,
            headers={
                "Authorization": f"Bearer {settings.email_provider_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code >= 400:
        logger.error("Resend email request failed: %s %s", response.status_code, response.text)
        raise RuntimeError("Failed to send verification email.")
