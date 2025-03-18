import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from app.models.meeting import Meeting, MeetingStatus
from app.services.meeting import MeetingService
from app.services.ai import AIService
from app.services.lead import LeadService

logger = logging.getLogger(__name__)

class AIMeetingSchedulerService:
    """Service for AI-enhanced meeting scheduling"""
    
    def __init__(self):
        self.meeting_service = MeetingService()
        self.ai_service = AIService()
        self.lead_service = LeadService()
    
    async def suggest_optimal_meeting_times(
        self, 
        user_id: str, 
        lead_id: Optional[int] = None,
        meeting_type: str = "INITIAL_CALL",
        time_window_days: int = 7
    ) -> Dict[str, Any]:
        """
        Suggest optimal meeting times based on:
        1. User's calendar availability
        2. Lead's past meeting preferences (if available)
        3. Historical meeting success patterns
        
        Args:
            user_id: ID of the user scheduling the meeting
            lead_id: Optional ID of the lead for the meeting
            meeting_type: Type of meeting being scheduled
            time_window_days: Number of days to look ahead
            
        Returns:
            Dictionary with ranked time slots
        """
        # Get user's available time slots
        start_date = datetime.now()
        end_date = start_date + timedelta(days=time_window_days)
        
        # Get user's calendar availability
        availability = await self.meeting_service.get_user_availability(
            user_id, 
            start_date, 
            end_date
        )
        
        # If no lead is specified, just return regular availability
        if not lead_id:
            return availability
        
        # Get lead data
        lead = await self.lead_service.get_lead_by_id(lead_id)
        
        # Get lead's meeting history
        lead_meetings = await self.meeting_service.get_meetings_by_lead_id(lead_id)
        
        # Extract features for AI analysis
        features = self._extract_meeting_features(lead, lead_meetings)
        
        # Use AI to rank the available time slots
        ranked_slots = await self._rank_time_slots(
            availability.get("available_slots", []),
            features,
            meeting_type
        )
        
        # Return the ranked availability
        return {
            "user_id": user_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "available_slots": ranked_slots,
            "timezone": availability.get("timezone", "UTC")
        }
    
    async def recommend_meeting_duration(
        self,
        meeting_type: str,
        lead_id: Optional[int] = None
    ) -> int:
        """
        Recommend optimal meeting duration in minutes
        
        Args:
            meeting_type: Type of meeting
            lead_id: Optional lead ID
            
        Returns:
            Recommended duration in minutes
        """
        # Default durations by meeting type
        default_durations = {
            "INITIAL_CALL": 30,
            "DISCOVERY": 45,
            "DEMO": 60,
            "PROPOSAL": 45,
            "FOLLOW_UP": 30,
            "OTHER": 30
        }
        
        # If no lead or no historical data, return default
        if not lead_id:
            return default_durations.get(meeting_type, 30)
        
        # Get lead's past meetings
        lead_meetings = await self.meeting_service.get_meetings_by_lead_id(lead_id)
        
        # If no past meetings, return default
        if not lead_meetings:
            return default_durations.get(meeting_type, 30)
        
        # Analyze past meetings of this type
        similar_meetings = [
            m for m in lead_meetings 
            if m.get("meeting_type") == meeting_type
        ]
        
        # If no similar meetings, return default
        if not similar_meetings:
            return default_durations.get(meeting_type, 30)
        
        # Calculate average duration of past similar meetings
        total_minutes = 0
        for meeting in similar_meetings:
            start_time = datetime.fromisoformat(meeting.get("start_time"))
            end_time = datetime.fromisoformat(meeting.get("end_time"))
            duration = (end_time - start_time).total_seconds() / 60
            total_minutes += duration
        
        avg_duration = total_minutes / len(similar_meetings)
        
        # Round to nearest 15 minutes
        rounded_duration = round(avg_duration / 15) * 15
        
        # Ensure minimum of 15 minutes
        return max(15, int(rounded_duration))
    
    async def generate_meeting_agenda(
        self,
        meeting_type: str,
        lead_id: int,
        user_id: str
    ) -> List[str]:
        """
        Generate an AI-powered meeting agenda
        
        Args:
            meeting_type: Type of meeting
            lead_id: Lead ID
            user_id: User ID
            
        Returns:
            List of agenda items
        """
        # Get lead data
        lead = await self.lead_service.get_lead_by_id(lead_id)
        
        # Get lead's interaction history
        lead_history = await self.lead_service.get_lead_activity_history(lead_id)
        
        # Get lead's past meetings
        lead_meetings = await self.meeting_service.get_meetings_by_lead_id(lead_id)
        
        # Prepare context for AI
        context = {
            "lead": lead,
            "meeting_type": meeting_type,
            "past_meetings": lead_meetings,
            "interaction_history": lead_history
        }
        
        # Use AI service to generate agenda
        response = await self.ai_service.generate_content({
            "prompt": f"Generate a meeting agenda for a {meeting_type} meeting with {lead.get('first_name')} {lead.get('last_name')} from {lead.get('company')}",
            "context": context,
            "max_tokens": 500,
            "temperature": 0.7
        })
        
        # Parse the response into agenda items
        agenda_items = response.get("content", "").strip().split('\n')
        agenda_items = [item.strip('- ') for item in agenda_items if item.strip()]
        
        return agenda_items
    
    # Private helper methods
    
    async def _rank_time_slots(
        self,
        available_slots: List[Dict[str, Any]],
        features: Dict[str, Any],
        meeting_type: str
    ) -> List[Dict[str, Any]]:
        """
        Use AI to rank available time slots based on likelihood of success
        
        Args:
            available_slots: List of available time slots
            features: Features extracted from lead and meeting history
            meeting_type: Type of meeting
            
        Returns:
            Ranked list of time slots with scores
        """
        if not available_slots:
            return []
        
        # Convert slots to feature representation
        slot_features = []
        for slot in available_slots:
            slot_time = datetime.fromisoformat(slot.get("start_time"))
            slot_features.append({
                "day_of_week": slot_time.weekday(),
                "hour_of_day": slot_time.hour,
                "is_morning": 6 <= slot_time.hour < 12,
                "is_afternoon": 12 <= slot_time.hour < 17,
                "is_evening": 17 <= slot_time.hour < 22,
                "original_slot": slot
            })
        
        # Score each slot based on features
        scored_slots = []
        for slot_feature in slot_features:
            score = self._calculate_slot_score(slot_feature, features, meeting_type)
            slot = slot_feature["original_slot"]
            slot["score"] = score
            scored_slots.append(slot)
        
        # Sort by score (descending)
        ranked_slots = sorted(scored_slots, key=lambda x: x.get("score", 0), reverse=True)
        
        return ranked_slots
    
    def _calculate_slot_score(
        self,
        slot_feature: Dict[str, Any],
        lead_features: Dict[str, Any],
        meeting_type: str
    ) -> float:
        """
        Calculate a score for a time slot based on features
        
        Args:
            slot_feature: Features of the time slot
            lead_features: Features of the lead
            meeting_type: Type of meeting
            
        Returns:
            Score between 0 and 1
        """
        # Base score
        score = 0.5
        
        # Adjust based on lead's preferred meeting times (if available)
        if lead_features.get("preferred_day_of_week") == slot_feature["day_of_week"]:
            score += 0.1
        
        if lead_features.get("preferred_time_of_day"):
            preferred_time = lead_features["preferred_time_of_day"]
            if preferred_time == "morning" and slot_feature["is_morning"]:
                score += 0.1
            elif preferred_time == "afternoon" and slot_feature["is_afternoon"]:
                score += 0.1
            elif preferred_time == "evening" and slot_feature["is_evening"]:
                score += 0.1
        
        # Adjust based on historical meeting success patterns
        if lead_features.get("successful_meeting_days"):
            if slot_feature["day_of_week"] in lead_features["successful_meeting_days"]:
                score += 0.15
        
        if lead_features.get("successful_meeting_hours"):
            if slot_feature["hour_of_day"] in lead_features["successful_meeting_hours"]:
                score += 0.15
        
        # Ensure score is between 0 and 1
        return max(0, min(1, score))
    
    def _extract_meeting_features(
        self,
        lead: Dict[str, Any],
        meetings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extract features from lead and meeting history for AI analysis
        
        Args:
            lead: Lead data
            meetings: List of past meetings
            
        Returns:
            Dictionary of features
        """
        features = {
            "lead_id": lead.get("id"),
            "lead_industry": lead.get("industry"),
            "lead_company_size": lead.get("company_size"),
            "total_past_meetings": len(meetings)
        }
        
        # Extract preferred meeting times if enough data
        if meetings:
            # Count meetings by day of week
            day_counts = [0] * 7
            hour_counts = [0] * 24
            
            # Track successful meetings
            successful_days = set()
            successful_hours = set()
            
            for meeting in meetings:
                start_time = datetime.fromisoformat(meeting.get("start_time"))
                day_of_week = start_time.weekday()
                hour_of_day = start_time.hour
                
                day_counts[day_of_week] += 1
                hour_counts[hour_of_day] += 1
                
                # If meeting was successful (e.g., led to next stage)
                if meeting.get("status") == "COMPLETED" and meeting.get("notes") and "successful" in meeting.get("notes", "").lower():
                    successful_days.add(day_of_week)
                    successful_hours.add(hour_of_day)
            
            # Find preferred day (most frequent)
            preferred_day = day_counts.index(max(day_counts))
            features["preferred_day_of_week"] = preferred_day
            
            # Find preferred time of day
            morning_count = sum(hour_counts[6:12])
            afternoon_count = sum(hour_counts[12:17])
            evening_count = sum(hour_counts[17:22])
            
            max_count = max(morning_count, afternoon_count, evening_count)
            if max_count == morning_count:
                features["preferred_time_of_day"] = "morning"
            elif max_count == afternoon_count:
                features["preferred_time_of_day"] = "afternoon"
            else:
                features["preferred_time_of_day"] = "evening"
            
            # Add successful meeting patterns
            if successful_days:
                features["successful_meeting_days"] = list(successful_days)
            
            if successful_hours:
                features["successful_meeting_hours"] = list(successful_hours)
        
        return features 