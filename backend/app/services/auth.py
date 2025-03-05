from typing import Dict, Any, Optional, Union
import datetime

from fastapi import HTTPException, status
from pydantic import EmailStr

from app.core.config import settings
from app.core.database import get_supabase_client
from app.models.user import UserCreate, UserInDB, User, UserUpdate


async def register_user(user_data: UserCreate) -> User:
    """
    Register a new user using Supabase authentication
    """
    try:
        client = get_supabase_client()
        
        # Register the user with Supabase Auth
        auth_response = client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not register user"
            )
        
        # Insert additional user data into the users table
        user_db_data = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "name": user_data.name,
            "is_active": user_data.is_active,
            "role": user_data.role,
            "team_id": user_data.team_id,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
        }
        
        response = client.table("users").insert(user_db_data).execute()
        
        if not response.data or len(response.data) == 0:
            # If user profile creation fails, we should delete the auth user
            await delete_auth_user(auth_response.user.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile"
            )
        
        return User(**response.data[0])
    
    except Exception as e:
        # Handle specific Supabase errors (like duplicate email)
        if "User already registered" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Re-raise any other exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering user: {str(e)}"
        )


async def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Login user with Supabase authentication
    """
    try:
        client = get_supabase_client()
        
        # Sign in with email and password
        auth_response = client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Fetch user data from the users table
        user_data = client.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        if not user_data.data or len(user_data.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User profile not found"
            )
            
        # Return both the session and user data
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "expires_at": auth_response.session.expires_at,
            "user": user_data.data[0]
        }
        
    except Exception as e:
        if "Invalid login credentials" in str(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging in: {str(e)}"
        )


async def get_current_user(token: str) -> User:
    """
    Get the current user from a Supabase JWT token
    """
    try:
        client = get_supabase_client()
        
        # Set the session manually
        client.auth.set_session(token)
        
        # Get the user from the session
        user = client.auth.get_user()
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        # Fetch user data from the users table
        user_data = client.table("users").select("*").eq("id", user.user.id).execute()
        
        if not user_data.data or len(user_data.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User profile not found"
            )
            
        return User(**user_data.data[0])
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )


async def update_user_profile(user_id: str, user_data: UserUpdate) -> User:
    """
    Update a user's profile information
    """
    try:
        client = get_supabase_client()
        
        update_data = user_data.dict(exclude_unset=True)
        
        # If password is being updated, update it in Supabase Auth
        if "password" in update_data:
            # This requires admin privileges or user to be signed in
            client.auth.admin.update_user_by_id(
                user_id, 
                {"password": update_data.pop("password")}
            )
        
        # Update other profile fields
        if update_data:
            update_data["updated_at"] = datetime.datetime.now().isoformat()
            response = client.table("users").update(update_data).eq("id", user_id).execute()
            
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user profile"
                )
                
            return User(**response.data[0])
        
        # If only password was updated, fetch and return current user data
        user_data = client.table("users").select("*").eq("id", user_id).execute()
        return User(**user_data.data[0])
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )


async def request_password_reset(email: EmailStr) -> Dict[str, Any]:
    """
    Request a password reset email
    """
    try:
        client = get_supabase_client()
        
        # Send password reset email
        client.auth.reset_password_email(email)
        
        return {"message": "Password reset email sent successfully"}
        
    except Exception as e:
        # Don't expose whether the email exists for security
        return {"message": "If a user with that email exists, a password reset link has been sent"}


async def reset_password(token: str, new_password: str) -> Dict[str, Any]:
    """
    Reset a user's password with the token received via email
    """
    try:
        client = get_supabase_client()
        
        # Update the user's password
        client.auth.update_user({
            "password": new_password
        })
        
        return {"message": "Password updated successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating password: {str(e)}"
        )


async def logout_user(token: str) -> Dict[str, Any]:
    """
    Log out a user by invalidating their session
    """
    try:
        client = get_supabase_client()
        
        # Set the session manually
        client.auth.set_session(token)
        
        # Sign out
        client.auth.sign_out()
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error logging out: {str(e)}"
        )


async def delete_auth_user(user_id: str) -> None:
    """
    Delete a user from Supabase Auth (admin only)
    """
    try:
        client = get_supabase_client()
        
        # This requires admin privileges
        client.auth.admin.delete_user(user_id)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        ) 