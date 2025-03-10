from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Email Models
class EmailStatus(str, Enum):
    """Email status options"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"
    SPAM = "spam"
    FAILED = "failed"

class EmailBase(BaseModel):
    """Base model for emails"""
    lead_id: Optional[int] = None
    subject: str
    body: str
    sent_from: EmailStr
    sent_to: EmailStr
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EmailCreate(EmailBase):
    """Model for creating a new email"""
    user_id: int
    send_now: bool = False

class EmailUpdate(BaseModel):
    """Model for updating an email"""
    subject: Optional[str] = None
    body: Optional[str] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    scheduled_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[EmailStatus] = None

class Email(EmailBase):
    """Complete email model with system fields"""
    id: int
    user_id: int
    status: EmailStatus = EmailStatus.DRAFT
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    opened_at: Optional[datetime] = None
    clicked_at: Optional[datetime] = None
    open_count: int = 0
    click_count: int = 0
    sentiment_score: Optional[float] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

# Add alias for Email as EmailMessage for backward compatibility
EmailMessage = Email

class EmailDetail(Email):
    """Email with additional details like lead and user information"""
    lead: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class EmailFilter(BaseModel):
    """Model for filtering emails"""
    search: Optional[str] = None
    lead_id: Optional[Union[int, List[int]]] = None
    user_id: Optional[Union[int, List[int]]] = None
    status: Optional[List[EmailStatus]] = None
    sent_after: Optional[datetime] = None
    sent_before: Optional[datetime] = None
    sentiment_min: Optional[float] = None
    sentiment_max: Optional[float] = None

# SMS Models
class SMSStatus(str, Enum):
    """SMS status options"""
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"

class SMSBase(BaseModel):
    """Base model for SMS messages"""
    lead_id: Optional[int] = None
    body: str
    sent_from: str
    sent_to: str
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SMSCreate(SMSBase):
    """Model for creating a new SMS"""
    user_id: int
    send_now: bool = False

class SMSUpdate(BaseModel):
    """Model for updating an SMS"""
    body: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[SMSStatus] = None

class SMS(SMSBase):
    """Complete SMS model with system fields"""
    id: int
    user_id: int
    status: SMSStatus = SMSStatus.DRAFT
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    delivered_at: Optional[datetime] = None
    sentiment_score: Optional[float] = None
    
    class Config:
        orm_mode = True

# Add alias for SMS as SMSMessage for backward compatibility
SMSMessage = SMS

class SMSDetail(SMS):
    """SMS with additional details like lead and user information"""
    lead: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class SMSFilter(BaseModel):
    """Model for filtering SMS messages"""
    search: Optional[str] = None
    lead_id: Optional[Union[int, List[int]]] = None
    user_id: Optional[Union[int, List[int]]] = None
    status: Optional[List[SMSStatus]] = None
    sent_after: Optional[datetime] = None
    sent_before: Optional[datetime] = None
    sentiment_min: Optional[float] = None
    sentiment_max: Optional[float] = None

# Call Models
class CallDirection(str, Enum):
    """Call direction options"""
    INBOUND = "inbound"
    OUTBOUND = "outbound"

class CallStatus(str, Enum):
    """Call status options"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    MISSED = "missed"
    VOICEMAIL = "voicemail"
    CANCELLED = "cancelled"
    FAILED = "failed"

class CallBase(BaseModel):
    """Base model for calls"""
    lead_id: Optional[int] = None
    direction: CallDirection = CallDirection.OUTBOUND
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = None  # in seconds
    notes: Optional[str] = None
    purpose: Optional[str] = None
    caller: str
    recipient: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CallCreate(CallBase):
    """Model for creating a new call"""
    user_id: int

class CallUpdate(BaseModel):
    """Model for updating a call"""
    scheduled_at: Optional[datetime] = None
    duration: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[CallStatus] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Call(CallBase):
    """Complete call model with system fields"""
    id: int
    user_id: int
    status: CallStatus = CallStatus.SCHEDULED
    call_time: Optional[datetime] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sentiment_score: Optional[float] = None
    
    class Config:
        orm_mode = True

