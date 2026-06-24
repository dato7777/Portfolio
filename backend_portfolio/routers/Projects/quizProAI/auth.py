# backend_portfolio/routers/auth.py
from datetime import timedelta
from typing import Optional

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from backend_portfolio.db import engine
from backend_portfolio.routers.Projects.quizProAI.models import User
from backend_portfolio.routers.Projects.quizProAI.auth_utils import (
    verify_password,
    create_access_token,
)
from backend_portfolio.routers.Projects.quizProAI.supabase_auth import (
    SupabaseAuthUser,
    get_supabase_auth_user,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# --------- Pydantic schemas ----------
class SignupRequest(BaseModel):
    username: str
    email: EmailStr


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# --------- helpers ----------
def username_or_email_exists(
    session: Session, username: str, email: str, *, exclude_user_id: Optional[int] = None
) -> bool:
    stmt = select(User).where((User.username == username) | (User.email == email))
    existing = session.exec(stmt).first()
    if existing is None:
        return False
    if exclude_user_id is not None and existing.id == exclude_user_id:
        return False
    return True


def auth_id_taken(session: Session, auth_id: str, *, exclude_user_id: Optional[int] = None) -> bool:
    stmt = select(User).where(User.auth_id == auth_id)
    existing = session.exec(stmt).first()
    if existing is None:
        return False
    if exclude_user_id is not None and existing.id == exclude_user_id:
        return False
    return True


def issue_token_for_user(user: User) -> TokenResponse:
    access_token = create_access_token({"sub": user.username})
    return TokenResponse(access_token=access_token, username=user.username)


def assert_email_matches_token(request_email: str, auth_user: SupabaseAuthUser) -> None:
    normalized = request_email.lower()
    if auth_user.email and auth_user.email != normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email does not match the authenticated Supabase session.",
        )


# --------- routes ----------
@router.post("/signup", response_model=TokenResponse)
def signup(
    data: SignupRequest,
    auth_user: SupabaseAuthUser = Depends(get_supabase_auth_user),
):
    """
    Create a public.users profile linked to Supabase Auth (auth_id = auth.uid()).
    Requires Authorization: Bearer <supabase_access_token>.
    """
    assert_email_matches_token(data.email, auth_user)

    with Session(engine) as session:
        if auth_id_taken(session, auth_user.auth_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account is already registered.",
            )
        if username_or_email_exists(session, data.username, data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already in use.",
            )

        user = User(
            auth_id=auth_user.auth_id,
            username=data.username,
            email=data.email,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return issue_token_for_user(user)


@router.post("/sync", response_model=TokenResponse)
def sync_session(auth_user: SupabaseAuthUser = Depends(get_supabase_auth_user)):
    """
    After Supabase sign-in, load or link the public.users row and return an app JWT.
    Requires Authorization: Bearer <supabase_access_token>.
    """
    with Session(engine) as session:
        user = session.exec(select(User).where(User.auth_id == auth_user.auth_id)).first()
        if user is None and auth_user.email:
            user = session.exec(select(User).where(User.email == auth_user.email)).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile found for this account. Please sign up first.",
            )

        if user.auth_id and user.auth_id != auth_user.auth_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is linked to a different auth account.",
            )

        if auth_id_taken(session, auth_user.auth_id, exclude_user_id=user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This auth account is already linked to another profile.",
            )

        if not user.auth_id:
            user.auth_id = auth_user.auth_id
            session.add(user)
            session.commit()
            session.refresh(user)

        return issue_token_for_user(user)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Legacy username/password login (pre-Supabase accounts with password_hash set).
    """
    with Session(engine) as session:
        stmt = select(User).where(User.username == form_data.username)
        user = session.exec(stmt).first()

        if not user or not user.password_hash or not verify_password(
            form_data.password, user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password.",
            )
        access_token = create_access_token(
            {"sub": user.username},
            expires_delta=timedelta(minutes=10),
        )
        return TokenResponse(access_token=access_token, username=user.username)
