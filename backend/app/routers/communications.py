"""
Communications router module for handling email, SMS, and call API endpoints.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.models.communication import (
    EmailMessage, 
    EmailMessageResponse,
    EmailTemplate, 
    EmailSequence, 
    SMSMessage,
    SMSMessageResponse,
    Call,
    CallResponse,
    CallTranscript
)
from app.services.communication import CommunicationService
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter(
    prefix="/api/v1/communications",
    tags=["communications"],
    responses={404: {"description": "Not found"}},
)

# Initialize communication service
communication_service = CommunicationService()

# Email endpoints

@router.post("/email", response_model=EmailMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    email: EmailMessage,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Send email to specified recipient
    """
    result = await communication_service.send_email(email)
    return {
        "message": "Email sent successfully",
        "email_id": email.id,
        "details": result
    }

@router.post("/email/template", response_model=EmailTemplate, status_code=status.HTTP_201_CREATED)
async def create_email_template(
    template: EmailTemplate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a reusable email template
    """
    created_template = await communication_service.create_email_template(template)
    return created_template

@router.post("/email/sequence", response_model=EmailSequence, status_code=status.HTTP_201_CREATED)
async def create_email_sequence(
    sequence: EmailSequence,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create an automated email sequence
    """
    created_sequence = await communication_service.create_email_sequence(sequence)
    return created_sequence

# SMS endpoints

@router.post("/sms", response_model=SMSMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_sms(
    sms: SMSMessage,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Send SMS to specified recipient
    """
    result = await communication_service.send_sms(sms)
    return {
        "message": "SMS sent successfully",
        "sms_id": sms.id,
        "details": result
    }

# Call endpoints

@router.post("/call", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def make_call(
    call: Call,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Initiate an outbound call
    """
    result = await communication_service.make_call(call)
    return {
        "message": "Call initiated successfully",
        "call_id": call.id,
        "details": result
    }

@router.get("/call/{call_sid}/transcript", response_model=CallTranscript)
async def get_call_transcript(
    call_sid: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get transcript for a completed call
    """
    transcript = await communication_service.get_call_transcript(call_sid)
    return transcript

@router.post("/call-status-callback")
async def call_status_callback(
    status: Dict[str, Any]
) -> JSONResponse:
    """
    Webhook for Twilio call status updates
    
    This endpoint is called by Twilio when a call status changes.
    It's a webhook and doesn't require authentication.
    """
    # In a real implementation, this would update the call status in the database
    # and potentially trigger other actions based on the status
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Call status updated"}
    )

# Sentiment analysis

@router.post("/analyze-sentiment")
async def analyze_sentiment(
    text: Dict[str, str],
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Analyze sentiment of text
    
    Request body should be in the format:
    {
        "text": "Text to analyze"
    }
    """
    if "text" not in text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text field is required"
        )
        
    result = await communication_service.analyze_sentiment(text["text"])
    return result 