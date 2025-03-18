from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.ai_meeting_scheduler import AIMeetingSchedulerService
from app.services.meeting_follow_up import MeetingFollowUpService
from app.core.security import get_current_active_user
from app.models.user import User

# Define request and response models
class AvailabilityRequest(BaseModel):
    lead_id: Optional[int] = None
    meeting_type: str = "INITIAL_CALL"
    days_ahead: int = 7

class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    score: Optional[float] = None

class AvailabilityResponse(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    available_slots: List[TimeSlot]
    timezone: str = "UTC"

class MeetingAgendaRequest(BaseModel):
    lead_id: int
    meeting_type: str

class MeetingAgendaResponse(BaseModel):
    lead_id: int
    meeting_type: str
    agenda_items: List[str]

router = APIRouter(
    prefix="/api/v1/ai/meetings",
    tags=["ai", "meetings"],
    responses={404: {"description": "Not found"}},
)

# Initialize services
ai_meeting_scheduler = AIMeetingSchedulerService()
meeting_follow_up = MeetingFollowUpService()

@router.post("/suggest-times", response_model=AvailabilityResponse)
async def suggest_optimal_meeting_times(
    request: AvailabilityRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Suggest optimal meeting times based on AI analysis
    """
    try:
        availability = await ai_meeting_scheduler.suggest_optimal_meeting_times(
            user_id=current_user.id,
            lead_id=request.lead_id,
            meeting_type=request.meeting_type,
            time_window_days=request.days_ahead
        )
        return availability
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error suggesting meeting times: {str(e)}"
        )

@router.get("/recommend-duration")
async def recommend_meeting_duration(
    meeting_type: str,
    lead_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Recommend optimal meeting duration based on AI analysis
    """
    try:
        duration = await ai_meeting_scheduler.recommend_meeting_duration(
            meeting_type=meeting_type,
            lead_id=lead_id
        )
        return {
            "recommended_duration_minutes": duration,
            "meeting_type": meeting_type,
            "lead_id": lead_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recommending meeting duration: {str(e)}"
        )

@router.post("/generate-agenda", response_model=MeetingAgendaResponse)
async def generate_meeting_agenda(
    request: MeetingAgendaRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Generate an AI-powered meeting agenda
    """
    try:
        agenda_items = await ai_meeting_scheduler.generate_meeting_agenda(
            meeting_type=request.meeting_type,
            lead_id=request.lead_id,
            user_id=current_user.id
        )
        return {
            "meeting_type": request.meeting_type,
            "lead_id": request.lead_id,
            "agenda_items": agenda_items
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating meeting agenda: {str(e)}"
        )

@router.get("/summary/{meeting_id}", response_model=Dict[str, Any])
async def get_meeting_summary(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get AI-generated summary of a meeting
    """
    try:
        meeting_follow_up_service = MeetingFollowUpService()
        summary = await meeting_follow_up_service.generate_meeting_summary(meeting_id)
        return summary
    except Exception as e:
        logger.error(f"Error generating meeting summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating meeting summary: {str(e)}"
        )

@router.get("/comprehensive-summary/{meeting_id}", response_model=Dict[str, Any])
async def get_comprehensive_meeting_summary(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get comprehensive AI-generated summary of a meeting including all lead interactions
    """
    try:
        meeting_follow_up_service = MeetingFollowUpService()
        summary = await meeting_follow_up_service.generate_comprehensive_meeting_summary(meeting_id)
        return summary
    except Exception as e:
        logger.error(f"Error generating comprehensive meeting summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating comprehensive meeting summary: {str(e)}"
        )

@router.get("/comprehensive-summary", response_model=Dict[str, Any])
async def get_comprehensive_meeting_summary_by_query(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get comprehensive AI-generated summary of a meeting including all lead interactions (query parameter version)
    """
    try:
        meeting_follow_up_service = MeetingFollowUpService()
        summary = await meeting_follow_up_service.generate_comprehensive_meeting_summary(meeting_id)
        return summary
    except Exception as e:
        logger.error(f"Error generating comprehensive meeting summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating comprehensive meeting summary: {str(e)}"
        )

@router.get("/generate-follow-up/{meeting_id}")
async def generate_follow_up(
    meeting_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, str]:
    """
    Generate AI-powered follow-up message for a meeting
    """
    try:
        follow_up = await meeting_follow_up.generate_follow_up_message(meeting_id)
        return follow_up
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating follow-up message: {str(e)}"
        )

@router.post("/schedule-follow-up/{meeting_id}")
async def schedule_follow_up_task(
    meeting_id: int,
    days_delay: int = Query(3, description="Number of days to delay the follow-up"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Schedule an AI-generated follow-up task after a meeting
    """
    try:
        task = await meeting_follow_up.schedule_follow_up_task(
            meeting_id=meeting_id,
            user_id=current_user.id,
            days_delay=days_delay
        )
        return task
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error scheduling follow-up task: {str(e)}"
        ) 