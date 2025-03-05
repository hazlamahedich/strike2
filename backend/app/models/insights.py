from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class LeadInsight(BaseModel):
    """Model for a single lead insight"""
    type: str = Field(description="Type of insight: opportunity, risk, observation, recommendation")
    description: str
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence level from 0.0 to 1.0")
    supporting_data: Dict[str, Any] = Field(default_factory=dict)
    suggested_actions: List[str] = Field(default_factory=list)

class LeadInsightsResponse(BaseModel):
    """Response model for lead insights"""
    lead_id: int
    insights: List[LeadInsight] = Field(default_factory=list)
    optimal_contact_times: Dict[str, Any] = Field(default_factory=dict)
    communication_preferences: Dict[str, Any] = Field(default_factory=dict) 