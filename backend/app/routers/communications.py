"""
Communications router module for handling email, SMS, and call API endpoints.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
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
    CallTranscript,
    Contact,
    ContactCreate,
    ContactUpdate,
    CallLog,
    CallLogCreate,
    CallLogUpdate,
    DialpadRequest,
    DialpadResponse
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
    status_callback: Dict[str, Any] = Body(...)
) -> JSONResponse:
    """
    Webhook for Twilio call status updates
    
    This endpoint is called by Twilio when a call status changes.
    It's a webhook and doesn't require authentication.
    
    Twilio sends the following parameters:
    - CallSid: The unique identifier for the call
    - CallStatus: The new status of the call (queued, ringing, in-progress, completed, busy, failed, no-answer, canceled)
    - CallDuration: The duration of the call in seconds (only for completed calls)
    - RecordingUrl: URL to the call recording (if recording was enabled)
    """
    try:
        # Extract key information from the callback
        call_sid = status_callback.get('CallSid')
        call_status = status_callback.get('CallStatus')
        call_duration = status_callback.get('CallDuration')
        recording_url = status_callback.get('RecordingUrl')
        
        if not call_sid or not call_status:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"message": "Missing required parameters"}
            )
        
        # Map Twilio call status to our internal status
        status_mapping = {
            'queued': 'queued',
            'ringing': 'ringing',
            'in-progress': 'in-progress',
            'completed': 'completed',
            'busy': 'busy',
            'failed': 'failed',
            'no-answer': 'no-answer',
            'canceled': 'canceled'
        }
        
        internal_status = status_mapping.get(call_status, 'unknown')
        
        # Update the call log in the database
        await communication_service.update_call_status(
            call_sid=call_sid,
            status=internal_status,
            duration=int(call_duration) if call_duration else None,
            recording_url=recording_url
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": f"Call status updated to {internal_status}"}
        )
    except Exception as e:
        logger.error(f"Error processing call status callback: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": f"Error processing callback: {str(e)}"}
        )

# Contact (Address Book) endpoints

@router.post("/contacts", response_model=Contact, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: ContactCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new contact in the address book
    """
    created_contact = await communication_service.create_contact(contact)
    return created_contact

@router.get("/contacts", response_model=List[Contact])
async def list_contacts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    List contacts with pagination
    """
    contacts = await communication_service.list_contacts(skip=skip, limit=limit)
    return contacts

@router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(
    contact_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get a contact by ID
    """
    contact = await communication_service.get_contact(contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found"
        )
    return contact

@router.put("/contacts/{contact_id}", response_model=Contact)
async def update_contact(
    contact_update: ContactUpdate,
    contact_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update an existing contact
    """
    updated_contact = await communication_service.update_contact(contact_id, contact_update)
    return updated_contact

@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Delete a contact
    """
    success = await communication_service.delete_contact(contact_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact with ID {contact_id} not found"
        )
    return None

# Call Log endpoints

@router.post("/call-logs", response_model=CallLog, status_code=status.HTTP_201_CREATED)
async def create_call_log(
    call_log: CallLogCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new call log entry
    """
    created_call_log = await communication_service.create_call_log(call_log)
    return created_call_log

@router.get("/call-logs", response_model=List[CallLog])
async def list_call_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    List call logs with pagination
    """
    call_logs = await communication_service.list_call_logs(skip=skip, limit=limit)
    return call_logs

@router.get("/call-logs/{call_log_id}", response_model=CallLog)
async def get_call_log(
    call_log_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get a call log by ID
    """
    call_log = await communication_service.get_call_log(call_log_id)
    if not call_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call log with ID {call_log_id} not found"
        )
    return call_log

@router.put("/call-logs/{call_log_id}", response_model=CallLog)
async def update_call_log(
    call_log_update: CallLogUpdate,
    call_log_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Update an existing call log
    """
    updated_call_log = await communication_service.update_call_log(call_log_id, call_log_update)
    return updated_call_log

# Dialpad endpoints

@router.post("/dialpad", response_model=DialpadResponse)
async def handle_dialpad_request(
    request: DialpadRequest,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Handle a dialpad request (dial, answer, hangup, etc.)
    """
    response = await communication_service.handle_dialpad_request(request)
    return response

@router.post("/recording-status-callback")
async def recording_status_callback(
    status: Dict[str, Any]
) -> JSONResponse:
    """
    Webhook for Twilio recording status updates
    
    This endpoint is called by Twilio when a recording status changes.
    It's a webhook and doesn't require authentication.
    """
    # In a real implementation, this would update the recording status in the database
    # and potentially trigger transcription
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Recording status updated"}
    )

@router.get("/call-token/{identity}")
async def get_call_token(
    identity: str,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Generate a Twilio Voice token for client-side calling
    """
    token = await communication_service.generate_call_token(identity)
    return token

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