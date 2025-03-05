from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class ContentGenerationRequest(BaseModel):
    """Request model for content generation"""
    lead_id: int
    content_type: str = Field(description="Type of content: email, sms, call_script, meeting_agenda")
    purpose: str = Field(description="Purpose: introduction, follow_up, proposal, check_in")
    tone: str = Field(default="professional", description="Tone: professional, friendly, formal, casual")
    key_points: Optional[List[str]] = Field(default=None, description="Key points to include in the content")

class ContentGenerationResponse(BaseModel):
    """Response model for content generation"""
    content: str
    variables: Dict[str, Any] = Field(default_factory=dict)
    alternative_versions: List[str] = Field(default_factory=list) 