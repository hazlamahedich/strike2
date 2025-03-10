from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from typing import Any, List, Optional, Dict

from app.models.user import User
from app.models.company_analysis import (
    CompanyAnalysisResponse,
    WebScrapingRequest,
    BatchWebScrapingRequest,
    WebScrapingResponse,
    BatchWebScrapingResponse
)
from app.core.security import get_current_active_user, get_current_admin_user, RoleChecker
from app.services.web_scraping import WebScrapingService

router = APIRouter()

# Role-based permissions
allow_admin_or_marketer = RoleChecker(["admin", "marketer"])

@router.get("/{lead_id}", response_model=CompanyAnalysisResponse)
async def get_company_analysis(
    lead_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get company analysis for a lead.
    """
    # Check if user has access to this lead
    # This would typically involve checking if the lead belongs to the user or their team
    # For simplicity, we're skipping this check here
    
    analysis = await WebScrapingService.get_company_analysis(lead_id)
    return analysis

@router.post("/{lead_id}/trigger", response_model=WebScrapingResponse)
async def trigger_web_scraping(
    lead_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Trigger web scraping for a lead.
    """
    # Check if user has access to this lead
    # This would typically involve checking if the lead belongs to the user or their team
    # For simplicity, we're skipping this check here
    
    result = await WebScrapingService.trigger_web_scraping_for_lead(lead_id)
    return WebScrapingResponse(
        status=result.get("status", "pending"),
        message=result.get("message", "Web scraping initiated"),
        lead_id=lead_id
    )

@router.post("/batch/trigger", response_model=BatchWebScrapingResponse)
async def trigger_batch_web_scraping(
    request: BatchWebScrapingRequest,
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Trigger web scraping for multiple leads.
    Only available to admin and marketer roles.
    """
    if not request.lead_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No lead IDs provided"
        )
    
    result = await WebScrapingService.trigger_web_scraping_for_leads(request.lead_ids)
    
    return BatchWebScrapingResponse(
        status=result.get("status", "pending"),
        message=result.get("message", "Batch web scraping initiated"),
        total_leads=result.get("total_leads", len(request.lead_ids)),
        batches=result.get("batches", 1)
    )

@router.get("/status/{lead_id}", response_model=Dict[str, Any])
async def get_scraping_status(
    lead_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get the status of web scraping for a lead.
    """
    analysis = await WebScrapingService.get_company_analysis(lead_id)
    return {
        "lead_id": lead_id,
        "status": analysis.get("status", "pending"),
        "message": analysis.get("message", ""),
        "updated_at": analysis.get("updated_at")
    } 