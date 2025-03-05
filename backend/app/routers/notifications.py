"""
Notification router for handling system notifications.
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from fastapi.responses import JSONResponse

from ..models.notification import (
    Notification, NotificationResponse, NotificationCount, 
    NotificationPreferences, NotificationStatus, NotificationType
)
from ..services.notification import NotificationService
from ..core.security import get_current_user
from ..models.user import User
from ..core.exceptions import NotFoundException, BadRequestException

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "Not found"}},
)

notification_service = NotificationService()


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    status: Optional[NotificationStatus] = Query(None, description="Filter by notification status"),
    type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    skip: int = Query(0, description="Skip the first N notifications"),
    limit: int = Query(50, description="Limit the number of notifications returned"),
    current_user: User = Depends(get_current_user)
) -> List[NotificationResponse]:
    """List notifications for the current user, with optional filtering."""
    notifications = await notification_service.list_notifications(
        user_id=current_user.id,
        status=status,
        type=type,
        skip=skip,
        limit=limit
    )
    
    # Convert to response model
    return [
        NotificationResponse(
            id=notification.id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            data=notification.data,
            priority=notification.priority,
            status=notification.status,
            channel=notification.channel,
            read_at=notification.read_at,
            created_at=notification.created_at
        ) for notification in notifications
    ]


@router.get("/count", response_model=NotificationCount)
async def get_notification_count(
    current_user: User = Depends(get_current_user)
) -> NotificationCount:
    """Get count of unread notifications for the current user."""
    return await notification_service.get_notification_count(current_user.id)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str = Path(..., description="The ID of the notification to get"),
    current_user: User = Depends(get_current_user)
) -> NotificationResponse:
    """Get a specific notification."""
    try:
        notification = await notification_service.get_notification(notification_id, current_user.id)
        return NotificationResponse(
            id=notification.id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            data=notification.data,
            priority=notification.priority,
            status=notification.status,
            channel=notification.channel,
            read_at=notification.read_at,
            created_at=notification.created_at
        )
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str = Path(..., description="The ID of the notification to mark as read"),
    current_user: User = Depends(get_current_user)
) -> NotificationResponse:
    """Mark a notification as read."""
    try:
        notification = await notification_service.mark_as_read(notification_id, current_user.id)
        return NotificationResponse(
            id=notification.id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            data=notification.data,
            priority=notification.priority,
            status=notification.status,
            channel=notification.channel,
            read_at=notification.read_at,
            created_at=notification.created_at
        )
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/read-all", response_model=Dict[str, int])
async def mark_all_as_read(
    current_user: User = Depends(get_current_user)
) -> Dict[str, int]:
    """Mark all notifications as read for the current user."""
    count = await notification_service.mark_all_as_read(current_user.id)
    return {"count": count}


@router.delete("/{notification_id}", response_model=Dict[str, bool])
async def delete_notification(
    notification_id: str = Path(..., description="The ID of the notification to delete"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, bool]:
    """Delete a notification."""
    try:
        success = await notification_service.delete_notification(notification_id, current_user.id)
        return {"success": success}
    except NotFoundException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# Notification preferences endpoints
@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
) -> NotificationPreferences:
    """Get notification preferences for the current user."""
    return await notification_service.get_user_preferences(current_user.id)


@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: User = Depends(get_current_user)
) -> NotificationPreferences:
    """Update notification preferences for the current user."""
    if preferences.user_id != current_user.id:
        preferences.user_id = current_user.id
    
    return await notification_service.update_user_preferences(current_user.id, preferences) 