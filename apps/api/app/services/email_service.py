from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def send_verification_email(*, to_email: str, code: str) -> None:
    # Provider integration is intentionally thin for V1.
    logger.info("Verification code generated for %s: %s", to_email, code)
