from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    is_active: bool = True
    role: UserRole = UserRole.SALES_REP
    team_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        # Add more password validation as needed
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    team_id: Optional[int] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserInDB(UserBase):
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    is_admin: bool = False
    
    @validator('is_admin', always=True)
    def set_is_admin(cls, v, values):
        if 'role' in values and values['role'] == UserRole.ADMIN:
            return True
        return v
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    exp: int

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserWithStats(User):
    lead_count: int = 0
    active_tasks: int = 0
    completed_tasks: int = 0
    recent_activity: List[Dict[str, Any]] = [] 