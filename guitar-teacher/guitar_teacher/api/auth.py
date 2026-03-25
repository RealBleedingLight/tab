"""Pin-based authentication with JWT tokens."""
import os
import time
from typing import Optional, Dict

import jwt

_EXPIRY_SECONDS = 86400  # 24 hours


def _get_secret() -> str:
    return os.environ.get("AUTH_SECRET", "change-me")


def _get_pin() -> str:
    return os.environ.get("AUTH_PIN", "")


def check_pin(pin: str) -> bool:
    """Validate pin against AUTH_PIN env var."""
    return pin == _get_pin()


def create_token() -> str:
    """Create a JWT token valid for 24 hours."""
    return _create_token_with_expiry(seconds=_EXPIRY_SECONDS)


def _create_token_with_expiry(seconds: int) -> str:
    """Create a JWT with custom expiry (exposed for testing)."""
    payload = {
        "sub": "guitar-teacher",
        "iat": int(time.time()),
        "exp": int(time.time()) + seconds,
    }
    return jwt.encode(payload, _get_secret(), algorithm="HS256")


def verify_token(token: str) -> Optional[Dict]:
    """Verify and decode a JWT. Returns payload or None."""
    try:
        return jwt.decode(token, _get_secret(), algorithms=["HS256"])
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError):
        return None
