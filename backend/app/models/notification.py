"""
Notification models for the CRM system.
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, validator


class NotificationType(str, Enum):
    """Types of notifications supported by the system"""
    LEAD_ASSIGNED = "lead_assigned"
    LEAD_STATUS_CHANGED = "lead_status_changed"
    TASK_ASSIGNED = "task_assigned"
    TASK_DUE_SOON = "task_due_soon"
    TASK_OVERDUE = "task_overdue"
    EMAIL_RECEIVED = "email_received"
    EMAIL_OPENED = "email_opened"
    EMAIL_CLICKED = "email_clicked"
    SMS_RECEIVED = "sms_received"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_REMINDER = "meeting_reminder"
    SYSTEM_ALERT = "system_alert"


class NotificationPriority(str, Enum):
    """Priority levels for notifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationChannel(str, Enum):
    """Channels through which notifications can be delivered"""
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class NotificationStatus(str, Enum):
    """Status of a notification"""
    PENDING = "pending"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class DeliveryChannel(str, Enum):
    """Delivery channels for notifications"""
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    IN_APP = "in_app"
    NONE = "none"


class NotificationPreference(BaseModel):
    """User preference for notifications"""
    user_id: int
    notification_type: NotificationType
    enabled: bool = True
    delivery_channels: List[DeliveryChannel] = [DeliveryChannel.IN_APP]
    
    # Time window during which the user wants to receive notifications
    # Format: "HH:MM-HH:MM" in 24-hour format, e.g. "09:00-17:00"
    time_window: Optional[str] = None
    
    # Custom configuration for specific notification types
    config: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('time_window')
    def validate_time_window(cls, v):
        """Validate time window format"""
        if v is None:
            return v
        
        try:
            start, end = v.split('-')
            start_h, start_m = map(int, start.split(':'))
            end_h, end_m = map(int, end.split(':'))
            
            if not (0 <= start_h <= 23 and 0 <= start_m <= 59):
                raise ValueError("Invalid start time")
            if not (0 <= end_h <= 23 and 0 <= end_m <= 59):
                raise ValueError("Invalid end time")
        except Exception:
            raise ValueError("Time window must be in the format 'HH:MM-HH:MM' (24-hour)")
        
        return v
    
    class Config:
        from_attributes = True


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: str
    preferences: List[NotificationPreference] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Notification(BaseModel):
    """Notification model"""
    id: int
    user_id: int
    notification_type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)
    is_read: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    """Model for creating a notification"""
    user_id: int
    notification_type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationUpdate(BaseModel):
    """Model for updating a notification"""
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """Response model for notifications"""
    id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: NotificationPriority
    status: NotificationStatus
    channel: NotificationChannel
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationCount(BaseModel):
    """Count of unread notifications"""
    total: int
    high_priority: int
    medium_priority: int
    low_priority: int


class NotificationList(BaseModel):
    """Response model for listing notifications"""
    items: List[Notification]
    total: int
    unread_count: int


class NotificationPreferenceUpdate(BaseModel):
    """Model for updating notification preferences"""
    enabled: Optional[bool] = None
    delivery_channels: Optional[List[DeliveryChannel]] = None
    time_window: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    
    @validator('time_window')
    def validate_time_window(cls, v):
        """Validate time window format"""
        if v is None:
            return v
        
        try:
            start, end = v.split('-')
            start_h, start_m = map(int, start.split(':'))
            end_h, end_m = map(int, end.split(':'))
            
            if not (0 <= start_h <= 23 and 0 <= start_m <= 59):
                raise ValueError("Invalid start time")
            if not (0 <= end_h <= 23 and 0 <= end_m <= 59):
                raise ValueError("Invalid end time")
        except Exception:
            raise ValueError("Time window must be in the format 'HH:MM-HH:MM' (24-hour)")
        
        return v 