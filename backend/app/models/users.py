from pydantic import BaseModel, Field, EmailStr
from typing import Dict, List, Optional, Any
from datetime import datetime

class User(BaseModel):
    """User model"""
    id: int
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: str = Field(description="Role: admin, manager, sales_rep")
    team_id: Optional[int] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True 