class CallDetail(Call):
    """Call with additional details like lead and user information"""
    lead: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class CallFilter(BaseModel):
    """Model for filtering calls"""
    search: Optional[str] = None
    lead_id: Optional[Union[int, List[int]]] = None
    user_id: Optional[Union[int, List[int]]] = None
    status: Optional[List[CallStatus]] = None
    direction: Optional[CallDirection] = None
    call_after: Optional[datetime] = None
    call_before: Optional[datetime] = None
    duration_min: Optional[int] = None
    duration_max: Optional[int] = None
    sentiment_min: Optional[float] = None
    sentiment_max: Optional[float] = None

# Communication Templates
class TemplateType(str, Enum):
    EMAIL = "email"
    SMS = "sms"

class TemplateBase(BaseModel):
    name: str
    content: str
    type: TemplateType
    variables: List[str] = []
    team_id: Optional[int] = None

class TemplateCreate(TemplateBase):
    pass

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None
    is_active: Optional[bool] = None

class Template(TemplateBase):
    id: int
    user_id: int
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class EmailTemplate(BaseModel):
    """Model for email templates"""
    id: Optional[int] = None
    name: str
    subject: str
    body: str
    created_by: int
    team_id: Optional[int] = None
    is_global: bool = False
    variables: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class SMSTemplate(BaseModel):
    """Model for SMS templates"""
    id: Optional[int] = None
    name: str
    body: str
    created_by: int
    team_id: Optional[int] = None
    is_global: bool = False
    variables: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class EmailTemplateCreate(BaseModel):
    """Model for creating an email template"""
    name: str
    subject: str
    body: str
    team_id: Optional[int] = None
    is_global: bool = False
    variables: List[str] = Field(default_factory=list)

class EmailTemplateUpdate(BaseModel):
    """Model for updating an email template"""
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    team_id: Optional[int] = None
    is_global: Optional[bool] = None
    variables: Optional[List[str]] = None

class SMSTemplateCreate(BaseModel):
    """Model for creating an SMS template"""
    name: str
    body: str
    team_id: Optional[int] = None
    is_global: bool = False
    variables: List[str] = Field(default_factory=list)

class SMSTemplateUpdate(BaseModel):
    """Model for updating an SMS template"""
    name: Optional[str] = None
    body: Optional[str] = None
    team_id: Optional[int] = None
    is_global: Optional[bool] = None
    variables: Optional[List[str]] = None

class EmailSequence(BaseModel):
    """Model for email sequences"""
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    created_by: int
    team_id: Optional[int] = None
    is_active: bool = True
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class EmailSequenceCreate(BaseModel):
    """Model for creating an email sequence"""
    name: str
    description: Optional[str] = None
    team_id: Optional[int] = None
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    is_active: bool = True

class EmailSequenceUpdate(BaseModel):
    """Model for updating an email sequence"""
    name: Optional[str] = None
    description: Optional[str] = None
    team_id: Optional[int] = None
    steps: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

# Add alias for CallTranscript which might be missing
class CallTranscript(BaseModel):
    """Model for call transcripts"""
    call_sid: str
    recording_sid: str
    transcription_sid: str
    recording_url: str
    transcription_text: str
    duration: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    transcription_method: str = "twilio"  # Can be "twilio", "whisper", or "whisper_in_progress"
    
    class Config:
        from_attributes = True
        orm_mode = True

# Add alias for EmailSequenceStep
class EmailSequenceStep(BaseModel):
    sequence_id: int
    step_order: int
    delay_days: int
    email_template_id: int
    is_active: bool = True
    
    class Config:
        from_attributes = True
        orm_mode = True

# Add response models for API endpoints
class EmailMessageResponse(BaseModel):
    """Response model for email sending endpoint"""
    id: int
    status: EmailStatus
    message: str = "Email sent successfully"
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

class SMSMessageResponse(BaseModel):
    """Response model for SMS sending endpoint"""
    id: int
    status: SMSStatus
    message: str = "SMS sent successfully"
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

