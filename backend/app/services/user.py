from typing import Optional, List, Dict, Any
from datetime import datetime

from app.core.security import get_password_hash
from app.models.user import UserCreate, UserUpdate, UserInDB, User
from app.core.database import fetch_one, fetch_all, insert_row, update_row, delete_row


class UserService:
    """
    Service class for user management operations
    """
    @staticmethod
    async def get_user_by_id(user_id: int) -> Optional[User]:
        """
        Get a user by ID.
        """
        return await get_user_by_id(user_id)
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[UserInDB]:
        """
        Get a user by email, including hashed password for internal use.
        """
        return await get_user_by_email(email)
    
    @staticmethod
    async def get_users(
        skip: int = 0, 
        limit: int = 100,
        team_id: Optional[int] = None,
        role: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[User]:
        """
        Get multiple users with filtering options.
        """
        return await get_users(skip, limit, team_id, role, search, is_active)
    
    @staticmethod
    async def create_user(user_in: UserCreate) -> User:
        """
        Create a new user.
        """
        return await create_user(user_in)
    
    @staticmethod
    async def update_user(user_id: int, user_in: UserUpdate) -> User:
        """
        Update a user.
        """
        return await update_user(user_id, user_in)
    
    @staticmethod
    async def delete_user(user_id: int) -> bool:
        """
        Delete a user.
        """
        return await delete_user(user_id)
    
    @staticmethod
    async def get_user_activity(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a user's recent activity.
        """
        return await get_user_activity(user_id, limit)
    
    @staticmethod
    async def get_user_stats(user_id: int) -> Dict[str, Any]:
        """
        Get a user's performance statistics.
        """
        return await get_user_stats(user_id)


# Original functions (keep for backward compatibility)

async def get_user_by_id(user_id: int) -> Optional[User]:
    """
    Get a user by ID.
    """
    user_data = await fetch_one("users", {"id": user_id})
    if not user_data:
        return None
    
    # Convert to UserInDB for internal use
    user_in_db = UserInDB(**user_data)
    
    # Convert to User for external representation (excluding hashed_password)
    return User(
        id=user_in_db.id,
        email=user_in_db.email,
        name=user_in_db.name,
        is_active=user_in_db.is_active,
        role=user_in_db.role,
        team_id=user_in_db.team_id,
        created_at=user_in_db.created_at,
        updated_at=user_in_db.updated_at
    )

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """
    Get a user by email.
    """
    user_data = await fetch_one("users", {"email": email})
    if not user_data:
        return None
    
    return UserInDB(**user_data)

async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    team_id: Optional[int] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[User]:
    """
    Get multiple users with optional filtering.
    """
    # Build query params
    query_params = {}
    if team_id is not None:
        query_params["team_id"] = team_id
    if role is not None:
        query_params["role"] = role
    if is_active is not None:
        query_params["is_active"] = is_active
    
    users_data = await fetch_all(
        "users", 
        query_params=query_params, 
        limit=limit, 
        offset=skip,
        order_by={"created_at": "desc"}
    )
    
    # Convert to User objects
    return [
        User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            is_active=user_data["is_active"],
            role=user_data["role"],
            team_id=user_data["team_id"],
            created_at=user_data["created_at"],
            updated_at=user_data["updated_at"]
        )
        for user_data in users_data
    ]

async def create_user(user_in: UserCreate) -> User:
    """
    Create a new user.
    """
    # Hash the password
    hashed_password = get_password_hash(user_in.password)
    
    # Prepare user data
    user_data = user_in.dict(exclude={"password"})
    user_data.update({
        "hashed_password": hashed_password,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    })
    
    # Insert the user
    new_user_data = await insert_row("users", user_data)
    
    # Return the created user
    return User(
        id=new_user_data["id"],
        email=new_user_data["email"],
        name=new_user_data["name"],
        is_active=new_user_data["is_active"],
        role=new_user_data["role"],
        team_id=new_user_data["team_id"],
        created_at=new_user_data["created_at"],
        updated_at=new_user_data["updated_at"]
    )

async def update_user(user_id: int, user_in: UserUpdate) -> User:
    """
    Update a user.
    """
    # Get current user
    current_user_data = await fetch_one("users", {"id": user_id})
    if not current_user_data:
        raise ValueError(f"User with ID {user_id} not found")
    
    # Prepare update data
    update_data = user_in.dict(exclude_unset=True)
    
    # Handle password update
    if "password" in update_data:
        hashed_password = get_password_hash(update_data.pop("password"))
        update_data["hashed_password"] = hashed_password
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.now()
    
    # Update the user
    updated_user_data = await update_row("users", user_id, update_data)
    
    # Return the updated user
    return User(
        id=updated_user_data["id"],
        email=updated_user_data["email"],
        name=updated_user_data["name"],
        is_active=updated_user_data["is_active"],
        role=updated_user_data["role"],
        team_id=updated_user_data["team_id"],
        created_at=updated_user_data["created_at"],
        updated_at=updated_user_data["updated_at"]
    )

async def delete_user(user_id: int) -> bool:
    """
    Delete a user.
    """
    # Soft delete (update is_active to False)
    update_data = {"is_active": False, "updated_at": datetime.now()}
    await update_row("users", user_id, update_data)
    return True

async def get_user_activity(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent activity for a user.
    """
    activities = await fetch_all(
        "activities",
        query_params={"user_id": user_id},
        limit=limit,
        order_by={"created_at": "desc"}
    )
    return activities

async def get_user_stats(user_id: int) -> Dict[str, Any]:
    """
    Get stats for a user.
    """
    # Get lead count
    leads_data = await fetch_all("leads", query_params={"owner_id": user_id})
    lead_count = len(leads_data)
    
    # Get active tasks count
    active_tasks_data = await fetch_all(
        "tasks", 
        query_params={
            "assigned_to": user_id,
            "status": {"operator": "neq", "value": "completed"}
        }
    )
    active_tasks_count = len(active_tasks_data)
    
    # Get completed tasks count
    completed_tasks_data = await fetch_all(
        "tasks", 
        query_params={
            "assigned_to": user_id,
            "status": "completed"
        }
    )
    completed_tasks_count = len(completed_tasks_data)
    
    # Get recent activity
    recent_activity = await get_user_activity(user_id, limit=5)
    
    return {
        "lead_count": lead_count,
        "active_tasks": active_tasks_count,
        "completed_tasks": completed_tasks_count,
        "recent_activity": recent_activity
    } 