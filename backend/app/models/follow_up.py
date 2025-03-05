from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class FollowUpSuggestion(BaseModel):
    """Model for a single follow-up suggestion"""
    type: str = Field(description="Type of follow-up: email, call, meeting, task")
    priority: float = Field(ge=0.0, le=1.0, description="Priority level from 0.0 to 1.0")
    suggested_timing: str = Field(description="When to follow up, e.g., 'tomorrow morning', '3 days'")
    template: str = Field(description="Template or suggested content for follow-up")
    explanation: str = Field(description="Explanation of why this follow-up is recommended")

class FollowUpSuggestionsResponse(BaseModel):
    """Response model for follow-up suggestions"""
    lead_id: int
    suggestions: List[FollowUpSuggestion] = Field(default_factory=list) 