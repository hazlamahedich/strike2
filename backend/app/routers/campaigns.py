from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body

from app.core.security import get_current_active_user, RoleChecker
from app.models.user import User
from app.models.campaign import (
    Campaign, 
    CampaignCreate, 
    CampaignUpdate, 
    CampaignDetail,
    CampaignFilter,
    CampaignTypeEnum,
    CampaignStatusEnum
)
from app.models.campaign_lead import (
    CampaignLead, 
    CampaignLeadCreate, 
    CampaignLeadUpdate,
    LeadCampaignStatus
)
from app.services.campaign import (
    get_campaign_by_id,
    get_campaigns,
    create_campaign,
    update_campaign,
    delete_campaign,
    get_campaign_detail,
    add_lead_to_campaign,
    remove_lead_from_campaign,
    update_campaign_lead_status,
    get_campaign_leads,
    get_lead_campaigns,
    bulk_add_leads_to_campaign
)

router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
    dependencies=[Depends(get_current_active_user)]
)

# Role-based permissions
allow_admin_or_marketer = RoleChecker(["admin", "marketer"])
allow_admin = RoleChecker(["admin"])


@router.get("/", response_model=List[Campaign])
async def list_campaigns(
    search: Optional[str] = None,
    status: Optional[List[CampaignStatusEnum]] = Query(None),
    type: Optional[List[CampaignTypeEnum]] = Query(None),
    created_by: Optional[int] = None,
    tags: Optional[List[str]] = Query(None),
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all campaigns with optional filtering.
    
    Regular users can only see campaigns they created or are assigned to.
    Admins and marketers can see all campaigns.
    """
    # Apply filters if provided
    campaign_filter = None
    if search or status or type or created_by or tags:
        campaign_filter = CampaignFilter(
            search=search,
            status=status,
            type=type,
            created_by=created_by,
            tags=tags
        )
    
    # Determine if team filter should be applied
    team_id = None
    if current_user.role not in ['admin', 'marketer']:
        # Regular users can only see campaigns in their team
        team_id = current_user.team_id
    
    campaigns = await get_campaigns(
        skip=skip,
        limit=limit,
        campaign_filter=campaign_filter,
        sort_by=sort_by,
        sort_desc=sort_desc,
        user_id=current_user.id,
        team_id=team_id
    )
    
    return campaigns


@router.post("/", response_model=Campaign, status_code=status.HTTP_201_CREATED)
async def create_new_campaign(
    campaign_in: CampaignCreate,
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Create a new campaign.
    
    Only admins and marketers can create campaigns.
    """
    return await create_campaign(campaign_in, current_user.id)


@router.get("/{campaign_id}", response_model=Campaign)
async def get_campaign(
    campaign_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific campaign by ID.
    """
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Check if user has access to this campaign
    if current_user.role not in ['admin', 'marketer'] and campaign.created_by != current_user.id:
        # Regular users can only see their own campaigns
        # TODO: Add team-based access check here if needed
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this campaign"
        )
    
    return campaign


@router.get("/{campaign_id}/detail", response_model=CampaignDetail)
async def get_detailed_campaign(
    campaign_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get detailed information about a campaign including sample leads and recent activities.
    """
    try:
        campaign_detail = await get_campaign_detail(campaign_id)
        
        # Check if user has access to this campaign
        if current_user.role not in ['admin', 'marketer'] and campaign_detail.created_by != current_user.id:
            # Regular users can only see their own campaigns
            # TODO: Add team-based access check here if needed
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this campaign"
            )
        
        return campaign_detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaign detail: {str(e)}"
        )


