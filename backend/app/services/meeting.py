"""
Meeting service for calendar and meeting management.

Handles:
- Calendar integration with Google and Microsoft
- Meeting scheduling and management
- Availability calculation
- Meeting reminders
"""
import json
import logging
from datetime import datetime, timedelta, time
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import HTTPException, status
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pytz

from app.core.config import settings
from app.models.meeting import (
    Meeting,
    MeetingCreate,
    MeetingUpdate,
    MeetingStatus,
    MeetingAttendee,
    MeetingAttendeeStatus,
    CalendarIntegration,
    CalendarProvider,
    AvailabilitySchedule,
    TimeSlot
)
from app.services.lead import LeadService

logger = logging.getLogger(__name__)


class MeetingService:
    """Service for calendar and meeting management"""
    
    def __init__(self):
        """Initialize meeting service"""
        self.lead_service = LeadService()
        self.google_scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
        self.timezone = pytz.timezone(settings.TIMEZONE)
    
    # Calendar integration methods
    
    async def create_google_auth_url(self, user_id: str) -> Dict[str, str]:
        """
        Create Google OAuth2 authorization URL for calendar integration
        
        Args:
            user_id: ID of the user initiating the authorization
            
        Returns:
            Dict with authorization URL and state
        """
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uri": f"{settings.API_URL}/api/v1/meetings/google-calendar-callback",
                }
            },
            scopes=self.google_scopes,
            state=user_id  # Use user_id as state to identify the user in callback
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        
        return {
            "auth_url": auth_url,
            "state": user_id
        }
    
    async def handle_google_callback(self, code: str, state: str) -> Dict[str, Any]:
        """
        Handle Google OAuth2 callback and save integration
        
        Args:
            code: Authorization code from Google
            state: State parameter (user_id)
            
        Returns:
            Dict with integration details
        """
        # The state parameter should contain the user_id
        user_id = state
        
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uri": f"{settings.API_URL}/api/v1/meetings/google-calendar-callback",
                }
            },
            scopes=self.google_scopes,
            state=user_id
        )
        
        # Exchange authorization code for tokens
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Create calendar integration record
        integration = CalendarIntegration(
            user_id=user_id,
            provider=CalendarProvider.GOOGLE,
            credentials={
                "token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": credentials.scopes
            },
            sync_enabled=True,
            last_sync=datetime.now()
        )
        
        # In a real implementation, save to database
        integration.id = "integration_123"  # This would be assigned by the database
        
        return {
            "message": "Google Calendar integration successful",
            "integration_id": integration.id,
            "provider": integration.provider,
            "user_id": integration.user_id
        }
    
    async def sync_calendar_events(self, user_id: str, provider: CalendarProvider) -> Dict[str, Any]:
        """
        Sync calendar events from external provider
        
        Args:
            user_id: User ID
            provider: Calendar provider
            
        Returns:
            Dict with sync results
        """
        # In a real implementation, retrieve integration from database
        # and perform actual sync
        
        return {
            "message": f"Calendar sync with {provider} successful",
            "events_synced": 15,  # Mock number
            "sync_time": datetime.now().isoformat(),
            "user_id": user_id
        }
    
    async def get_google_calendar_service(self, credentials_dict: Dict[str, Any]):
        """
        Create Google Calendar API service with provided credentials
        
        Args:
            credentials_dict: Dict with Google API credentials
            
        Returns:
            Google Calendar service
        """
        credentials = Credentials(
            token=credentials_dict["token"],
            refresh_token=credentials_dict["refresh_token"],
            token_uri=credentials_dict["token_uri"],
            client_id=credentials_dict["client_id"],
            client_secret=credentials_dict["client_secret"],
            scopes=credentials_dict["scopes"]
        )
        
        return build('calendar', 'v3', credentials=credentials)
    
    # Meeting management methods
    
    async def create_meeting(self, meeting_data: MeetingCreate, user_id: str) -> Meeting:
        """
        Create a new meeting
        
        Args:
            meeting_data: Meeting creation data
            user_id: ID of the user creating the meeting
            
        Returns:
            Created Meeting object
        """
        meeting = Meeting(
            title=meeting_data.title,
            description=meeting_data.description,
            start_time=meeting_data.start_time,
            end_time=meeting_data.end_time,
            location=meeting_data.location,
            organizer_id=user_id,
            lead_id=meeting_data.lead_id,
            reminder_time=meeting_data.reminder_time,
            agenda_items=meeting_data.agenda_items,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Add the organizer as an attendee
        # In a real implementation, we would fetch user details from database
        organizer = MeetingAttendee(
            name="Organizer Name",  # Mock - would fetch from user profile
            email="organizer@example.com",  # Mock - would fetch from user profile
            status=MeetingAttendeeStatus.ACCEPTED,
            is_organizer=True,
            user_id=user_id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        meeting.attendees.append(organizer)
        
        # Add lead as an attendee if lead_id is provided
        if meeting_data.lead_id:
            # In a real implementation, fetch lead details from database
            lead = await self.lead_service.get_lead_by_id(meeting_data.lead_id)
            lead_attendee = MeetingAttendee(
                name=f"{lead.first_name} {lead.last_name}",
                email=lead.email,
                status=MeetingAttendeeStatus.PENDING,
                lead_id=lead.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            meeting.attendees.append(lead_attendee)
        
        # Add other attendees
        for email in meeting_data.attendee_emails:
            attendee = MeetingAttendee(
                name="",  # Name might be unknown initially
                email=email,
                status=MeetingAttendeeStatus.PENDING,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            meeting.attendees.append(attendee)
        
        # In a real implementation, save to database
        meeting.id = "meeting_123"  # This would be assigned by the database
        
        # Create calendar event if user has calendar integration
        # In a real implementation, check if user has active calendar integration
        calendar_integrated = False  # Mock - would check database
        
        if calendar_integrated:
            # Sync with calendar provider
            # This would create an event in Google/Microsoft calendar
            await self.sync_meeting_to_calendar(meeting, user_id)
        
        # Send meeting invitations
        await self.send_meeting_invitations(meeting)
        
        return meeting
    
    async def update_meeting(self, meeting_id: str, update_data: MeetingUpdate, user_id: str) -> Meeting:
        """
        Update an existing meeting
        
        Args:
            meeting_id: Meeting ID
            update_data: Meeting update data
            user_id: ID of the user updating the meeting
            
        Returns:
            Updated Meeting object
        """
        # In a real implementation, retrieve meeting from database
        # For now, create a mock meeting
        meeting = Meeting(
            id=meeting_id,
            title="Existing Meeting",
            description="Original description",
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            location={
                "type": "virtual",
                "virtual_link": "https://meet.example.com/123"
            },
            organizer_id=user_id,
            status=MeetingStatus.SCHEDULED,
            created_at=datetime.now() - timedelta(days=1),
            updated_at=datetime.now() - timedelta(days=1)
        )
        
        # Update fields if provided
        if update_data.title is not None:
            meeting.title = update_data.title
            
        if update_data.description is not None:
            meeting.description = update_data.description
            
        if update_data.start_time is not None:
            meeting.start_time = update_data.start_time
            
        if update_data.end_time is not None:
            meeting.end_time = update_data.end_time
            
        if update_data.status is not None:
            meeting.status = update_data.status
            
        if update_data.location is not None:
            meeting.location = update_data.location
            
        if update_data.notes is not None:
            meeting.notes = update_data.notes
            
        if update_data.agenda_items is not None:
            meeting.agenda_items = update_data.agenda_items
            
        if update_data.reminder_time is not None:
            meeting.reminder_time = update_data.reminder_time
        
        # Update timestamp
        meeting.updated_at = datetime.now()
        
        # In a real implementation, save to database
        
        # Update calendar event if applicable
        # Check if meeting is linked to calendar
        if meeting.calendar_event_id and meeting.calendar_provider:
            await self.sync_meeting_to_calendar(meeting, user_id, update=True)
        
        # If status changed to cancelled, notify attendees
        if update_data.status == MeetingStatus.CANCELLED:
            await self.send_meeting_cancellation(meeting)
        # If time changed, notify attendees
        elif update_data.start_time or update_data.end_time:
            await self.send_meeting_update(meeting)
        
        return meeting
    
    async def delete_meeting(self, meeting_id: str, user_id: str) -> Dict[str, Any]:
        """
        Delete a meeting
        
        Args:
            meeting_id: Meeting ID
            user_id: ID of the user deleting the meeting
            
        Returns:
            Dict with status message
        """
        # In a real implementation, verify user is organizer and delete from database
        
        # Send cancellation notifications
        # Mock object for demonstration
        meeting = Meeting(
            id=meeting_id,
            title="Meeting to Cancel",
            organizer_id=user_id,
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            location={"type": "virtual"}
        )
        
        await self.send_meeting_cancellation(meeting)
        
        # Delete from calendar if linked
        if getattr(meeting, "calendar_event_id", None) and getattr(meeting, "calendar_provider", None):
            await self.delete_calendar_event(meeting, user_id)
        
        return {
            "message": f"Meeting {meeting_id} deleted successfully",
            "meeting_id": meeting_id
        }
    
    async def get_meeting_by_id(self, meeting_id: str) -> Meeting:
        """
        Get meeting by ID
        
        Args:
            meeting_id: Meeting ID
            
        Returns:
            Meeting object
        
        Raises:
            HTTPException: If meeting not found
        """
        # In a real implementation, retrieve from database
        # For now, return a mock meeting
        
        if meeting_id != "meeting_123":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting with ID {meeting_id} not found"
            )
        
        meeting = Meeting(
            id=meeting_id,
            title="Sample Meeting",
            description="This is a sample meeting",
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            status=MeetingStatus.SCHEDULED,
            location={
                "type": "virtual",
                "virtual_link": "https://meet.example.com/123"
            },
            organizer_id="user_123",
            attendees=[
                MeetingAttendee(
                    id="attendee_1",
                    name="John Organizer",
                    email="john@example.com",
                    status=MeetingAttendeeStatus.ACCEPTED,
                    is_organizer=True,
                    user_id="user_123"
                ),
                MeetingAttendee(
                    id="attendee_2",
                    name="Jane Lead",
                    email="jane@example.com",
                    status=MeetingAttendeeStatus.ACCEPTED,
                    lead_id="lead_123"
                )
            ],
            notes="Prepare discussion points",
            agenda_items=["Introduction", "Project Discussion", "Next Steps"],
            created_at=datetime.now() - timedelta(days=1),
            updated_at=datetime.now() - timedelta(days=1)
        )
        
        return meeting
    
    async def get_upcoming_meetings(self, user_id: str, days: int = 7) -> List[Meeting]:
        """
        Get upcoming meetings for a user
        
        Args:
            user_id: User ID
            days: Number of days to look ahead (default 7)
            
        Returns:
            List of upcoming meetings
        """
        # In a real implementation, query database for upcoming meetings
        # For now, return mock data
        
        today = datetime.now()
        upcoming_meetings = []
        
        # Create some mock meetings
        for i in range(1, 4):
            meeting = Meeting(
                id=f"meeting_{i}",
                title=f"Upcoming Meeting {i}",
                description=f"This is upcoming meeting {i}",
                start_time=today + timedelta(days=i, hours=10),
                end_time=today + timedelta(days=i, hours=11),
                status=MeetingStatus.SCHEDULED,
                location={
                    "type": "virtual",
                    "virtual_link": f"https://meet.example.com/{i}"
                },
                organizer_id=user_id,
                attendees=[
                    MeetingAttendee(
                        id=f"attendee_org_{i}",
                        name="Organizer Name",
                        email="organizer@example.com",
                        status=MeetingAttendeeStatus.ACCEPTED,
                        is_organizer=True,
                        user_id=user_id
                    ),
                    MeetingAttendee(
                        id=f"attendee_lead_{i}",
                        name=f"Lead {i}",
                        email=f"lead{i}@example.com",
                        status=MeetingAttendeeStatus.ACCEPTED,
                        lead_id=f"lead_{i}"
                    )
                ],
                agenda_items=[f"Topic {j}" for j in range(1, 4)],
                created_at=today - timedelta(days=1),
                updated_at=today - timedelta(days=1)
            )
            upcoming_meetings.append(meeting)
        
        return upcoming_meetings
    
    # Availability methods
    
    async def get_availability(self, user_id: str, start_date: datetime, end_date: datetime, duration_minutes: int = 30) -> List[TimeSlot]:
        """
        Get available time slots for a user within a date range
        
        Args:
            user_id: User ID
            start_date: Start date for availability search
            end_date: End date for availability search
            duration_minutes: Desired meeting duration in minutes
            
        Returns:
            List of available time slots
        """
        # In a real implementation:
        # 1. Retrieve user's availability schedule from database
        # 2. Retrieve existing meetings from database
        # 3. If calendar integration exists, fetch events from external calendar
        # 4. Calculate available slots based on working hours minus existing events
        
        # For now, return mock data
        available_slots = []
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        while current_date <= end_date:
            # Skip weekends in this mock example
            if current_date.weekday() < 5:  # Monday-Friday
                # Add two mock slots per day
                morning_slot = TimeSlot(
                    start_time=current_date.replace(hour=10, minute=0),
                    end_time=current_date.replace(hour=10, minute=30)
                )
                afternoon_slot = TimeSlot(
                    start_time=current_date.replace(hour=14, minute=0),
                    end_time=current_date.replace(hour=14, minute=30)
                )
                available_slots.extend([morning_slot, afternoon_slot])
            
            current_date += timedelta(days=1)
        
        return available_slots
    
    async def create_availability_schedule(self, schedule: AvailabilitySchedule) -> AvailabilitySchedule:
        """
        Create a new availability schedule for a user
        
        Args:
            schedule: Availability schedule data
            
        Returns:
            Created availability schedule
        """
        # In a real implementation, save to database
        schedule.id = "schedule_123"  # This would be assigned by the database
        schedule.created_at = datetime.now()
        schedule.updated_at = datetime.now()
        
        return schedule
    
    # Helper methods
    
    async def sync_meeting_to_calendar(self, meeting: Meeting, user_id: str, update: bool = False) -> Dict[str, Any]:
        """
        Sync meeting to external calendar
        
        Args:
            meeting: Meeting to sync
            user_id: User ID
            update: Whether this is an update to existing event
            
        Returns:
            Dict with sync results
        """
        # In a real implementation:
        # 1. Get user's calendar integration from database
        # 2. Create/update event in external calendar
        # 3. Save calendar_event_id to meeting
        
        # Mock implementation
        return {
            "message": f"Meeting {'updated in' if update else 'synced to'} calendar successfully",
            "meeting_id": meeting.id,
            "calendar_event_id": "calendar_event_123"
        }
    
    async def delete_calendar_event(self, meeting: Meeting, user_id: str) -> Dict[str, Any]:
        """
        Delete event from external calendar
        
        Args:
            meeting: Meeting to delete
            user_id: User ID
            
        Returns:
            Dict with deletion results
        """
        # In a real implementation:
        # 1. Get user's calendar integration from database
        # 2. Delete event from external calendar
        
        # Mock implementation
        return {
            "message": "Meeting deleted from calendar successfully",
            "meeting_id": meeting.id,
            "calendar_event_id": meeting.calendar_event_id
        }
    
    async def send_meeting_invitations(self, meeting: Meeting) -> Dict[str, Any]:
        """
        Send meeting invitations to attendees
        
        Args:
            meeting: Meeting details
            
        Returns:
            Dict with sending results
        """
        # In a real implementation:
        # 1. Generate calendar invitation (ICS file)
        # 2. Send email with invitation to each attendee
        
        # Mock implementation
        return {
            "message": "Meeting invitations sent successfully",
            "meeting_id": meeting.id,
            "sent_to": [attendee.email for attendee in meeting.attendees]
        }
    
    async def send_meeting_update(self, meeting: Meeting) -> Dict[str, Any]:
        """
        Send meeting updates to attendees
        
        Args:
            meeting: Updated meeting details
            
        Returns:
            Dict with sending results
        """
        # In a real implementation:
        # 1. Generate updated calendar invitation
        # 2. Send email with updated invitation to each attendee
        
        # Mock implementation
        return {
            "message": "Meeting updates sent successfully",
            "meeting_id": meeting.id,
            "sent_to": [attendee.email for attendee in meeting.attendees]
        }
    
    async def send_meeting_cancellation(self, meeting: Meeting) -> Dict[str, Any]:
        """
        Send meeting cancellation to attendees
        
        Args:
            meeting: Meeting details
            
        Returns:
            Dict with sending results
        """
        # In a real implementation:
        # 1. Generate calendar cancellation
        # 2. Send email with cancellation to each attendee
        
        # Mock implementation
        return {
            "message": "Meeting cancellation sent successfully",
            "meeting_id": meeting.id,
            "sent_to": [attendee.email for attendee in meeting.attendees]
        }
    
    async def send_meeting_reminders(self) -> Dict[str, Any]:
        """
        Send reminders for upcoming meetings
        
        This would typically be called by a scheduled task
        
        Returns:
            Dict with reminder results
        """
        # In a real implementation:
        # 1. Find meetings that are coming up and need reminders
        # 2. Send reminder emails to attendees
        # 3. Mark reminders as sent
        
        # Mock implementation
        return {
            "message": "Meeting reminders sent successfully",
            "meetings_processed": 5,
            "reminders_sent": 12
        } 