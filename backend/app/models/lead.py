from pydantic import BaseModel, EmailStr, Field, validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class LeadSource(str, Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    LINKEDIN = "linkedin"
    COLD_CALL = "cold_call"
    EMAIL_CAMPAIGN = "email_campaign"
    EVENT = "event"
    OTHER = "other"

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class LeadBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    phone_extension: Optional[str] = None  # New field for phone extensions
    company: Optional[str] = None
    title: Optional[str] = None
    source: LeadSource = LeadSource.OTHER
    status: LeadStatus = LeadStatus.NEW
    owner_id: Optional[int] = None
    team_id: Optional[int] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None

class LeadCreate(LeadBase):
    campaign_ids: Optional[List[int]] = None  # Optional list of campaign IDs to associate with the lead

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    phone_extension: Optional[str] = None  # New field for phone extensions
    company: Optional[str] = None
    title: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    owner_id: Optional[int] = None
    team_id: Optional[int] = None
    custom_fields: Optional[Dict[str, Any]] = None
    lead_score: Optional[float] = None
    # New field for adding the lead to campaigns
    add_to_campaigns: Optional[List[int]] = None
    # New field for removing the lead from campaigns
    remove_from_campaigns: Optional[List[int]] = None
    linkedin_url: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_url: Optional[str] = None

class Lead(LeadBase):
    id: int
    lead_score: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    # Additional computed properties
    full_name: str = ""
    
    @model_validator(mode='after')
    def set_full_name(self) -> 'Lead':
        """Set the full name from first and last name"""
        if hasattr(self, "first_name") and hasattr(self, "last_name"):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        return self
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class LeadImport(BaseModel):
    """Model for importing leads from CSV/Excel"""
    data: List[Dict[str, Any]]
    field_mapping: Dict[str, str]
    handle_duplicates: str = "skip"  # skip, update, or create_new
    campaign_ids: Optional[List[int]] = None  # Campaigns to associate imported leads with

class LeadExport(BaseModel):
    """Model for exporting leads"""
    lead_ids: Optional[List[int]] = None
    filters: Optional[Dict[str, Any]] = None
    export_format: str = "csv"  # csv, xlsx
    include_fields: Optional[List[str]] = None
    include_campaign_data: bool = False  # Whether to include campaign data in the export

class LeadDetail(Lead):
    """Lead model with additional details for detailed view"""
    tasks: List[Dict[str, Any]] = []
    emails: List[Dict[str, Any]] = []
    calls: List[Dict[str, Any]] = []
    meetings: List[Dict[str, Any]] = []
    notes: List[Dict[str, Any]] = []
    activities: List[Dict[str, Any]] = []
    owner: Optional[Dict[str, Any]] = None
    timeline: List[Dict[str, Any]] = []
    # Add campaigns information
    campaigns: List[Dict[str, Any]] = []
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class LeadFilter(BaseModel):
    """Model for filtering leads"""
    search: Optional[str] = None
    status: Optional[List[LeadStatus]] = None
    source: Optional[List[LeadSource]] = None
    owner_id: Optional[Union[int, List[int]]] = None
    team_id: Optional[Union[int, List[int]]] = None
    lead_score_min: Optional[float] = None
    lead_score_max: Optional[float] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None
    custom_filters: Optional[Dict[str, Any]] = None
    # Add campaign filter
    campaign_id: Optional[Union[int, List[int]]] = None

class LeadNoteCreate(BaseModel):
    """
    Schema for creating a new lead note
    """
    content: str
    is_private: bool = False

class LeadNote(BaseModel):
    """
    Schema for a lead note
    """
    id: int
    lead_id: int
    content: str
    is_private: bool
    created_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class TaskCreate(BaseModel):
    """
    Schema for creating a new task for a lead
    """
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    assigned_to: Optional[int] = None

class Task(BaseModel):
    """
    Schema for a lead task
    """
    id: int
    lead_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority
    status: TaskStatus
    assigned_to: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class LeadCampaignStatus(str, Enum):
    ADDED = "added"
    CONTACTED = "contacted"
    RESPONDED = "responded"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    REJECTED = "rejected"
    UNSUBSCRIBED = "unsubscribed"

class CampaignLeadCreate(BaseModel):
    """
    Schema for adding a lead to a campaign
    """
    campaign_id: int
    status: LeadCampaignStatus = LeadCampaignStatus.ADDED
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class CampaignLead(BaseModel):
    """
    Schema for a lead-campaign association
    """
    campaign_id: int
    lead_id: int
    status: LeadCampaignStatus
    added_by: Optional[int] = None
    added_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class Campaign(BaseModel):
    """
    Schema for a campaign
    """
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True 