"""
Communication service module for handling email, SMS, and call functionality.
Integrates with SendGrid for email and Twilio for SMS and calls.
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

from fastapi import HTTPException, status
from pydantic import EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from app.core.config import settings
from app.models.communication import (
    EmailMessage, 
    EmailTemplate, 
    EmailSequence, 
    EmailSequenceStep,
    SMSMessage, 
    Call, 
    CallTranscript
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