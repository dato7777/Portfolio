# backend_portfolio/auth_utils.py
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from backend_portfolio.db import engine
from backend_portfolio.routers.Projects.models import User

# ------------ settings ------------
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-super-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10  # 1 minute for testing

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ------------ password helpers ------------
def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ------------ token helpers ------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT with a numeric exp (UTC timestamp).
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    exp_ts = int(expire.timestamp())
    to_encode.update({"exp": exp_ts})

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    # DEBUG
    print("=== CREATE_ACCESS_TOKEN ===")
    print(f"  Now (UTC): {datetime.now(timezone.utc).isoformat()}")
    print(f"  Expires (UTC): {expire.isoformat()}")
    print(f"  exp claim (unix): {exp_ts}")
    print("===================================")

    return token


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    stmt = select(User).where(User.username == username)
    return session.exec(stmt).first()


# ------------ FastAPI dependency ------------
def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Decode token, manually check exp, then load the user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    print("\n=== GET_CURRENT_USER CALLED ===")
    now_utc = datetime.now(timezone.utc)
    now_ts = int(now_utc.timestamp())
    print(f"  Now (UTC): {now_utc.isoformat()} (ts={now_ts})")

    try:
        # 1) Decode WITHOUT automatic exp verification
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"verify_exp": False},
        )
        print(f"  Raw payload: {payload}")

        username = payload.get("sub")
        exp_claim = payload.get("exp")

        if username is None or exp_claim is None:
            print("  ❌ Missing 'sub' or 'exp' in payload")
            raise credentials_exception

        # 2) Normalize exp to integer timestamp
        try:
            exp_ts = int(exp_claim)
        except (TypeError, ValueError):
            print(f"  ❌ Could not convert exp to int: {exp_claim}")
            raise credentials_exception

        print(f"  exp (from token): {exp_ts}")

        # 3) Manual expiration check
        if exp_ts < now_ts:
            print("  ⏰ TOKEN EXPIRED")
            raise credentials_exception
        else:
            remaining = exp_ts - now_ts
            print(f"  ✅ Token still valid, seconds remaining: {remaining}")

    except JWTError as e:
        print("  ❌ JWT decode error:", repr(e))
        print("===================================")
        raise credentials_exception

    # 4) Load user from DB
    with Session(engine) as session:
        user = get_user_by_username(session, username)
        if user is None:
            print("  ❌ User not found in DB")
            print("===================================")
            raise credentials_exception

        print(f"  ✅ Authenticated user: {user.username}")
        print("===================================")
        return user