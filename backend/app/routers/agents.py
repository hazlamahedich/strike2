from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.services import ai as ai_service
from app.models.content import ContentGenerationRequest, ContentGenerationResponse
from app.models.insights import LeadInsightsResponse
from app.models.follow_up import FollowUpSuggestionsResponse
from app.core.security import get_current_active_user
from app.models.user import User

router = APIRouter()

class DocumentProcessingRequest(BaseModel):
    """Request model for document processing"""
    document: str
    source: Optional[str] = None

@router.post("/document-processing", response_model=Dict[str, Any])
async def process_document(
    request: DocumentProcessingRequest,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Process an unstructured document to extract lead information using LangGraph agents
    """
    result = await ai_service.process_lead_document(
        document=request.document,
        source=request.source
    )
    return result

@router.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_advanced_content(
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_active_user)
) -> ContentGenerationResponse:
    """
    Generate personalized communication content using the LangGraph CommunicationAssistant agent
    """
    result = await ai_service.generate_advanced_content(request)
    return result

@router.get("/lead-insights/{lead_id}", response_model=LeadInsightsResponse)
async def get_lead_insights(
    lead_id: int,
    current_user: User = Depends(get_current_active_user)
) -> LeadInsightsResponse:
    """
    Get advanced insights for a lead using the LangGraph InsightGenerator agent
    """
    result = await ai_service.get_advanced_lead_insights(lead_id)
    return result

@router.get("/follow-up-suggestions/{lead_id}", response_model=FollowUpSuggestionsResponse)
async def get_follow_up_suggestions(
    lead_id: int,
    current_user: User = Depends(get_current_active_user)
) -> FollowUpSuggestionsResponse:
    """
    Get advanced follow-up suggestions using the LangGraph TaskOrchestrator agent
    """
    result = await ai_service.get_advanced_follow_up_suggestions(lead_id)
    return result 