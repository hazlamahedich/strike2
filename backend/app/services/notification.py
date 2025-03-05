"""
Notification service for handling system notifications across different channels.
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from uuid import uuid4

from sqlalchemy import text, desc
from sqlalchemy.orm import Session

from ..models.notification import (
    Notification, NotificationCreate, NotificationUpdate,
    NotificationResponse, NotificationCount, NotificationPreferences,
    NotificationType, NotificationPriority, NotificationChannel, NotificationStatus
)
from ..core.database import get_db
from ..core.exceptions import NotFoundException, BadRequestException
from ..services.communication import CommunicationService

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing and sending notifications."""
    
    def __init__(self):
        """Initialize the notification service."""
        self.communication_service = CommunicationService()
    
    async def create_notification(self, notification: NotificationCreate) -> Notification:
        """Create a new notification and send it through the appropriate channel."""
        notification_id = str(uuid4())
        now = datetime.now()
        
        notification_obj = Notification(
            id=notification_id,
            created_at=now,
            updated_at=now,
            **notification.dict()
        )
        
        # Determine if we need to send this through external channels
        await self._send_notification(notification_obj)
        
        # Here we would save to the database
        # For now, just return the created object
        return notification_obj
    
    async def _send_notification(self, notification: Notification) -> None:
        """Send a notification through the appropriate channel."""
        try:
            if notification.channel == NotificationChannel.IN_APP:
                # In-app notifications are stored in the database only
                notification.status = NotificationStatus.DELIVERED
                return
                
            elif notification.channel == NotificationChannel.EMAIL:
                # Send via email
                await self.communication_service.send_email(
                    to_email=notification.user_id,  # Assuming user_id is the email
                    subject=notification.title,
                    content=notification.message,
                    template="notification"
                )
                notification.status = NotificationStatus.DELIVERED
                
            elif notification.channel == NotificationChannel.SMS:
                # Send via SMS
                await self.communication_service.send_sms(
                    to_phone=notification.user_id,  # We would need to look up user's phone
                    message=f"{notification.title}: {notification.message}"
                )
                notification.status = NotificationStatus.DELIVERED
                
            elif notification.channel == NotificationChannel.PUSH:
                # Send via push notification
                # This would typically integrate with a push notification service
                logger.info(f"Push notification would be sent here: {notification.title}")
                notification.status = NotificationStatus.DELIVERED
                
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            notification.status = NotificationStatus.FAILED
    
    async def get_notification(self, notification_id: str, user_id: str) -> Notification:
        """Get a notification by ID."""
        # Here we would fetch from the database
        # For now, we'll simulate a not found exception
        raise NotFoundException(f"Notification with ID {notification_id} not found")
    
    async def update_notification(self, notification_id: str, update: NotificationUpdate, user_id: str) -> Notification:
        """Update a notification's status."""
        # Fetch the existing notification
        notification = await self.get_notification(notification_id, user_id)
        
        # Update fields
        update_data = update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(notification, key, value)
        
        notification.updated_at = datetime.now()
        
        # Here we would save to the database
        # For now, just return the updated object
        return notification
    
    async def mark_as_read(self, notification_id: str, user_id: str) -> Notification:
        """Mark a notification as read."""
        notification = await self.get_notification(notification_id, user_id)
        
        if notification.status != NotificationStatus.READ:
            notification.status = NotificationStatus.READ
            notification.read_at = datetime.now()
            notification.updated_at = datetime.now()
            
            # Here we would save to the database
        
        return notification
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read."""
        # Here we would update all unread notifications in the database
        # For now, return a dummy count
        return 5
    
    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification."""
        # Fetch the existing notification to ensure it exists and belongs to the user
        notification = await self.get_notification(notification_id, user_id)
        
        # Here we would delete from the database
        # For now, just return success
        return True
    
    async def list_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        type: Optional[NotificationType] = None,
        skip: int = 0, 
        limit: int = 50
    ) -> List[Notification]:
        """List notifications for a user, with optional filtering by status and type."""
        # Here we would fetch from the database with filters
        # For now, return sample notifications
        now = datetime.now()
        five_min_ago = now.replace(minute=now.minute - 5)
        
        return [
            Notification(
                id="1",
                user_id=user_id,
                type=NotificationType.TASK_ASSIGNED,
                title="New Task Assigned",
                message="You have been assigned a new task: Call Lead",
                priority=NotificationPriority.HIGH,
                status=NotificationStatus.DELIVERED,
                channel=NotificationChannel.IN_APP,
                created_at=five_min_ago,
                updated_at=five_min_ago
            ),
            Notification(
                id="2",
                user_id=user_id,
                type=NotificationType.LEAD_STATUS_CHANGE,
                title="Lead Status Updated",
                message="Lead 'Acme Inc.' has been moved to 'Qualified'",
                priority=NotificationPriority.MEDIUM,
                status=NotificationStatus.DELIVERED,
                channel=NotificationChannel.IN_APP,
                created_at=now,
                updated_at=now
            )
        ]
    
    async def get_notification_count(self, user_id: str) -> NotificationCount:
        """Get count of unread notifications for a user."""
        # Here we would query the database for counts
        # For now, return sample counts
        return NotificationCount(
            total=5,
            high_priority=1,
            medium_priority=3,
            low_priority=1
        )
    
    async def get_user_preferences(self, user_id: str) -> NotificationPreferences:
        """Get notification preferences for a user."""
        # Here we would fetch from the database
        # For now, return default preferences for all notification types
        preferences = []
        for notification_type in NotificationType:
            if notification_type == NotificationType.LEAD_STATUS_CHANGE:
                # Example of a custom preference
                preferences.append(
                    NotificationPreference(
                        notification_type=notification_type,
                        channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                        enabled=True
                    )
                )
            else:
                # Default preference for other types
                preferences.append(
                    NotificationPreference(
                        notification_type=notification_type,
                        channels=[NotificationChannel.IN_APP],
                        enabled=True
                    )
                )
        
        return NotificationPreferences(
            user_id=user_id,
            preferences=preferences,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    async def update_user_preferences(self, user_id: str, preferences: NotificationPreferences) -> NotificationPreferences:
        """Update notification preferences for a user."""
        # Here we would update in the database
        preferences.updated_at = datetime.now()
        return preferences
    
    # Methods for sending specific types of notifications
    async def notify_lead_status_change(self, user_id: str, lead_name: str, old_status: str, new_status: str) -> Notification:
        """Send a notification about a lead status change."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.LEAD_STATUS_CHANGE,
                title="Lead Status Changed",
                message=f"Lead '{lead_name}' has been moved from '{old_status}' to '{new_status}'",
                priority=NotificationPriority.MEDIUM,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_task_assigned(self, user_id: str, task_name: str, assigner_name: str) -> Notification:
        """Send a notification about a task assignment."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.TASK_ASSIGNED,
                title="New Task Assigned",
                message=f"You have been assigned a new task: {task_name} by {assigner_name}",
                priority=NotificationPriority.HIGH,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_task_due(self, user_id: str, task_name: str, due_date: datetime) -> Notification:
        """Send a notification about a task that is due soon."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.TASK_DUE,
                title="Task Due Soon",
                message=f"Task '{task_name}' is due on {due_date.strftime('%Y-%m-%d %H:%M')}",
                priority=NotificationPriority.HIGH,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_meeting_scheduled(self, user_id: str, meeting_title: str, meeting_time: datetime) -> Notification:
        """Send a notification about a scheduled meeting."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.MEETING_SCHEDULED,
                title="New Meeting Scheduled",
                message=f"Meeting '{meeting_title}' has been scheduled for {meeting_time.strftime('%Y-%m-%d %H:%M')}",
                priority=NotificationPriority.MEDIUM,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_report_ready(self, user_id: str, report_name: str) -> Notification:
        """Send a notification about a report being ready."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.REPORT_READY,
                title="Report Ready",
                message=f"Your report '{report_name}' is now ready to view",
                priority=NotificationPriority.LOW,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_campaign_status(self, user_id: str, campaign_name: str, status: str) -> Notification:
        """Send a notification about a campaign status change."""
        notification_type = NotificationType.CAMPAIGN_STARTED if status == "started" else NotificationType.CAMPAIGN_ENDED
        title = f"Campaign {status.capitalize()}"
        
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=notification_type,
                title=title,
                message=f"Campaign '{campaign_name}' has {status}",
                priority=NotificationPriority.MEDIUM,
                channel=NotificationChannel.IN_APP
            )
        )
    
    async def notify_ai_insight(self, user_id: str, insight_title: str, insight_text: str) -> Notification:
        """Send a notification about an AI-generated insight."""
        return await self.create_notification(
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.AI_INSIGHT,
                title=f"AI Insight: {insight_title}",
                message=insight_text,
                priority=NotificationPriority.MEDIUM,
                channel=NotificationChannel.IN_APP
            )
        ) 