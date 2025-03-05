from datetime import datetime
from enum import Enum
from typing import Dict, Any, Optional

from pydantic import BaseModel, Field


class LeadCampaignStatus(str, Enum):
    ADDED = "added"           # Just added to campaign
    CONTACTED = "contacted"   # Initial contact made
    ENGAGED = "engaged"       # Has engaged with campaign (e.g., opened email)
    RESPONDED = "responded"   # Has responded to campaign
    CONVERTED = "converted"   # Has converted from the campaign
    REMOVED = "removed"       # Removed from campaign


class CampaignLeadBase(BaseModel):
    """Base model for the many-to-many relationship between campaigns and leads"""
    campaign_id: int
    lead_id: int
    status: LeadCampaignStatus = LeadCampaignStatus.ADDED
    added_by: int
    notes: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CampaignLeadCreate(CampaignLeadBase):
    pass


class CampaignLeadUpdate(BaseModel):
    """Model for updating a campaign-lead relationship"""
    status: Optional[LeadCampaignStatus] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CampaignLead(CampaignLeadBase):
    """Complete campaign-lead relationship model"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Metrics specific to this lead in this campaign
    open_count: int = 0
    click_count: int = 0
    response_count: int = 0
    conversion_value: Optional[float] = None
    last_activity_date: Optional[datetime] = None

    class Config:
        orm_mode = True


class CampaignLeadDetail(CampaignLead):
    """Detailed campaign-lead relationship with expanded objects"""
    campaign: Dict[str, Any]
    lead: Dict[str, Any]
    added_by_user: Dict[str, Any]
    activities: list = []
    
    class Config:
        orm_mode = True 