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
    NotificationType, NotificationPriority, NotificationChannel, NotificationStatus,
    NotificationPreference, DeliveryChannel
)
from ..core.database import get_db, fetch_one, fetch_all, execute
from ..core.exceptions import NotFoundException, BadRequestException, ResourceNotFoundException, DatabaseException
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

    @staticmethod
    async def get_user_preferences(user_id: int) -> List[NotificationPreference]:
        """
        Get notification preferences for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of notification preferences
        """
        try:
            query = """
                SELECT * FROM notification_preferences
                WHERE user_id = $1
            """
            
            results = await fetch_all(query, user_id)
            
            preferences = []
            for row in results:
                preferences.append(NotificationPreference(
                    user_id=row["user_id"],
                    notification_type=row["notification_type"],
                    enabled=row["enabled"],
                    delivery_channels=row["delivery_channels"],
                    time_window=row["time_window"],
                    config=row.get("config", {})
                ))
            
            return preferences
            
        except Exception as e:
            logger.error(f"Error getting user notification preferences: {e}")
            raise DatabaseException(f"Failed to retrieve notification preferences: {str(e)}")
    
    @staticmethod
    async def get_preference(
        user_id: int,
        notification_type: NotificationType
    ) -> Optional[NotificationPreference]:
        """
        Get a specific notification preference
        
        Args:
            user_id: ID of the user
            notification_type: Type of notification
            
        Returns:
            Notification preference or None if not found
        """
        try:
            query = """
                SELECT * FROM notification_preferences
                WHERE user_id = $1 AND notification_type = $2
            """
            
            row = await fetch_one(query, user_id, notification_type.value)
            
            if not row:
                # Return default preference if not found
                return NotificationPreference(
                    user_id=user_id,
                    notification_type=notification_type,
                    enabled=True,
                    delivery_channels=[DeliveryChannel.IN_APP],
                    time_window=None,
                    config={}
                )
            
            return NotificationPreference(
                user_id=row["user_id"],
                notification_type=row["notification_type"],
                enabled=row["enabled"],
                delivery_channels=row["delivery_channels"],
                time_window=row["time_window"],
                config=row.get("config", {})
            )
            
        except Exception as e:
            logger.error(f"Error getting notification preference: {e}")
            raise DatabaseException(f"Failed to retrieve notification preference: {str(e)}")
    
    @staticmethod
    async def update_preference(
        user_id: int,
        notification_type: NotificationType,
        update_data: Dict[str, Any]
    ) -> NotificationPreference:
        """
        Update a notification preference
        
        Args:
            user_id: ID of the user
            notification_type: Type of notification
            update_data: Data to update
            
        Returns:
            Updated notification preference
        """
        try:
            # Check if preference exists
            existing = await NotificationService.get_preference(user_id, notification_type)
            
            if existing and hasattr(existing, "user_id"):
                # Update existing preference
                update_fields = []
                params = []
                param_idx = 1
                
                for field, value in update_data.items():
                    if hasattr(existing, field):
                        update_fields.append(f"{field} = ${param_idx}")
                        params.append(value)
                        param_idx += 1
                
                if update_fields:
                    query = f"""
                        UPDATE notification_preferences
                        SET {", ".join(update_fields)}
                        WHERE user_id = ${param_idx} AND notification_type = ${param_idx + 1}
                        RETURNING *
                    """
                    params.extend([user_id, notification_type.value])
                    
                    row = await fetch_one(query, *params)
                    
                    return NotificationPreference(
                        user_id=row["user_id"],
                        notification_type=row["notification_type"],
                        enabled=row["enabled"],
                        delivery_channels=row["delivery_channels"],
                        time_window=row["time_window"],
                        config=row.get("config", {})
                    )
            else:
                # Create new preference
                fields = ["user_id", "notification_type", "enabled", "delivery_channels", "time_window", "config"]
                values = [user_id, notification_type.value]
                placeholders = ["$1", "$2"]
                
                # Set defaults
                data = {
                    "enabled": True,
                    "delivery_channels": [DeliveryChannel.IN_APP.value],
                    "time_window": None,
                    "config": {}
                }
                
                # Update with provided data
                data.update(update_data)
                
                # Add to query
                for idx, field in enumerate(fields[2:], start=3):
                    if field in data:
                        values.append(data[field])
                        placeholders.append(f"${idx}")
                
                query = f"""
                    INSERT INTO notification_preferences
                    ({", ".join(fields)})
                    VALUES ({", ".join(placeholders)})
                    RETURNING *
                """
                
                row = await fetch_one(query, *values)
                
                return NotificationPreference(
                    user_id=row["user_id"],
                    notification_type=row["notification_type"],
                    enabled=row["enabled"],
                    delivery_channels=row["delivery_channels"],
                    time_window=row["time_window"],
                    config=row.get("config", {})
                )
                
        except Exception as e:
            logger.error(f"Error updating notification preference: {e}")
            raise DatabaseException(f"Failed to update notification preference: {str(e)}")
    
    @staticmethod
    async def create_notification(notification_data: NotificationCreate) -> Notification:
        """
        Create a new notification
        
        Args:
            notification_data: Notification data
            
        Returns:
            Created notification
        """
        try:
            # Get user preferences
            preference = await NotificationService.get_preference(
                notification_data.user_id, 
                notification_data.notification_type
            )
            
            # Check if notifications are enabled
            if not preference.enabled:
                logger.info(f"Notification disabled for user {notification_data.user_id}, type {notification_data.notification_type}")
                # Return a dummy notification that wasn't actually saved
                return Notification(
                    id=-1,
                    user_id=notification_data.user_id,
                    notification_type=notification_data.notification_type,
                    title=notification_data.title,
                    message=notification_data.message,
                    data=notification_data.data or {},
                    is_read=False,
                    created_at=datetime.now()
                )
            
            # Create notification in database
            query = """
                INSERT INTO notifications
                (user_id, notification_type, title, message, data, is_read, created_at)
                VALUES ($1, $2, $3, $4, $5, false, $6)
                RETURNING *
            """
            
            row = await fetch_one(
                query,
                notification_data.user_id,
                notification_data.notification_type.value,
                notification_data.title,
                notification_data.message,
                notification_data.data or {},
                datetime.now()
            )
            
            notification = Notification(
                id=row["id"],
                user_id=row["user_id"],
                notification_type=row["notification_type"],
                title=row["title"],
                message=row["message"],
                data=row["data"],
                is_read=row["is_read"],
                created_at=row["created_at"],
                read_at=row["read_at"]
            )
            
            # Handle delivery to different channels based on user preferences
            await NotificationService._deliver_notification(notification, preference)
            
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise DatabaseException(f"Failed to create notification: {str(e)}")
    
    @staticmethod
    async def _deliver_notification(
        notification: Notification,
        preference: NotificationPreference
    ) -> None:
        """
        Deliver notification to specified channels
        
        Args:
            notification: Notification to deliver
            preference: User's notification preferences
        """
        # Check time window if set
        if preference.time_window:
            try:
                now = datetime.now().time()
                start_time, end_time = preference.time_window.split('-')
                start_hour, start_min = map(int, start_time.split(':'))
                end_hour, end_min = map(int, end_time.split(':'))
                
                start = datetime.now().replace(hour=start_hour, minute=start_min, second=0).time()
                end = datetime.now().replace(hour=end_hour, minute=end_min, second=0).time()
                
                if not (start <= now <= end):
                    logger.info(f"Notification outside time window for user {notification.user_id}")
                    return
            except Exception as e:
                logger.error(f"Error checking notification time window: {e}")
        
        # Deliver to each channel
        for channel in preference.delivery_channels:
            if channel == DeliveryChannel.EMAIL:
                # Send email notification
                logger.info(f"Sending email notification to user {notification.user_id}")
                # Email sending logic would go here
                
            elif channel == DeliveryChannel.PUSH:
                # Send push notification
                logger.info(f"Sending push notification to user {notification.user_id}")
                # Push notification logic would go here
                
            elif channel == DeliveryChannel.SMS:
                # Send SMS notification
                logger.info(f"Sending SMS notification to user {notification.user_id}")
                # SMS sending logic would go here
    
    @staticmethod
    async def get_notifications(
        user_id: int,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False
    ) -> Dict[str, Any]:
        """
        Get notifications for a user
        
        Args:
            user_id: ID of the user
            limit: Maximum number of notifications to return
            offset: Offset for pagination
            unread_only: Whether to return only unread notifications
            
        Returns:
            Dictionary with notifications and counts
        """
        try:
            # Construct the WHERE clause
            where_clause = "WHERE user_id = $1"
            params = [user_id]
            
            if unread_only:
                where_clause += " AND is_read = false"
            
            # Get total count
            count_query = f"""
                SELECT COUNT(*) as total
                FROM notifications
                {where_clause}
            """
            
            count_result = await fetch_one(count_query, *params)
            total = count_result["total"]
            
            # Get unread count
            unread_query = """
                SELECT COUNT(*) as unread
                FROM notifications
                WHERE user_id = $1 AND is_read = false
            """
            
            unread_result = await fetch_one(unread_query, user_id)
            unread_count = unread_result["unread"]
            
            # Get notifications
            query = f"""
                SELECT *
                FROM notifications
                {where_clause}
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            """
            
            rows = await fetch_all(query, *params, limit, offset)
            
            notifications = []
            for row in rows:
                notifications.append(Notification(
                    id=row["id"],
                    user_id=row["user_id"],
                    notification_type=row["notification_type"],
                    title=row["title"],
                    message=row["message"],
                    data=row["data"],
                    is_read=row["is_read"],
                    created_at=row["created_at"],
                    read_at=row["read_at"]
                ))
            
            return {
                "items": notifications,
                "total": total,
                "unread_count": unread_count
            }
            
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            raise DatabaseException(f"Failed to retrieve notifications: {str(e)}")
    
    @staticmethod
    async def mark_as_read(
        user_id: int,
        notification_id: int
    ) -> Notification:
        """
        Mark a notification as read
        
        Args:
            user_id: ID of the user
            notification_id: ID of the notification
            
        Returns:
            Updated notification
        """
        try:
            query = """
                UPDATE notifications
                SET is_read = true, read_at = $1
                WHERE id = $2 AND user_id = $3
                RETURNING *
            """
            
            row = await fetch_one(query, datetime.now(), notification_id, user_id)
            
            if not row:
                raise ResourceNotFoundException(f"Notification with id {notification_id} not found")
            
            return Notification(
                id=row["id"],
                user_id=row["user_id"],
                notification_type=row["notification_type"],
                title=row["title"],
                message=row["message"],
                data=row["data"],
                is_read=row["is_read"],
                created_at=row["created_at"],
                read_at=row["read_at"]
            )
            
        except ResourceNotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            raise DatabaseException(f"Failed to update notification: {str(e)}")
    
    @staticmethod
    async def mark_all_as_read(user_id: int) -> int:
        """
        Mark all notifications as read for a user
        
        Args:
            user_id: ID of the user
            
        Returns:
            Number of notifications marked as read
        """
        try:
            query = """
                UPDATE notifications
                SET is_read = true, read_at = $1
                WHERE user_id = $2 AND is_read = false
                RETURNING id
            """
            
            rows = await fetch_all(query, datetime.now(), user_id)
            return len(rows)
            
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {e}")
            raise DatabaseException(f"Failed to update notifications: {str(e)}")
    
    @staticmethod
    async def delete_notification(
        user_id: int,
        notification_id: int
    ) -> bool:
        """
        Delete a notification
        
        Args:
            user_id: ID of the user
            notification_id: ID of the notification
            
        Returns:
            True if deleted, False if not found
        """
        try:
            query = """
                DELETE FROM notifications
                WHERE id = $1 AND user_id = $2
                RETURNING id
            """
            
            row = await fetch_one(query, notification_id, user_id)
            
            return row is not None
            
        except Exception as e:
            logger.error(f"Error deleting notification: {e}")
            raise DatabaseException(f"Failed to delete notification: {str(e)}") 