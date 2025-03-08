"""
Communication service module for handling email, SMS, and call functionality.
Integrates with SendGrid for email and Twilio for SMS and calls.
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import os

from fastapi import HTTPException, status
from pydantic import EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from twilio.twiml.voice_response import VoiceResponse, Dial

from app.core.config import settings
from app.models.communication import (
    EmailMessage, 
    EmailTemplate, 
    EmailSequence, 
    EmailSequenceStep,
    SMSMessage, 
    Call, 
    CallTranscript,
    Contact,
    ContactCreate,
    ContactUpdate,
    CallLog,
    CallLogCreate,
    CallLogUpdate,
    DialpadRequest,
    DialpadResponse,
    CallLogStatus,
    CallDirection
)

logger = logging.getLogger(__name__)

class CommunicationService:
    """Service for handling all communication methods (email, SMS, calls)"""
    
    def __init__(self):
        """Initialize communication service with required API clients"""
        # Initialize SendGrid client for email functionality
        self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None
        
        # Initialize Twilio client for SMS and call functionality
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID, 
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.twilio_client = None

    # Email functionality
    
    async def send_email(self, email: EmailMessage) -> Dict[str, Any]:
        """
        Send an email using SendGrid API
        
        Args:
            email: EmailMessage object containing email details
            
        Returns:
            Dict with status and response details
        
        Raises:
            HTTPException: If sending email fails
        """
        if not self.sendgrid_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Email service not configured"
            )
        
        message = Mail(
            from_email=email.sent_from,
            to_emails=email.sent_to,
            subject=email.subject,
            html_content=email.body
        )
        
        # Add attachments if any
        if email.attachments:
            for attachment_data in email.attachments:
                attachment = Attachment()
                attachment.file_content = FileContent(attachment_data.content)
                attachment.file_name = FileName(attachment_data.filename)
                attachment.file_type = FileType(attachment_data.content_type)
                attachment.disposition = Disposition('attachment')
                message.add_attachment(attachment)
        
        try:
            response = self.sendgrid_client.send(message)
            return {
                "status": "success",
                "status_code": response.status_code,
                "body": response.body.decode() if response.body else None,
                "headers": dict(response.headers) if response.headers else None
            }
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {str(e)}"
            )
    
    async def create_email_template(self, template: EmailTemplate) -> EmailTemplate:
        """
        Create an email template that can be reused
        
        Args:
            template: EmailTemplate object with template details
            
        Returns:
            Created EmailTemplate with ID
        """
        # In a real implementation, this would save to database
        # For now, we'll just return the template with a mock ID
        template.id = "template_123"  # This would be assigned by the database
        template.created_at = datetime.now()
        template.updated_at = datetime.now()
        return template
    
    async def create_email_sequence(self, sequence: EmailSequence) -> EmailSequence:
        """
        Create an email sequence for automated follow-ups
        
        Args:
            sequence: EmailSequence object with sequence details
            
        Returns:
            Created EmailSequence with ID
        """
        # In a real implementation, this would save to database
        sequence.id = "sequence_123"  # This would be assigned by the database
        sequence.created_at = datetime.now()
        sequence.updated_at = datetime.now()
        return sequence
    
    # SMS functionality
    
    async def send_sms(self, sms: SMSMessage) -> Dict[str, Any]:
        """
        Send an SMS using Twilio API
        
        Args:
            sms: SMSMessage object containing SMS details
            
        Returns:
            Dict with status and message details
        
        Raises:
            HTTPException: If sending SMS fails
        """
        if not self.twilio_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SMS service not configured"
            )
        
        try:
            message = self.twilio_client.messages.create(
                body=sms.body,
                from_=sms.sent_from,
                to=sms.sent_to,
            )
            
            return {
                "status": "success",
                "message_sid": message.sid,
                "date_created": message.date_created,
                "date_sent": message.date_sent,
                "status": message.status
            }
        
        except TwilioRestException as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send SMS: {str(e)}"
            )
    
    # Call functionality
    
    async def make_call(self, call: Call) -> Dict[str, Any]:
        """
        Initiate an outbound call using Twilio API
        
        Args:
            call: Call object containing call details
            
        Returns:
            Dict with status and call details
        
        Raises:
            HTTPException: If initiating call fails
        """
        if not self.twilio_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Call service not configured"
            )
            
        try:
            # The TwiML (Twilio Markup Language) defines what happens on the call
            twiml = f"""
            <Response>
                <Say>This is an automated call from your CRM system. Please wait for a representative.</Say>
                <Dial callerId="{call.caller}">{call.recipient}</Dial>
            </Response>
            """
            
            # Initiate the call
            twilio_call = self.twilio_client.calls.create(
                twiml=twiml,
                to=call.recipient,
                from_=call.caller,
                record=True,  # Enable recording
                status_callback=f"{settings.API_URL}/api/v1/communications/call-status-callback"
            )
            
            return {
                "status": "success",
                "call_sid": twilio_call.sid,
                "date_created": twilio_call.date_created,
                "status": twilio_call.status
            }
            
        except TwilioRestException as e:
            logger.error(f"Failed to initiate call: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initiate call: {str(e)}"
            )
    
    async def get_call_transcript(self, call_sid: str) -> CallTranscript:
        """
        Retrieve transcription for a call recording
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            CallTranscript object
            
        Raises:
            HTTPException: If retrieving transcript fails
        """
        if not self.twilio_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Call service not configured"
            )
            
        try:
            # Get recording for the call
            recordings = self.twilio_client.recordings.list(call_sid=call_sid)
            
            if not recordings:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No recording found for call {call_sid}"
                )
            
            # Get the latest recording
            recording = recordings[0]
            
            # Get transcriptions for the recording
            transcriptions = self.twilio_client.transcriptions.list(
                recording_sid=recording.sid
            )
            
            if not transcriptions:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No transcription found for recording {recording.sid}"
                )
            
            # Get the latest transcription
            transcription = transcriptions[0]
            
            # Construct the transcript object
            transcript = CallTranscript(
                call_sid=call_sid,
                recording_sid=recording.sid,
                transcription_sid=transcription.sid,
                recording_url=recording.uri,
                transcription_text=transcription.transcription_text,
                duration=recording.duration,
                created_at=recording.date_created
            )
            
            return transcript
            
        except TwilioRestException as e:
            logger.error(f"Failed to get call transcript: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get call transcript: {str(e)}"
            )
    
    # Sentiment analysis for communications
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using AI service
        
        Args:
            text: Text to analyze
            
        Returns:
            Dict with sentiment analysis results
        """
        # In a real implementation, this would call the AI service
        # For now, return a mock result
        return {
            "sentiment": "positive",
            "score": 0.85,
            "confidence": 0.92
        }

    # Contact (Address Book) methods
    
    async def create_contact(self, contact: ContactCreate) -> Contact:
        """
        Create a new contact in the address book
        
        Args:
            contact: ContactCreate object with contact details
            
        Returns:
            Created Contact with ID
        """
        # In a real implementation, this would save to database
        # For now, we'll just return the contact with a mock ID
        contact_dict = contact.dict()
        contact_dict["id"] = 123  # This would be assigned by the database
        contact_dict["created_at"] = datetime.now()
        contact_dict["updated_at"] = datetime.now()
        return Contact(**contact_dict)
    
    async def get_contact(self, contact_id: int) -> Optional[Contact]:
        """
        Get a contact by ID
        
        Args:
            contact_id: ID of the contact to retrieve
            
        Returns:
            Contact if found, None otherwise
        """
        # In a real implementation, this would query the database
        # For now, we'll just return a mock contact
        return Contact(
            id=contact_id,
            name="John Doe",
            phone_number="+1234567890",
            email="john.doe@example.com",
            company="Acme Inc",
            job_title="CEO",
            user_id=1,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    async def update_contact(self, contact_id: int, contact_update: ContactUpdate) -> Contact:
        """
        Update an existing contact
        
        Args:
            contact_id: ID of the contact to update
            contact_update: ContactUpdate object with fields to update
            
        Returns:
            Updated Contact
        """
        # In a real implementation, this would update the database
        # For now, we'll just return a mock updated contact
        contact = await self.get_contact(contact_id)
        update_data = contact_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contact, field, value)
        contact.updated_at = datetime.now()
        return contact
    
    async def delete_contact(self, contact_id: int) -> bool:
        """
        Delete a contact
        
        Args:
            contact_id: ID of the contact to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        # In a real implementation, this would delete from the database
        # For now, we'll just return True
        return True
    
    async def list_contacts(self, skip: int = 0, limit: int = 100) -> List[Contact]:
        """
        List contacts with pagination
        
        Args:
            skip: Number of contacts to skip
            limit: Maximum number of contacts to return
            
        Returns:
            List of contacts
        """
        # In a real implementation, this would query the database
        # For now, we'll just return a list of mock contacts
        return [
            Contact(
                id=1,
                name="John Doe",
                phone_number="+1234567890",
                email="john.doe@example.com",
                company="Acme Inc",
                job_title="CEO",
                user_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            Contact(
                id=2,
                name="Jane Smith",
                phone_number="+0987654321",
                email="jane.smith@example.com",
                company="XYZ Corp",
                job_title="CTO",
                user_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
    
    # Call Log methods
    
    async def create_call_log(self, call_log: CallLogCreate) -> CallLog:
        """
        Create a new call log entry
        
        Args:
            call_log: CallLogCreate object with call log details
            
        Returns:
            Created CallLog with ID
        """
        # In a real implementation, this would save to database
        # For now, we'll just return the call log with a mock ID
        call_log_dict = call_log.dict()
        call_log_dict["id"] = 123  # This would be assigned by the database
        call_log_dict["call_time"] = datetime.now()
        call_log_dict["created_at"] = datetime.now()
        call_log_dict["updated_at"] = datetime.now()
        return CallLog(**call_log_dict)
    
    async def get_call_log(self, call_log_id: int) -> Optional[CallLog]:
        """
        Get a call log by ID
        
        Args:
            call_log_id: ID of the call log to retrieve
            
        Returns:
            CallLog if found, None otherwise
        """
        # In a real implementation, this would query the database
        # For now, we'll just return a mock call log
        return CallLog(
            id=call_log_id,
            contact_id=1,
            lead_id=1,
            direction=CallDirection.OUTBOUND,
            duration=120,
            caller_number="+1234567890",
            recipient_number="+0987654321",
            status=CallLogStatus.COMPLETED,
            call_time=datetime.now(),
            user_id=1,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    async def update_call_log(self, call_log_id: int, call_log_update: CallLogUpdate) -> CallLog:
        """
        Update an existing call log
        
        Args:
            call_log_id: ID of the call log to update
            call_log_update: CallLogUpdate object with fields to update
            
        Returns:
            Updated CallLog
        """
        # In a real implementation, this would update the database
        # For now, we'll just return a mock updated call log
        call_log = await self.get_call_log(call_log_id)
        update_data = call_log_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(call_log, field, value)
        call_log.updated_at = datetime.now()
        return call_log
    
    async def list_call_logs(self, skip: int = 0, limit: int = 100) -> List[CallLog]:
        """
        List call logs with pagination
        
        Args:
            skip: Number of call logs to skip
            limit: Maximum number of call logs to return
            
        Returns:
            List of call logs
        """
        # In a real implementation, this would query the database
        # For now, we'll just return a list of mock call logs
        return [
            CallLog(
                id=1,
                contact_id=1,
                lead_id=1,
                direction=CallDirection.OUTBOUND,
                duration=120,
                caller_number="+1234567890",
                recipient_number="+0987654321",
                status=CallLogStatus.COMPLETED,
                call_time=datetime.now(),
                user_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            CallLog(
                id=2,
                contact_id=2,
                lead_id=2,
                direction=CallDirection.INBOUND,
                duration=60,
                caller_number="+0987654321",
                recipient_number="+1234567890",
                status=CallLogStatus.COMPLETED,
                call_time=datetime.now(),
                user_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ),
            CallLog(
                id=3,
                contact_id=3,
                lead_id=3,
                direction=CallDirection.INBOUND,
                duration=0,
                caller_number="+1122334455",
                recipient_number="+1234567890",
                status=CallLogStatus.MISSED,
                call_time=datetime.now(),
                user_id=1,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        ]
    
    # Dialpad methods
    
    async def handle_dialpad_request(self, request: DialpadRequest) -> DialpadResponse:
        """
        Handle a dialpad request (dial, answer, hangup, etc.)
        
        Args:
            request: DialpadRequest object with action details
            
        Returns:
            DialpadResponse with result
            
        Raises:
            HTTPException: If the request fails
        """
        if not self.twilio_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Call service not configured"
            )
        
        try:
            if request.action == "dial":
                return await self._handle_dial(request)
            elif request.action == "hangup":
                return await self._handle_hangup(request)
            elif request.action == "hold":
                return await self._handle_hold(request)
            elif request.action == "resume":
                return await self._handle_resume(request)
            elif request.action == "transfer":
                return await self._handle_transfer(request)
            elif request.action == "mute":
                return await self._handle_mute(request)
            elif request.action == "unmute":
                return await self._handle_unmute(request)
            elif request.action == "dtmf":
                return await self._handle_dtmf(request)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported action: {request.action}"
                )
        except TwilioRestException as e:
            logger.error(f"Twilio error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Twilio error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error handling dialpad request: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error handling dialpad request: {str(e)}"
            )
    
    async def _handle_dial(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a dial request"""
        if not request.to or not request.from_:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Both 'to' and 'from' are required for dial action"
            )
        
        # Create a TwiML response for the call
        response = VoiceResponse()
        dial = Dial(
            caller_id=request.from_,
            record=request.record,
            recording_status_callback=f"{settings.API_URL}/api/v1/communications/recording-status-callback"
        )
        dial.number(request.to)
        
        # Make the call
        call = self.twilio_client.calls.create(
            to=request.to,
            from_=request.from_,
            twiml=str(response),
            record=request.record,
            status_callback=f"{settings.API_URL}/api/v1/communications/call-status-callback"
        )
        
        return DialpadResponse(
            success=True,
            message="Call initiated successfully",
            call_sid=call.sid,
            details={
                "date_created": call.date_created,
                "status": call.status
            }
        )
    
    async def _handle_hangup(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a hangup request"""
        if not request.call_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid is required for hangup action"
            )
        
        # Update the call to completed status
        call = self.twilio_client.calls(request.call_sid).update(status="completed")
        
        return DialpadResponse(
            success=True,
            message="Call ended successfully",
            call_sid=call.sid,
            details={
                "status": call.status
            }
        )
    
    async def _handle_hold(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a hold request"""
        if not request.call_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid is required for hold action"
            )
        
        # Create a TwiML to put the call on hold
        response = VoiceResponse()
        response.play(url="https://api.twilio.com/cowbell.mp3", loop=0)
        
        # Update the call with the hold music
        call = self.twilio_client.calls(request.call_sid).update(
            twiml=str(response)
        )
        
        return DialpadResponse(
            success=True,
            message="Call placed on hold",
            call_sid=call.sid,
            details={
                "status": call.status
            }
        )
    
    async def _handle_resume(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a resume request"""
        if not request.call_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid is required for resume action"
            )
        
        # Create a TwiML to resume the call
        response = VoiceResponse()
        response.say("You have been taken off hold.")
        
        # Update the call to resume
        call = self.twilio_client.calls(request.call_sid).update(
            twiml=str(response)
        )
        
        return DialpadResponse(
            success=True,
            message="Call resumed",
            call_sid=call.sid,
            details={
                "status": call.status
            }
        )
    
    async def _handle_transfer(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a transfer request"""
        if not request.call_sid or not request.transfer_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid and transfer_to are required for transfer action"
            )
        
        # Create a TwiML to transfer the call
        response = VoiceResponse()
        response.say("Transferring your call.")
        dial = response.dial()
        dial.number(request.transfer_to)
        
        # Update the call with the transfer TwiML
        call = self.twilio_client.calls(request.call_sid).update(
            twiml=str(response)
        )
        
        return DialpadResponse(
            success=True,
            message="Call transferred",
            call_sid=call.sid,
            details={
                "status": call.status,
                "transferred_to": request.transfer_to
            }
        )
    
    async def _handle_mute(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a mute request"""
        if not request.call_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid is required for mute action"
            )
        
        # Update the call to mute
        call = self.twilio_client.calls(request.call_sid).update(
            muted=True
        )
        
        return DialpadResponse(
            success=True,
            message="Call muted",
            call_sid=call.sid,
            details={
                "status": call.status,
                "muted": True
            }
        )
    
    async def _handle_unmute(self, request: DialpadRequest) -> DialpadResponse:
        """Handle an unmute request"""
        if not request.call_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid is required for unmute action"
            )
        
        # Update the call to unmute
        call = self.twilio_client.calls(request.call_sid).update(
            muted=False
        )
        
        return DialpadResponse(
            success=True,
            message="Call unmuted",
            call_sid=call.sid,
            details={
                "status": call.status,
                "muted": False
            }
        )
    
    async def _handle_dtmf(self, request: DialpadRequest) -> DialpadResponse:
        """Handle a DTMF (keypad tone) request"""
        if not request.call_sid or not request.digits:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="call_sid and digits are required for DTMF action"
            )
        
        # Send DTMF tones
        call = self.twilio_client.calls(request.call_sid).update(
            twiml=f'<Response><Play digits="{request.digits}"/></Response>'
        )
        
        return DialpadResponse(
            success=True,
            message="DTMF tones sent",
            call_sid=call.sid,
            details={
                "status": call.status,
                "digits": request.digits
            }
        )
    
    async def generate_call_token(self, identity: str) -> Dict[str, Any]:
        """
        Generate a Twilio Voice token for client-side calling
        
        Args:
            identity: User identity for the token
            
        Returns:
            Dict with token and expiration
            
        Raises:
            HTTPException: If token generation fails
        """
        if not self.twilio_client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Call service not configured"
            )
        
        try:
            from twilio.jwt.access_token import AccessToken
            from twilio.jwt.access_token.grants import VoiceGrant
            
            # Create access token with TTL
            token = AccessToken(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_API_KEY_SID,
                settings.TWILIO_API_KEY_SECRET,
                identity=identity,
                ttl=3600  # 1 hour
            )
            
            # Create a Voice grant and add to token
            voice_grant = VoiceGrant(
                outgoing_application_sid=settings.TWILIO_TWIML_APP_SID,
                incoming_allow=True
            )
            token.add_grant(voice_grant)
            
            # Generate the token
            jwt = token.to_jwt()
            
            return {
                "token": jwt.decode(),
                "identity": identity,
                "expires": datetime.now().timestamp() + 3600
            }
        except Exception as e:
            logger.error(f"Failed to generate call token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate call token: {str(e)}"
            )

    async def update_call_status(
        self, 
        call_sid: str, 
        status: str, 
        duration: Optional[int] = None, 
        recording_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update the status of a call in the database
        
        Args:
            call_sid: The Twilio Call SID
            status: The new status of the call
            duration: The duration of the call in seconds (only for completed calls)
            recording_url: URL to the call recording (if recording was enabled)
            
        Returns:
            Dict with updated call details
            
        Raises:
            HTTPException: If updating call status fails
        """
        try:
            # First, find the call log by call_sid
            call_log = await self.get_call_log_by_sid(call_sid)
            
            if not call_log:
                logger.warning(f"Call log not found for SID: {call_sid}")
                return {"status": "not_found", "call_sid": call_sid}
            
            # Update the call log
            update_data = {
                "status": status,
                "updated_at": datetime.now().isoformat()
            }
            
            if duration is not None:
                update_data["duration"] = duration
                
            if recording_url:
                update_data["recording_url"] = recording_url
                
            # If the call is completed, try to get a transcript
            if status == "completed" and recording_url:
                try:
                    # This would be an async call to a transcription service
                    # For now, we'll just log that we would transcribe it
                    logger.info(f"Would transcribe recording at {recording_url}")
                    # In a real implementation, you would call a transcription service
                    # and update the call log with the transcription
                except Exception as e:
                    logger.error(f"Failed to transcribe call: {str(e)}")
            
            # Update the call log in the database
            from supabase import create_client, Client
            
            # Get Supabase client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                # Try local Supabase
                supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
                supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
            
            supabase = create_client(supabase_url, supabase_key)
            
            # Update the call log
            result = supabase.table("lead_calls").update(update_data).eq("call_sid", call_sid).execute()
            
            # If the call is associated with a lead, update the lead timeline
            if call_log.get("lead_id"):
                lead_id = call_log["lead_id"]
                
                # Create timeline entry
                timeline_entry = {
                    "lead_id": lead_id,
                    "type": "call_update",
                    "content": f"Call {status}" + (f" ({duration} seconds)" if duration else ""),
                    "data": {
                        "call_sid": call_sid,
                        "status": status,
                        "duration": duration,
                        "recording_url": recording_url
                    },
                    "created_at": datetime.now().isoformat(),
                    "user_id": call_log.get("called_by")  # Use the original caller's user ID
                }
                
                supabase.table("lead_timeline").insert(timeline_entry).execute()
            
            return {
                "status": "updated",
                "call_sid": call_sid,
                "new_status": status,
                "duration": duration,
                "recording_url": recording_url
            }
            
        except Exception as e:
            logger.error(f"Failed to update call status: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update call status: {str(e)}"
            )
    
    async def get_call_log_by_sid(self, call_sid: str) -> Optional[Dict[str, Any]]:
        """
        Get a call log by Twilio Call SID
        
        Args:
            call_sid: The Twilio Call SID
            
        Returns:
            Call log dict or None if not found
        """
        try:
            from supabase import create_client, Client
            
            # Get Supabase client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_KEY")
            
            if not supabase_url or not supabase_key:
                # Try local Supabase
                supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
                supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
            
            supabase = create_client(supabase_url, supabase_key)
            
            # Query the call log
            result = supabase.table("lead_calls").select("*").eq("call_sid", call_sid).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get call log by SID: {str(e)}")
            return None 