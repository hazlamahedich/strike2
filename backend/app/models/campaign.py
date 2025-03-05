from datetime import datetime
from enum import Enum
from typing import Dict, Any, List, Optional

from pydantic import BaseModel, Field, validator


class CampaignType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    SOCIAL = "social"
    PPC = "ppc"
    CONTENT = "content"
    EVENT = "event"
    REFERRAL = "referral"
    OTHER = "other"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: CampaignType = CampaignType.OTHER
    status: CampaignStatus = CampaignStatus.DRAFT
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    team_id: Optional[int] = None
    budget: Optional[float] = None
    goals: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if v and 'start_date' in values and values['start_date'] and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[CampaignType] = None
    status: Optional[CampaignStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    team_id: Optional[int] = None
    budget: Optional[float] = None
    goals: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if v and 'start_date' in values and values['start_date'] and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class Campaign(CampaignBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    metrics: Dict[str, Any] = Field(default_factory=dict)
    lead_count: int = 0

    class Config:
        orm_mode = True


class CampaignDetail(Campaign):
    """Campaign model with additional details"""
    owner: Dict[str, Any]
    lead_sample: List[Dict[str, Any]] = []
    recent_activities: List[Dict[str, Any]] = []
    
    class Config:
        orm_mode = True


class CampaignFilter(BaseModel):
    """Model for filtering campaigns"""
    search: Optional[str] = None
    status: Optional[List[CampaignStatus]] = None
    type: Optional[List[CampaignType]] = None
    created_by: Optional[int] = None
    team_id: Optional[int] = None
    start_after: Optional[datetime] = None
    start_before: Optional[datetime] = None
    end_after: Optional[datetime] = None
    end_before: Optional[datetime] = None
    tags: Optional[List[str]] = None 