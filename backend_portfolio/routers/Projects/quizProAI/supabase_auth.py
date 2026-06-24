"""Verify Supabase Auth JWTs issued after sign-in / sign-up."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")

_bearer = HTTPBearer(auto_error=True)


@dataclass(frozen=True)
class SupabaseAuthUser:
    auth_id: str
    email: Optional[str]


def verify_supabase_jwt(token: str) -> SupabaseAuthUser:
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on the server.",
        )

    decode_kwargs: dict = {
        "algorithms": ["HS256"],
        "audience": "authenticated",
    }
    if SUPABASE_URL:
        decode_kwargs["issuer"] = f"{SUPABASE_URL}/auth/v1"

    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, **decode_kwargs)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase session.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    auth_id = payload.get("sub")
    if not auth_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase token: missing user id.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    return SupabaseAuthUser(auth_id=str(auth_id), email=email.lower() if email else None)


def get_supabase_auth_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> SupabaseAuthUser:
    return verify_supabase_jwt(credentials.credentials)
