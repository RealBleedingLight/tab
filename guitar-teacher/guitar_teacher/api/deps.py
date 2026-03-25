"""Shared dependencies for FastAPI routes."""
from functools import lru_cache
from fastapi import HTTPException, Cookie
from typing import Optional

from guitar_teacher.core.theory import TheoryEngine
from guitar_teacher.config import get_theory_dir
from guitar_teacher.api.auth import verify_token


@lru_cache(maxsize=1)
def get_engine() -> TheoryEngine:
    """Singleton TheoryEngine instance."""
    return TheoryEngine(get_theory_dir())


def require_auth(token: Optional[str] = Cookie(default=None)):
    """Dependency that validates JWT from cookie."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
