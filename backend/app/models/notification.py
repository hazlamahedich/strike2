"""
Notification models for the CRM system.
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


class NotificationType(str, Enum):
    """Types of system notifications"""
    LEAD_STATUS_CHANGE = "lead_status_change"
    TASK_ASSIGNED = "task_assigned"
    TASK_DUE = "task_due"
    TASK_COMPLETED = "task_completed" 
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_REMINDER = "meeting_reminder"
    REPORT_READY = "report_ready"
    CAMPAIGN_STARTED = "campaign_started"
    CAMPAIGN_ENDED = "campaign_ended"
    AI_INSIGHT = "ai_insight"
    SYSTEM = "system"


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


class NotificationPreference(BaseModel):
    """User preference for a notification type"""
    notification_type: NotificationType
    channels: List[NotificationChannel] = [NotificationChannel.IN_APP]
    enabled: bool = True


class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: str
    preferences: List[NotificationPreference] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Notification(BaseModel):
    """Notification model"""
    id: Optional[str] = None
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    status: NotificationStatus = NotificationStatus.PENDING
    channel: NotificationChannel = NotificationChannel.IN_APP
    read_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class NotificationCreate(BaseModel):
    """Model for creating a notification"""
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: NotificationPriority = NotificationPriority.MEDIUM
    channel: NotificationChannel = NotificationChannel.IN_APP


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