"""Stateless JWT-cookie session for serverless deploys.

Flask's default session works on a single long-running process. Vercel cold-starts
fresh containers, so we use signed JWT cookies instead. The cookie holds only
{user_id, exp}; user records are loaded from data/store.json per request.
"""
import os
import time
from typing import Optional

import jwt
from flask import request, make_response

COOKIE_NAME = "aethria_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _secret() -> str:
    s = os.environ.get("SESSION_SECRET", "").strip()
    if not s:
        # Fall back to SECRET_KEY for local dev — but warn loudly.
        s = os.environ.get("SECRET_KEY", "ai-scientist-dev-secret-2025")
    return s


def issue(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + COOKIE_MAX_AGE,
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def current_user_id() -> Optional[str]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def _is_https_host() -> bool:
    """True when running behind HTTPS (Vercel, HF Spaces, Railway, Render, Fly).
    Sets the Secure flag so cookies aren't sent over plain HTTP."""
    return any(os.environ.get(k, "").strip() for k in (
        "VERCEL",          # Vercel
        "SPACE_ID",        # Hugging Face Spaces
        "RAILWAY_ENVIRONMENT",
        "RENDER",
        "FLY_APP_NAME",
    )) or os.environ.get("FLASK_ENV") == "production"


def attach(response, user_id: str):
    """Attach the session cookie to a Flask response."""
    token = issue(user_id)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=_is_https_host(),
        samesite="Lax",
        path="/",
    )
    return response


def clear(response):
    response.set_cookie(COOKIE_NAME, "", max_age=0, path="/")
    return response