class CallResponse(BaseModel):
    """Response model for call endpoint"""
    id: int
    status: CallStatus
    message: str = "Call initiated successfully"
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

# Contact (Address Book) Models
class ContactType(str, Enum):
    """Contact type options"""
    LEAD = "lead"
    CLIENT = "client"
    VENDOR = "vendor"
    PARTNER = "partner"
    OTHER = "other"

class ContactBase(BaseModel):
    """Base model for contacts"""
    name: str
    phone_number: str
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    contact_type: ContactType = ContactType.LEAD
    lead_id: Optional[int] = None
    notes: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContactCreate(ContactBase):
    """Model for creating a new contact"""
    user_id: int

class ContactUpdate(BaseModel):
    """Model for updating a contact"""
    name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    contact_type: Optional[ContactType] = None
    lead_id: Optional[int] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Contact(ContactBase):
    """Complete contact model with system fields"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True

class ContactDetail(Contact):
    """Contact with additional details like lead information"""
    lead: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class ContactFilter(BaseModel):
    """Model for filtering contacts"""
    search: Optional[str] = None
    lead_id: Optional[Union[int, List[int]]] = None
    user_id: Optional[Union[int, List[int]]] = None
    contact_type: Optional[List[ContactType]] = None

# Call Log Models
class CallLogStatus(str, Enum):
    """Call log status options"""
    COMPLETED = "completed"
    MISSED = "missed"
    VOICEMAIL = "voicemail"
    FAILED = "failed"

class CallLogBase(BaseModel):
    """Base model for call logs"""
    contact_id: Optional[int] = None
    lead_id: Optional[int] = None
    direction: CallDirection
    duration: Optional[int] = None  # in seconds
    notes: Optional[str] = None
    caller_number: str
    recipient_number: str
    call_sid: Optional[str] = None
    recording_url: Optional[str] = None
    transcription: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CallLogCreate(CallLogBase):
    """Model for creating a new call log"""
    user_id: int
    status: CallLogStatus

class CallLogUpdate(BaseModel):
    """Model for updating a call log"""
    duration: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[CallLogStatus] = None
    recording_url: Optional[str] = None
    transcription: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CallLog(CallLogBase):
    """Complete call log model with system fields"""
    id: int
    user_id: int
    status: CallLogStatus
    call_time: datetime
    created_at: datetime
    updated_at: datetime
    sentiment_score: Optional[float] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

class CallLogDetail(CallLog):
    """Call log with additional details like contact and lead information"""
    contact: Optional[Dict[str, Any]] = None
    lead: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class CallLogFilter(BaseModel):
    """Model for filtering call logs"""
    search: Optional[str] = None
    contact_id: Optional[Union[int, List[int]]] = None
    lead_id: Optional[Union[int, List[int]]] = None
    user_id: Optional[Union[int, List[int]]] = None
    status: Optional[List[CallLogStatus]] = None
    direction: Optional[CallDirection] = None
    call_after: Optional[datetime] = None
    call_before: Optional[datetime] = None
    duration_min: Optional[int] = None
    duration_max: Optional[int] = None

# Dialpad Models
class DialpadAction(str, Enum):
    """Dialpad action options"""
    DIAL = "dial"
    ANSWER = "answer"
    HANGUP = "hangup"
    HOLD = "hold"
    RESUME = "resume"
    TRANSFER = "transfer"
    MUTE = "mute"
    UNMUTE = "unmute"
    DTMF = "dtmf"  # Dual-tone multi-frequency signaling (keypad tones)

class DialpadRequest(BaseModel):
    """Model for dialpad requests"""
    action: DialpadAction
    call_sid: Optional[str] = None
    to: Optional[str] = None
    from_: Optional[str] = Field(None, alias="from")
    digits: Optional[str] = None  # For DTMF
    transfer_to: Optional[str] = None  # For TRANSFER
    record: bool = True
    
    class Config:
        allow_population_by_field_name = True

class DialpadResponse(BaseModel):
    """Response model for dialpad requests"""
    success: bool
    message: str
    call_sid: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        orm_mode = True 