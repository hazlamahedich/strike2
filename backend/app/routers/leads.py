from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, File, UploadFile, Path
from typing import Any, List, Optional, Dict
from datetime import datetime

from app.models.user import User
from app.models.lead import (
    Lead, 
    LeadCreate, 
    LeadUpdate, 
    LeadDetail, 
    LeadImport, 
    LeadExport,
    LeadFilter
)
from app.models.campaign_lead import (
    CampaignLead,
    LeadCampaignStatus
)
from app.core.security import get_current_active_user, get_current_admin_user, RoleChecker
from app.services import lead as lead_service
from app.services import ai as ai_service
from app.services import campaign as campaign_service

router = APIRouter()

# Role-based permissions
allow_admin_or_marketer = RoleChecker(["admin", "marketer"])

@router.get("/", response_model=List[Lead])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source: Optional[str] = None,
    owner_id: Optional[int] = None,
    campaign_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_desc: bool = True,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve leads with filtering options.
    """
    # Build filter from query params
    lead_filter = LeadFilter(
        status=[status] if status else None,
        source=[source] if source else None,
        owner_id=owner_id,
        search=search,
        campaign_id=campaign_id
    )
    
    # For non-admin users, restrict to their own leads or team leads
    if current_user.role != "admin" and current_user.role != "manager" and current_user.role != "marketer":
        if owner_id is not None and owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own leads"
            )
        lead_filter.owner_id = current_user.id
    
    # If a manager, restrict to team leads
    if current_user.role == "manager" and current_user.team_id:
        lead_filter.team_id = current_user.team_id
    
    leads = await lead_service.get_leads(
        skip=skip, 
        limit=limit, 
        lead_filter=lead_filter,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    return leads

@router.post("/", response_model=Lead)
async def create_lead(
    lead_in: LeadCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new lead.
    """
    # If owner_id is not set, set it to current user
    if not lead_in.owner_id:
        lead_in_dict = lead_in.dict()
        lead_in_dict["owner_id"] = current_user.id
        if not lead_in.team_id and current_user.team_id:
            lead_in_dict["team_id"] = current_user.team_id
        lead_in = LeadCreate(**lead_in_dict)
            
    lead = await lead_service.create_lead(lead_in, user_id=current_user.id)
    
    # Calculate initial lead score asynchronously if AI features are enabled
    await ai_service.calculate_lead_score(lead.id)
    
    return lead