@router.put("/{campaign_id}", response_model=Campaign)
async def update_existing_campaign(
    campaign_id: int = Path(..., gt=0),
    campaign_in: CampaignUpdate = Body(...),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Update an existing campaign.
    
    Only admins and marketers can update campaigns.
    """
    # Check if the current user has permission to update this campaign
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Only admins or the campaign creator can update the campaign
    if current_user.role != 'admin' and campaign.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this campaign"
        )
    
    return await update_campaign(campaign_id, campaign_in)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_campaign(
    campaign_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Delete a campaign.
    
    Only admins and marketers can delete campaigns. Admins can delete any campaign,
    while marketers can only delete campaigns they created.
    """
    # Check if the current user has permission to delete this campaign
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Only admins or the campaign creator can delete the campaign
    if current_user.role != 'admin' and campaign.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this campaign"
        )
    
    await delete_campaign(campaign_id)
    return None


@router.get("/{campaign_id}/leads", response_model=List[Dict[str, Any]])
async def get_leads_in_campaign(
    campaign_id: int = Path(..., gt=0),
    status: Optional[List[LeadCampaignStatus]] = Query(None),
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all leads in a campaign with optional filtering.
    """
    # Check if the user has access to this campaign
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Regular users can only access campaigns they created
    if current_user.role not in ['admin', 'marketer'] and campaign.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this campaign"
        )
    
    return await get_campaign_leads(
        campaign_id=campaign_id,
        skip=skip,
        limit=limit,
        status=status,
        sort_by=sort_by,
        sort_desc=sort_desc
    )


@router.post("/{campaign_id}/leads/{lead_id}", response_model=CampaignLead)
async def add_lead_to_existing_campaign(
    campaign_id: int = Path(..., gt=0),
    lead_id: int = Path(..., gt=0),
    status: LeadCampaignStatus = Query(LeadCampaignStatus.ADDED),
    notes: Optional[str] = Query(None),
    metadata: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Add a lead to a campaign.
    
    Only admins and marketers can add leads to campaigns.
    """
    return await add_lead_to_campaign(
        campaign_id=campaign_id,
        lead_id=lead_id,
        user_id=current_user.id,
        status=status,
        notes=notes,
        metadata=metadata
    )


@router.delete("/{campaign_id}/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_lead_from_existing_campaign(
    campaign_id: int = Path(..., gt=0),
    lead_id: int = Path(..., gt=0),
    notes: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Remove a lead from a campaign.
    
    Only admins and marketers can remove leads from campaigns.
    """
    await remove_lead_from_campaign(
        campaign_id=campaign_id,
        lead_id=lead_id,
        user_id=current_user.id,
        notes=notes
    )
    return None


@router.put("/{campaign_id}/leads/{lead_id}", response_model=CampaignLead)
async def update_lead_status_in_campaign(
    campaign_id: int = Path(..., gt=0),
    lead_id: int = Path(..., gt=0),
    status: LeadCampaignStatus = Body(...),
    notes: Optional[str] = Body(None),
    metadata: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Update the status of a lead in a campaign.
    
    Only admins and marketers can update lead statuses.
    """
    return await update_campaign_lead_status(
        campaign_id=campaign_id,
        lead_id=lead_id,
        status=status,
        user_id=current_user.id,
        notes=notes,
        metadata=metadata
    )


@router.post("/{campaign_id}/bulk-add", response_model=Dict[str, Any])
async def bulk_add_leads(
    campaign_id: int = Path(..., gt=0),
    lead_ids: List[int] = Body(...),
    status: LeadCampaignStatus = Body(LeadCampaignStatus.ADDED),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
):
    """
    Add multiple leads to a campaign at once.
    
    Only admins and marketers can perform bulk operations.
    """
    result = await bulk_add_leads_to_campaign(
        campaign_id=campaign_id,
        lead_ids=lead_ids,
        user_id=current_user.id,
        status=status,
        notes=notes
    )
    
    return result


@router.get("/leads/{lead_id}", response_model=List[Dict[str, Any]])
async def get_campaigns_for_lead(
    lead_id: int = Path(..., gt=0),
    include_removed: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all campaigns a lead is part of.
    """
    # Check if the user has access to this lead
    # TODO: Implement lead access check
    
    return await get_lead_campaigns(
        lead_id=lead_id,
        include_removed=include_removed
    ) 