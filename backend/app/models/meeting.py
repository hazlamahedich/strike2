"""
Meeting models for calendar and meeting management functionality.
"""
from datetime import datetime, time
from enum import Enum
from typing import Dict, List, Optional, Any, Union

from pydantic import BaseModel, Field, EmailStr, validator, HttpUrl


class MeetingStatus(str, Enum):
    """Status of a meeting"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


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

    @validator('end_time')
    def end_time_after_start_time(cls, v, values):
        """Validate that end_time is after start_time"""
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class MeetingCreate(BaseModel):
    """Meeting creation model"""
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    lead_id: Optional[str] = None
    location: MeetingLocation
    attendee_emails: List[EmailStr] = Field(default_factory=list)
    agenda_items: List[str] = Field(default_factory=list)
    reminder_time: Optional[int] = 15


class MeetingUpdate(BaseModel):
    """Meeting update model"""
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[MeetingStatus] = None
    location: Optional[MeetingLocation] = None
    notes: Optional[str] = None
    agenda_items: Optional[List[str]] = None
    reminder_time: Optional[int] = None


class MeetingResponse(BaseModel):
    """Meeting response model"""
    id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: MeetingStatus
    location: MeetingLocation
    organizer: Dict[str, Any]  # Simplified user info
    lead: Optional[Dict[str, Any]] = None  # Simplified lead info if applicable
    attendees: List[Dict[str, Any]]  # Simplified attendee info
    notes: Optional[str] = None
    calendar_provider: Optional[CalendarProvider] = None
    agenda_items: List[str]
    created_at: datetime
    updated_at: datetime


class TimeSlot(BaseModel):
    """Available time slot for meeting booking"""
    start_time: datetime
    end_time: datetime


class AvailabilityRequest(BaseModel):
    """Request for user availability"""
    user_id: str
    date_from: datetime
    date_to: datetime
    duration_minutes: int = 30


class AvailabilityResponse(BaseModel):
    """Response with available time slots"""
    available_slots: List[TimeSlot]
    user_id: str
    date_from: datetime
    date_to: datetime
    duration_minutes: int 