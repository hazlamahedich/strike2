"""
Meetings router module for calendar and meeting management API endpoints.
"""
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse

from app.models.meeting import (
    Meeting,
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingStatus,
    CalendarIntegration,
    CalendarProvider,
    AvailabilitySchedule,
    AvailabilityRequest,
    AvailabilityResponse,
    TimeSlot
)
from app.services.meeting import MeetingService
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/api/v1/meetings",
    tags=["meetings"],
    responses={404: {"description": "Not found"}},
)

# Initialize meeting service
meeting_service = MeetingService()

# Calendar integration endpoints

@router.get("/google-calendar/auth", response_model=Dict[str, str])
async def get_google_calendar_auth_url(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get Google Calendar authorization URL for integration
    """
    auth_url_data = await meeting_service.create_google_auth_url(current_user.id)
    return auth_url_data

@router.get("/google-calendar/callback")
async def google_calendar_callback(
    code: str,
    state: str
) -> JSONResponse:
    """
    Handle Google Calendar OAuth callback
    
    This endpoint is called by Google after user grants authorization.
    The state parameter should contain the user ID.
    """
    result = await meeting_service.handle_google_callback(code, state)
    
    # In a real implementation, this would redirect to a frontend page
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Calendar integration successful",
            "details": result
        }
    )

@router.post("/calendar/sync", response_model=Dict[str, Any])
async def sync_calendar(
    provider: CalendarProvider,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Sync calendar events from external provider
    """
    result = await meeting_service.sync_calendar_events(current_user.id, provider)
    return result

# Meeting management endpoints

@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new meeting
    """
    meeting = await meeting_service.create_meeting(meeting_data, current_user.id)
    
    # Transform to response model
    # In a real implementation, this would include full user and lead details
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "status": meeting.status,
        "location": meeting.location,
        "organizer": {
            "id": current_user.id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "email": current_user.email
        },
        "lead": {"id": meeting.lead_id} if meeting.lead_id else None,
        "attendees": [
            {
                "name": attendee.name,
                "email": attendee.email,
                "status": attendee.status
            }
            for attendee in meeting.attendees
        ],
        "notes": meeting.notes,
        "calendar_provider": meeting.calendar_provider,
        "agenda_items": meeting.agenda_items,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at
    }

@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get meeting by ID
    """
    meeting = await meeting_service.get_meeting_by_id(meeting_id)
    
    # Check if user is authorized to view this meeting
    # In a real implementation, check if user is organizer or attendee
    if meeting.organizer_id != current_user.id:
        is_attendee = False
        for attendee in meeting.attendees:
            if attendee.user_id == current_user.id:
                is_attendee = True
                break
        
        if not is_attendee:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this meeting"
            )
    
    # Transform to response model
    # In a real implementation, this would include full user and lead details
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "status": meeting.status,
        "location": meeting.location,
        "organizer": {
            "id": meeting.organizer_id,
            "name": "Organizer Name",  # Mock - would fetch from database
            "email": "organizer@example.com"  # Mock - would fetch from database
        },
        "lead": {"id": meeting.lead_id} if meeting.lead_id else None,
        "attendees": [
            {
                "name": attendee.name,
                "email": attendee.email,
                "status": attendee.status
            }
            for attendee in meeting.attendees
        ],
        "notes": meeting.notes,
        "calendar_provider": meeting.calendar_provider,
        "agenda_items": meeting.agenda_items,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at
    }

@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: str,
    update_data: MeetingUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update an existing meeting
    """
    # In a real implementation, check if user is organizer
    meeting = await meeting_service.update_meeting(meeting_id, update_data, current_user.id)
    
    # Transform to response model
    # In a real implementation, this would include full user and lead details
    return {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "status": meeting.status,
        "location": meeting.location,
        "organizer": {
            "id": meeting.organizer_id,
            "name": "Organizer Name",  # Mock - would fetch from database
            "email": "organizer@example.com"  # Mock - would fetch from database
        },
        "lead": {"id": meeting.lead_id} if meeting.lead_id else None,
        "attendees": [
            {
                "name": attendee.name,
                "email": attendee.email,
                "status": attendee.status
            }
            for attendee in meeting.attendees
        ],
        "notes": meeting.notes,
        "calendar_provider": meeting.calendar_provider,
        "agenda_items": meeting.agenda_items,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at
    }

@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
async def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Delete a meeting
    """
    # In a real implementation, check if user is organizer
    result = await meeting_service.delete_meeting(meeting_id, current_user.id)
    return result

@router.get("/upcoming", response_model=List[MeetingResponse])
async def get_upcoming_meetings(
    days: int = Query(7, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get upcoming meetings for the current user
    """
    meetings = await meeting_service.get_upcoming_meetings(current_user.id, days)
    
    # Transform to response model
    response = []
    for meeting in meetings:
        response.append({
            "id": meeting.id,
            "title": meeting.title,
            "description": meeting.description,
            "start_time": meeting.start_time,
            "end_time": meeting.end_time,
            "status": meeting.status,
            "location": meeting.location,
            "organizer": {
                "id": meeting.organizer_id,
                "name": "Organizer Name",  # Mock - would fetch from database
                "email": "organizer@example.com"  # Mock - would fetch from database
            },
            "lead": {"id": meeting.lead_id} if meeting.lead_id else None,
            "attendees": [
                {
                    "name": attendee.name,
                    "email": attendee.email,
                    "status": attendee.status
                }
                for attendee in meeting.attendees
            ],
            "notes": meeting.notes,
            "calendar_provider": meeting.calendar_provider,
            "agenda_items": meeting.agenda_items,
            "created_at": meeting.created_at,
            "updated_at": meeting.updated_at
        })
    
    return response

# Availability endpoints

@router.post("/availability", response_model=AvailabilityResponse)
async def get_availability(
    availability_request: AvailabilityRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get available time slots for a user
    """
    # Check if user is authorized to view availability
    # In a real implementation, check user permissions
    
    # Get availability
    available_slots = await meeting_service.get_availability(
        availability_request.user_id,
        availability_request.date_from,
        availability_request.date_to,
        availability_request.duration_minutes
    )
    
    return {
        "available_slots": available_slots,
        "user_id": availability_request.user_id,
        "date_from": availability_request.date_from,
        "date_to": availability_request.date_to,
        "duration_minutes": availability_request.duration_minutes
    }

@router.post("/availability/schedule", response_model=AvailabilitySchedule)
async def create_availability_schedule(
    schedule: AvailabilitySchedule,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new availability schedule
    """
    # Make sure user can only create schedules for themselves
    if schedule.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create availability schedule for another user"
        )
    
    created_schedule = await meeting_service.create_availability_schedule(schedule)
    return created_schedule 