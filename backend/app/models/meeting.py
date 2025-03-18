"""
Meeting models for calendar and meeting management functionality.
"""
from datetime import datetime, time
from enum import Enum
from typing import Dict, List, Optional, Any, Union

from pydantic import BaseModel, Field, EmailStr, validator, HttpUrl


class MeetingType(str, Enum):
    """Types of meetings supported by the system"""
    INITIAL_CALL = "initial_call"
    DISCOVERY = "discovery"
    DEMO = "demo"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    FOLLOW_UP = "follow_up"
    OTHER = "other"


class MeetingStatus(str, Enum):
    """Status of a meeting"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELED = "canceled"
    COMPLETED = "completed"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class MeetingLocationType(str, Enum):
    """Type of meeting location"""
    VIRTUAL = "virtual"
    IN_PERSON = "in_person"
    PHONE = "phone"


class MeetingAttendeeStatus(str, Enum):
    """Status of a meeting attendee"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    TENTATIVE = "tentative"


class CalendarProvider(str, Enum):
    """Calendar provider types"""
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    CRM = "crm"  # Internal CRM calendar


class CalendarIntegration(BaseModel):
    """Calendar integration settings"""
    id: Optional[str] = None
    user_id: str
    provider: CalendarProvider
    credentials: Dict[str, Any] = {}  # Encrypted credentials
    sync_enabled: bool = True
    last_sync: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AvailabilitySchedule(BaseModel):
    """User availability schedule for meeting booking"""
    id: Optional[str] = None
    user_id: str
    name: str  # E.g., "Working Hours", "Client Meetings"
    monday: List[Dict[str, time]] = Field(default_factory=list)  # List of start/end time pairs
    tuesday: List[Dict[str, time]] = Field(default_factory=list)
    wednesday: List[Dict[str, time]] = Field(default_factory=list)
    thursday: List[Dict[str, time]] = Field(default_factory=list)
    friday: List[Dict[str, time]] = Field(default_factory=list)
    saturday: List[Dict[str, time]] = Field(default_factory=list)
    sunday: List[Dict[str, time]] = Field(default_factory=list)
    buffer_minutes: int = 15  # Buffer time between meetings
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MeetingAttendee(BaseModel):
    """Attendee of a meeting"""
    id: Optional[str] = None
    meeting_id: Optional[str] = None
    name: str
    email: EmailStr
    status: MeetingAttendeeStatus = MeetingAttendeeStatus.PENDING
    is_organizer: bool = False
    lead_id: Optional[str] = None  # If attendee is a lead
    user_id: Optional[str] = None  # If attendee is a user
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MeetingLocation(BaseModel):
    """Location of a meeting"""
    type: MeetingLocationType
    address: Optional[str] = None  # For in-person meetings
    virtual_link: Optional[HttpUrl] = None  # For virtual meetings
    phone_number: Optional[str] = None  # For phone meetings
    conference_details: Optional[Dict[str, Any]] = None  # Additional details for virtual meetings


class Meeting(BaseModel):
    """Meeting model"""
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: MeetingStatus = MeetingStatus.SCHEDULED
    location: MeetingLocation
    organizer_id: str  # User ID of the organizer
    lead_id: Optional[str] = None  # If meeting is with a lead
    attendees: List[MeetingAttendee] = Field(default_factory=list)
    notes: Optional[str] = None
    recording_url: Optional[HttpUrl] = None
    calendar_event_id: Optional[str] = None  # ID in external calendar
    calendar_provider: Optional[CalendarProvider] = None
    reminder_sent: bool = False
    reminder_time: Optional[int] = 15  # Minutes before meeting
    agenda_items: List[str] = Field(default_factory=list)
    follow_up_tasks: List[str] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Summary fields
    summary: Optional[str] = None
    action_items: List[str] = Field(default_factory=list)
    # Comprehensive summary fields
    comprehensive_summary: Optional[Dict[str, Any]] = None

    @validator('end_time')
    def end_time_after_start_time(cls, v, values):
        """Validate that end_time is after start_time"""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class MeetingSummaryType(str, Enum):
    """Types of meeting summaries"""
    BASIC = "basic"
    COMPREHENSIVE = "comprehensive"


class MeetingSummary(BaseModel):
    """Meeting summary model"""
    id: Optional[str] = None
    meeting_id: str
    summary_type: MeetingSummaryType
    summary: str
    insights: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None


class MeetingSummaryCreate(BaseModel):
    """Model for creating a meeting summary"""
    meeting_id: str
    summary_type: MeetingSummaryType
    summary: str
    insights: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)


class MeetingSummaryUpdate(BaseModel):
    """Model for updating a meeting summary"""
    summary: Optional[str] = None
    insights: Optional[List[str]] = None
    action_items: Optional[List[str]] = None
    next_steps: Optional[List[str]] = None


class MeetingCreate(BaseModel):
    """Model for creating a meeting"""
    lead_id: int
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: Optional[str] = "UTC"
    meeting_type: MeetingType = MeetingType.INITIAL_CALL
    location: Optional[str] = None  # Can be a URL for virtual meetings
    lead_email: str  # Email of the lead for calendar invitation
    lead_phone: Optional[str] = None  # Phone number of the lead
    

class MeetingUpdate(BaseModel):
    """Model for updating a meeting"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    timezone: Optional[str] = None
    meeting_type: Optional[MeetingType] = None
    location: Optional[Union[str, MeetingLocation]] = None
    status: Optional[MeetingStatus] = None
    lead_id: Optional[str] = None
    notes: Optional[str] = None
    agenda_items: Optional[List[str]] = None
    reminder_time: Optional[int] = None
    # Summary fields
    summary: Optional[str] = None
    action_items: Optional[List[str]] = None
    # Comprehensive summary fields
    comprehensive_summary: Optional[Dict[str, Any]] = None


class MeetingResponse(BaseModel):
    """Response model for meetings"""
    id: int
    user_id: int
    lead_id: int
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    timezone: str = "UTC"
    meeting_type: MeetingType
    location: Optional[str] = None
    status: MeetingStatus
    notes: Optional[str] = None
    agenda_items: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Summary fields
    summary: Optional[str] = None
    action_items: Optional[List[str]] = None
    # Comprehensive summary fields
    comprehensive_summary: Optional[Dict[str, Any]] = None


class TimeSlot(BaseModel):
    """Available time slot for meeting booking"""
    start_time: datetime
    end_time: datetime


class AvailabilityRequest(BaseModel):
    """Request model for checking availability"""
    start_date: datetime
    end_date: datetime
    duration_minutes: int = 30
    timezone: str = "UTC"


class AvailabilityResponse(BaseModel):
    """Response model for available time slots"""
    available_slots: List[TimeSlot]


class AvailableTimeSlot(BaseModel):
    """Available time slot model"""
    start: datetime
    end: datetime 