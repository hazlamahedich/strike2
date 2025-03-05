from pydantic import BaseModel, EmailStr, Field, validator, root_validator
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
    company: Optional[str] = None
    title: Optional[str] = None
    source: LeadSource = LeadSource.OTHER
    status: LeadStatus = LeadStatus.NEW
    owner_id: Optional[int] = None
    team_id: Optional[int] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class LeadCreate(LeadBase):
    campaign_ids: Optional[List[int]] = None  # Optional list of campaign IDs to associate with the lead

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
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

class Lead(LeadBase):
    id: int
    lead_score: float = 0.0
    created_at: datetime
    updated_at: datetime
    
    # Additional computed properties
    full_name: str = ""
    
    @root_validator
    def set_full_name(cls, values):
        """Set the full name from first and last name"""
        if "first_name" in values and "last_name" in values:
            values["full_name"] = f"{values['first_name']} {values['last_name']}".strip()
        return values
    
    class Config:
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