@router.get("/{lead_id}", response_model=LeadDetail)
async def get_lead(
    lead_id: int,
    include_campaign_data: bool = True,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed lead information by ID.
    """
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check if user has access to this lead
    if current_user.role != "admin" and current_user.role != "manager" and current_user.role != "marketer":
        if lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # If a manager, check team_id
    if current_user.role == "manager" and current_user.team_id:
        if lead.team_id != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Get detailed lead info
    lead_detail = await lead_service.get_lead_detail(lead_id, include_campaign_data=include_campaign_data)
    return lead_detail

@router.put("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a lead.
    """
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check if user has access to update this lead
    if current_user.role != "admin" and current_user.role != "manager" and current_user.role != "marketer":
        if lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # If a manager, check team_id
    if current_user.role == "manager" and current_user.team_id:
        if lead.team_id != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    updated_lead = await lead_service.update_lead(lead_id, lead_in, user_id=current_user.id)
    
    # Recalculate lead score if status changed or other significant fields changed
    significant_fields = ["status", "owner_id", "team_id"]
    for field in significant_fields:
        if getattr(lead_in, field, None) is not None:
            await ai_service.calculate_lead_score(lead_id, force_recalculate=True)
            break
    
    return updated_lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a lead.
    """
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Only admins, the owner, or a manager of the team can delete leads
    can_delete = (
        current_user.role == "admin" or 
        lead.owner_id == current_user.id or 
        (current_user.role == "manager" and current_user.team_id == lead.team_id)
    )
    
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    await lead_service.delete_lead(lead_id)

@router.post("/import", response_model=Dict[str, Any])
async def import_leads(
    file: UploadFile = File(...),
    field_mapping: Dict[str, str] = Body(...),
    campaign_id: Optional[int] = Body(None),
    handle_duplicates: str = Body("skip"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Import leads from CSV/Excel file.
    
    Optionally associate all imported leads with a campaign.
    """
    # Process file and import leads
    result = await lead_service.import_leads(
        file=file,
        field_mapping=field_mapping,
        handle_duplicates=handle_duplicates,
        user_id=current_user.id,
        team_id=current_user.team_id,
        campaign_id=campaign_id
    )
    return result

@router.post("/export", response_model=Dict[str, Any])
async def export_leads(
    export_config: LeadExport,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Export leads to CSV/Excel.
    """
    # Export leads based on config
    result = await lead_service.export_leads(
        lead_ids=export_config.lead_ids,
        filters=export_config.filters,
        export_format=export_config.export_format,
        include_fields=export_config.include_fields,
        include_campaign_data=export_config.include_campaign_data,
        user_id=current_user.id,
        user_role=current_user.role,
        team_id=current_user.team_id
    )
    return result

@router.get("/{lead_id}/timeline", response_model=List[Dict[str, Any]])
async def get_lead_timeline(
    lead_id: int,
    limit: int = 20,
    interaction_types: Optional[List[str]] = Query(None, description="Filter by interaction types (email, call, note, task, meeting, sms, activity)"),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get timeline of all interactions with a lead.
    
    Optionally filter by interaction types:
    - email: Email communications
    - call: Phone calls
    - note: Notes
    - task: Tasks
    - meeting: Meetings
    - sms: SMS messages
    - activity: General activities (status changes, etc.)
    """
    # Check access to lead
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and current_user.role != "manager" and current_user.role != "marketer":
        if lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # If a manager, check team_id
    if current_user.role == "manager" and current_user.team_id:
        if lead.team_id != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    timeline = await lead_service.get_lead_timeline(lead_id, limit=limit, interaction_types=interaction_types)
    return timeline

@router.get("/{lead_id}/campaigns", response_model=List[Dict[str, Any]])
async def get_lead_campaigns(
    lead_id: int,
    include_removed: bool = False,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all campaigns a lead is associated with.
    """
    # Check access to lead
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Check permissions (same as other lead endpoints)
    if current_user.role != "admin" and current_user.role != "manager" and current_user.role != "marketer":
        if lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # If a manager, check team_id
    if current_user.role == "manager" and current_user.team_id:
        if lead.team_id != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Get campaigns for the lead
    campaigns = await campaign_service.get_lead_campaigns(lead_id, include_removed=include_removed)
    return campaigns

@router.post("/{lead_id}/campaigns/{campaign_id}", response_model=CampaignLead)
async def add_lead_to_campaign(
    lead_id: int = Path(..., gt=0), 
    campaign_id: int = Path(..., gt=0),
    status: LeadCampaignStatus = Query(LeadCampaignStatus.ADDED),
    notes: Optional[str] = Query(None),
    metadata: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Add a lead to a campaign.
    
    Only admins and marketers can add leads to campaigns.
    """
    # Check if lead exists
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Add the lead to the campaign
    result = await campaign_service.add_lead_to_campaign(
        campaign_id=campaign_id,
        lead_id=lead_id,
        user_id=current_user.id,
        status=status,
        notes=notes,
        metadata=metadata
    )
    
    return result

@router.delete("/{lead_id}/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_lead_from_campaign(
    lead_id: int = Path(..., gt=0),
    campaign_id: int = Path(..., gt=0),
    notes: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Remove a lead from a campaign.
    
    Only admins and marketers can remove leads from campaigns.
    """
    # Check if lead exists
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Remove the lead from the campaign
    await campaign_service.remove_lead_from_campaign(
        campaign_id=campaign_id,
        lead_id=lead_id,
        user_id=current_user.id,
        notes=notes
    )
    
    return None

@router.put("/{lead_id}/campaigns/{campaign_id}", response_model=CampaignLead)
async def update_lead_campaign_status(
    lead_id: int = Path(..., gt=0),
    campaign_id: int = Path(..., gt=0),
    status: LeadCampaignStatus = Body(...),
    notes: Optional[str] = Body(None),
    metadata: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Update a lead's status in a campaign.
    
    Only admins and marketers can update lead campaign statuses.
    """
    # Check if lead exists
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    # Update the lead's status in the campaign
    result = await campaign_service.update_campaign_lead_status(
        campaign_id=campaign_id,
        lead_id=lead_id,
        status=status,
        user_id=current_user.id,
        notes=notes,
        metadata=metadata
    )
    
    return result

@router.post("/bulk-add-to-campaign", response_model=Dict[str, Any])
async def bulk_add_leads_to_campaign(
    campaign_id: int = Body(..., gt=0),
    lead_ids: List[int] = Body(...),
    status: LeadCampaignStatus = Body(LeadCampaignStatus.ADDED),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Add multiple leads to a campaign at once.
    
    Only admins and marketers can perform bulk operations.
    """
    # Check permissions already handled by the dependency
    
    # Add the leads to the campaign
    result = await campaign_service.bulk_add_leads_to_campaign(
        campaign_id=campaign_id,
        lead_ids=lead_ids,
        user_id=current_user.id,
        status=status,
        notes=notes
    )
    
    return result

@router.get("/{lead_id}/insights", response_model=Dict[str, Any])
async def get_lead_insights(
    lead_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get AI-powered insights about a lead.
    """
    # Check access to lead
    lead = await lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead not found"
        )
    
    if current_user.role != "admin" and current_user.role != "manager":
        if lead.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    insights = await ai_service.get_lead_insights(lead_id)
    return insights 