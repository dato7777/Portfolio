# backend_portfolio/routers/auth.py
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select
from backend_portfolio.db import engine
from backend_portfolio.routers.Projects.quizProAI.models import User
from backend_portfolio.routers.Projects.quizProAI.auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
)
router = APIRouter(prefix="/auth", tags=["Auth"])

# --------- Pydantic schemas ----------
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --------- helpers ----------
def username_or_email_exists(session: Session, username: str, email: str) -> bool:
    stmt = select(User).where((User.username == username) | (User.email == email))
    return session.exec(stmt).first() is not None

# --------- routes ----------
@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest):
  """
  Create new user and return JWT.
  """
  with Session(engine) as session:
      if username_or_email_exists(session, data.username, data.email):
          raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail="Username or email already in use.",
          )
      user = User(
          username=data.username,
          email=data.email,
          password_hash=get_password_hash(data.password),
      )
      session.add(user)
      session.commit()
      session.refresh(user)

      # create token
      access_token = create_access_token({"sub": user.username})
      return TokenResponse(access_token=access_token)

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Verify credentials and return JWT.
    """
    with Session(engine) as session:
        stmt = select(User).where(User.username == form_data.username)
        user = session.exec(stmt).first()

        if not user or not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password.",
            )
        access_token = create_access_token(
            {"sub": user.username},
            expires_delta=timedelta(minutes=10),
        )
        return TokenResponse(access_token=access_token)