import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.services.ai import AIService
from app.services.lead import LeadService
from app.services.communication import CommunicationService

logger = logging.getLogger(__name__)

class MeetingFollowUpService:
    """Service for AI-powered meeting follow-ups"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.lead_service = LeadService()
        self.communication_service = CommunicationService()
    
    async def generate_follow_up_message(self, meeting_id: int) -> Dict[str, str]:
        """
        Generate a personalized follow-up message for a meeting
        
        Args:
            meeting_id: ID of the meeting
            
        Returns:
            Dictionary with subject and message
        """
        # Get meeting details
        meeting = await self._get_meeting(meeting_id)
        
        if not meeting:
            raise ValueError(f"Meeting with ID {meeting_id} not found")
        
        # Get lead details
        lead = await self.lead_service.get_lead_by_id(meeting.get("lead_id"))
        
        # Get meeting notes if available
        meeting_notes = meeting.get("notes", "")
        
        # Prepare context for AI
        context = {
            "meeting": {
                "title": meeting.get("title"),
                "description": meeting.get("description"),
                "start_time": meeting.get("start_time"),
                "end_time": meeting.get("end_time"),
                "status": meeting.get("status"),
                "notes": meeting_notes,
                "meeting_type": meeting.get("meeting_type")
            },
            "lead": lead,
        }
        
        # Generate follow-up message using AI
        response = await self.ai_service.generate_content({
            "prompt": f"Generate a personalized follow-up email for a {meeting.get('meeting_type')} meeting with {lead.get('first_name')} {lead.get('last_name')} from {lead.get('company')}. The meeting was about {meeting.get('title')}.",
            "context": context,
            "max_tokens": 1000,
            "temperature": 0.7
        })
        
        # Parse the response
        content = response.get("content", "").strip()
        
        # Extract subject and message
        lines = content.split('\n')
        subject = lines[0].replace('Subject:', '').strip()
        message = '\n'.join(lines[1:]).strip()
        
        return {
            "subject": subject,
            "message": message
        }
    
    async def generate_meeting_summary(self, meeting_id: int) -> Dict[str, Any]:
        """
        Generate a summary of a meeting with action items
        
        Args:
            meeting_id: ID of the meeting
            
        Returns:
            Dictionary with summary and action items
        """
        # Get meeting details
        meeting = await self._get_meeting(meeting_id)
        
        if not meeting:
            raise ValueError(f"Meeting with ID {meeting_id} not found")
        
        # Get lead details
        lead = await self.lead_service.get_lead_by_id(meeting.get("lead_id"))
        
        # Get meeting notes if available
        meeting_notes = meeting.get("notes", "")
        
        # Prepare context for AI
        context = {
            "meeting": {
                "title": meeting.get("title"),
                "description": meeting.get("description"),
                "start_time": meeting.get("start_time"),
                "end_time": meeting.get("end_time"),
                "status": meeting.get("status"),
                "notes": meeting_notes,
                "meeting_type": meeting.get("meeting_type")
            },
            "lead": lead,
        }
        
        # Generate meeting summary using AI
        response = await self.ai_service.generate_content({
            "prompt": f"Generate a concise summary of a {meeting.get('meeting_type')} meeting with {lead.get('first_name')} {lead.get('last_name')} from {lead.get('company')}. Extract key points and action items from the meeting notes: {meeting_notes}",
            "context": context,
            "max_tokens": 1000,
            "temperature": 0.3
        })
        
        # Parse the response
        content = response.get("content", "").strip()
        
        # Extract summary and action items
        sections = content.split('Action Items:')
        summary = sections[0].strip()
        
        action_items = []
        if len(sections) > 1:
            action_text = sections[1].strip()
            action_lines = action_text.split('\n')
            action_items = [line.strip('- ').strip() for line in action_lines if line.strip()]
        
        return {
            "summary": summary,
            "action_items": action_items
        }
    
    async def schedule_follow_up_task(
        self,
        meeting_id: int,
        user_id: str,
        days_delay: int = 3
    ) -> Dict[str, Any]:
        """
        Schedule a follow-up task after a meeting
        
        Args:
            meeting_id: ID of the meeting
            user_id: ID of the user
            days_delay: Number of days to delay the follow-up
            
        Returns:
            Created task details
        """
        # Get meeting details
        meeting = await self._get_meeting(meeting_id)
        
        if not meeting:
            raise ValueError(f"Meeting with ID {meeting_id} not found")
        
        # Get lead details
        lead = await self.lead_service.get_lead_by_id(meeting.get("lead_id"))
        
        # Generate follow-up message
        follow_up = await self.generate_follow_up_message(meeting_id)
        
        # Calculate due date
        due_date = datetime.now() + timedelta(days=days_delay)
        
        # Create task
        task_data = {
            "title": f"Follow up with {lead.get('first_name')} {lead.get('last_name')} after {meeting.get('title')}",
            "description": f"Send follow-up email regarding the {meeting.get('meeting_type')} meeting on {meeting.get('start_time').split('T')[0]}.\n\nSuggested email:\nSubject: {follow_up['subject']}\n\n{follow_up['message']}",
            "due_date": due_date.isoformat(),
            "priority": "medium",
            "status": "pending",
            "lead_id": meeting.get("lead_id"),
            "assigned_to": user_id,
            "related_to": {
                "type": "meeting",
                "id": meeting_id
            }
        }
        
        # In a real implementation, save to database
        # For now, just return the task data
        return task_data
    
    async def generate_comprehensive_meeting_summary(self, meeting_id: int) -> Dict[str, Any]:
        """
        Generate a comprehensive meeting summary that includes all lead interactions
        
        Args:
            meeting_id: ID of the meeting
            
        Returns:
            Dictionary with summary, action items, and insights
        """
        # Get meeting details
        meeting = await self._get_meeting(meeting_id)
        
        if not meeting:
            raise ValueError(f"Meeting with ID {meeting_id} not found")
        
        # Get lead details
        lead_id = meeting.get("lead_id")
        if not lead_id:
            raise ValueError(f"Meeting with ID {meeting_id} has no associated lead")
        
        lead = await self.lead_service.get_lead_by_id(lead_id)
        
        # Get meeting notes if available
        meeting_notes = meeting.get("notes", "")
        
        # Get lead's interaction history
        lead_history = await self.lead_service.get_lead_activity_history(lead_id)
        
        # Get all communications with the lead
        emails = await self.lead_service.get_lead_emails(lead_id)
        calls = await self.lead_service.get_lead_calls(lead_id)
        sms = await self.lead_service.get_lead_sms(lead_id)
        
        # Get previous meetings with the lead
        previous_meetings = await self.lead_service.get_lead_meetings(lead_id)
        previous_meetings = [m for m in previous_meetings if m.get("id") != meeting_id]
        
        # Prepare context for AI
        context = {
            "meeting": {
                "title": meeting.get("title"),
                "description": meeting.get("description"),
                "start_time": meeting.get("start_time"),
                "end_time": meeting.get("end_time"),
                "status": meeting.get("status"),
                "notes": meeting_notes,
                "meeting_type": meeting.get("meeting_type")
            },
            "lead": lead,
            "previous_meetings": previous_meetings,
            "emails": emails,
            "calls": calls,
            "sms": sms,
            "lead_history": lead_history
        }
        
        # Generate comprehensive meeting summary using AI
        response = await self.ai_service.generate_content({
            "prompt": f"""Generate a comprehensive meeting guide for a {meeting.get('meeting_type')} meeting with {lead.get('first_name')} {lead.get('last_name')} from {lead.get('company')}.
            
            Analyze all previous interactions including emails, calls, SMS messages, and previous meetings to provide:
            1. A summary of the current meeting
            2. Key insights from all interactions
            3. Action items from the current meeting
            4. Recommended next steps based on the entire interaction history
            
            Meeting notes: {meeting_notes}""",
            "context": context,
            "max_tokens": 1500,
            "temperature": 0.3
        })
        
        # Parse the response
        content = response.get("content", "").strip()
        
        # Extract sections
        sections = {
            "summary": "",
            "insights": [],
            "action_items": [],
            "next_steps": []
        }
        
        # Simple parsing logic - in a real implementation, you might want more robust parsing
        current_section = "summary"
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if "Key Insights:" in line or "Insights:" in line:
                current_section = "insights"
                continue
            elif "Action Items:" in line:
                current_section = "action_items"
                continue
            elif "Next Steps:" in line or "Recommended Next Steps:" in line:
                current_section = "next_steps"
                continue
            
            if current_section == "summary":
                sections["summary"] += line + " "
            elif current_section in ["insights", "action_items", "next_steps"]:
                # Remove bullet points and numbering
                clean_line = line.lstrip("•-*1234567890. ")
                if clean_line:
                    sections[current_section].append(clean_line)
        
        # Clean up summary
        sections["summary"] = sections["summary"].strip()
        
        return {
            "summary": sections["summary"],
            "insights": sections["insights"],
            "action_items": sections["action_items"],
            "next_steps": sections["next_steps"]
        }
    
    # Private helper methods
    
    async def _get_meeting(self, meeting_id: int) -> Optional[Dict[str, Any]]:
        """
        Get meeting by ID
        
        Args:
            meeting_id: ID of the meeting
            
        Returns:
            Meeting data or None
        """
        # In a real implementation, fetch from database
        # For now, use a mock implementation
        
        # Query the database for the meeting
        query = """
        SELECT m.*, u.name as user_name, u.email as user_email
        FROM meetings m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
        """
        
        # Execute the query
        # This is a placeholder - in a real implementation, you would use your database client
        # result = await db.fetch_one(query, meeting_id)
        
        # For now, return a mock meeting
        return {
            "id": meeting_id,
            "title": "Mock Meeting",
            "description": "This is a mock meeting",
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "status": "COMPLETED",
            "location": "Virtual",
            "meeting_type": "INITIAL_CALL",
            "lead_id": 1,
            "user_id": "user_123",
            "notes": "Discussed product features. Client showed interest in premium plan.",
            "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
            "updated_at": datetime.now().isoformat()
        } 