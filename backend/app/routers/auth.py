from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Any, Dict

from app.models.user import User, UserCreate, Token, UserUpdate
from app.services import auth as auth_service

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@router.post("/register", response_model=User)
async def register(user_in: UserCreate) -> Any:
    """
    Register a new user using Supabase authentication.
    """
    return await auth_service.register_user(user_in)

@router.post("/login", response_model=Dict[str, Any])
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login using Supabase authentication.
    """
    return await auth_service.login_user(form_data.username, form_data.password)

@router.get("/me", response_model=User)
async def read_users_me(token: str = Depends(oauth2_scheme)) -> Any:
    """
    Get current user from Supabase auth.
    """
    return await auth_service.get_current_user(token)

@router.put("/me", response_model=User)
async def update_user_me(
    user_in: UserUpdate,
    token: str = Depends(oauth2_scheme)
) -> Any:
    """
    Update own user profile.
    """
    # First get the current user to get their ID
    current_user = await auth_service.get_current_user(token)
    return await auth_service.update_user_profile(current_user.id, user_in)

@router.post("/password-reset-request")
async def password_reset_request(email: str = Body(...)) -> Any:
    """
    Request a password reset email via Supabase auth.
    """
    return await auth_service.request_password_reset(email)

@router.post("/password-reset")
async def password_reset(token: str = Body(...), new_password: str = Body(...)) -> Any:
    """
    Reset password with token received by email.
    """
    return await auth_service.reset_password(token, new_password)

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)) -> Any:
    """
    Logout user by invalidating Supabase session.
    """
    return await auth_service.logout_user(token) 