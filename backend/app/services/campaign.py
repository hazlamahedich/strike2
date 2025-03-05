from datetime import datetime
from typing import Dict, List, Any, Optional, Union

from fastapi import HTTPException, status

from app.core.database import fetch_one, fetch_all, insert_row, update_row, delete_row
from app.models.campaign import (
    Campaign, 
    CampaignCreate, 
    CampaignUpdate, 
    CampaignDetail,
    CampaignFilter
)
from app.models.campaign_lead import (
    CampaignLead, 
    CampaignLeadCreate, 
    CampaignLeadUpdate,
    LeadCampaignStatus
)


async def get_campaign_by_id(campaign_id: int) -> Optional[Campaign]:
    """Get a campaign by ID"""
    campaign_data = await fetch_one("campaigns", {"id": campaign_id})
    if not campaign_data:
        return None
    return Campaign(**campaign_data)


async def get_campaigns(
    skip: int = 0, 
    limit: int = 100, 
    campaign_filter: Optional[CampaignFilter] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True,
    user_id: Optional[int] = None,
    team_id: Optional[int] = None
) -> List[Campaign]:
    """Get all campaigns with optional filtering"""
    query_params = {}
    order_by = {sort_by: "desc" if sort_desc else "asc"}

    # Apply filters if provided
    if campaign_filter:
        if campaign_filter.search:
            # Simple search implementation - can be enhanced with Supabase text search
            search_term = f"%{campaign_filter.search}%"
            query_params["name"] = {"operator": "ilike", "value": search_term}
        
        if campaign_filter.status:
            statuses = [status.value for status in campaign_filter.status]
            query_params["status"] = {"operator": "in", "value": statuses}
            
        if campaign_filter.type:
            types = [type.value for type in campaign_filter.type]
            query_params["type"] = {"operator": "in", "value": types}
            
        if campaign_filter.created_by:
            query_params["created_by"] = campaign_filter.created_by
            
        if campaign_filter.tags:
            # This is a simplification - actual implementation would need to handle array overlap
            pass
            
    # Team filter (for team visibility)
    if team_id:
        query_params["team_id"] = team_id
        
    campaigns_data = await fetch_all(
        "campaigns", 
        query_params=query_params, 
        order_by=order_by,
        limit=limit,
        offset=skip
    )
    
    return [Campaign(**campaign) for campaign in campaigns_data]


async def create_campaign(campaign_in: CampaignCreate, user_id: int) -> Campaign:
    """Create a new campaign"""
    current_time = datetime.now().isoformat()
    
    campaign_data = campaign_in.dict()
    campaign_data.update({
        "created_by": user_id,
        "created_at": current_time,
        "updated_at": current_time,
        "metrics": {},
        "lead_count": 0
    })
    
    result = await insert_row("campaigns", campaign_data)
    return Campaign(**result)


async def update_campaign(campaign_id: int, campaign_in: Union[CampaignUpdate, Dict[str, Any]]) -> Campaign:
    """Update an existing campaign"""
    # Check if campaign exists
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Prepare update data
    if isinstance(campaign_in, CampaignUpdate):
        update_data = campaign_in.dict(exclude_unset=True)
    else:
        update_data = campaign_in
        
    update_data["updated_at"] = datetime.now().isoformat()
    
    # Update campaign
    result = await update_row("campaigns", campaign_id, update_data)
    return Campaign(**result)


async def delete_campaign(campaign_id: int) -> bool:
    """Delete a campaign"""
    # Check if campaign exists
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # First delete all campaign-lead relationships
    await delete_row("campaign_leads", campaign_id, "campaign_id")
    
    # Then delete the campaign
    return await delete_row("campaigns", campaign_id)


async def get_campaign_detail(campaign_id: int) -> CampaignDetail:
    """Get detailed campaign information including sample leads and activity"""
    # Get campaign base info
    campaign_data = await fetch_one("campaigns", {"id": campaign_id})
    if not campaign_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Get owner info
    owner_data = await fetch_one("users", {"id": campaign_data["created_by"]}, 
                                select="id, name, email, role")
    
    # Get sample leads (limit to 5)
    lead_relations = await fetch_all(
        "campaign_leads",
        {"campaign_id": campaign_id},
        limit=5,
        order_by={"created_at": "desc"}
    )
    
    lead_ids = [relation["lead_id"] for relation in lead_relations]
    lead_sample = []
    
    if lead_ids:
        lead_data = await fetch_all(
            "leads",
            {"id": {"operator": "in", "value": lead_ids}},
            select="id, first_name, last_name, email, company, status, lead_score"
        )
        lead_sample = lead_data
    
    # Get recent activities
    recent_activities = await fetch_all(
        "activities",
        {"metadata->>'campaign_id'": str(campaign_id)},
        limit=10,
        order_by={"created_at": "desc"}
    )
    
    # Construct campaign detail
    campaign_detail = CampaignDetail(
        **campaign_data,
        owner=owner_data,
        lead_sample=lead_sample,
        recent_activities=recent_activities
    )
    
    return campaign_detail


async def add_lead_to_campaign(
    campaign_id: int, 
    lead_id: int, 
    user_id: int,
    status: LeadCampaignStatus = LeadCampaignStatus.ADDED,
    notes: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> CampaignLead:
    """Add a lead to a campaign"""
    # Check if campaign exists
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Check if lead exists
    lead = await fetch_one("leads", {"id": lead_id})
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} not found"
        )
    
    # Check if relationship already exists
    existing = await fetch_one(
        "campaign_leads", 
        {"campaign_id": campaign_id, "lead_id": lead_id}
    )
    
    if existing:
        # If the lead was previously removed from the campaign, update its status
        if existing["status"] == LeadCampaignStatus.REMOVED.value:
            update_data = {
                "status": status.value,
                "updated_at": datetime.now().isoformat()
            }
            if notes:
                update_data["notes"] = notes
            if metadata:
                update_data["metadata"] = metadata
            
            result = await update_row("campaign_leads", existing["id"], update_data)
            
            # Update lead count in campaign if necessary
            await update_campaign_lead_count(campaign_id)
            
            return CampaignLead(**result)
        else:
            # Lead is already in this campaign
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lead with id {lead_id} is already in campaign with id {campaign_id}"
            )
    
    # Create relationship
    current_time = datetime.now().isoformat()
    campaign_lead_data = {
        "campaign_id": campaign_id,
        "lead_id": lead_id,
        "status": status.value,
        "added_by": user_id,
        "notes": notes or "",
        "metadata": metadata or {},
        "created_at": current_time,
        "updated_at": current_time,
        "open_count": 0,
        "click_count": 0,
        "response_count": 0
    }
    
    result = await insert_row("campaign_leads", campaign_lead_data)
    
    # Update lead count in campaign
    await update_campaign_lead_count(campaign_id)
    
    # Log activity
    await insert_row("activities", {
        "lead_id": lead_id,
        "user_id": user_id,
        "activity_type": "campaign_added",
        "activity_id": result["id"],
        "metadata": {
            "campaign_id": campaign_id,
            "campaign_name": campaign.name
        },
        "created_at": current_time
    })
    
    return CampaignLead(**result)


async def remove_lead_from_campaign(
    campaign_id: int, 
    lead_id: int, 
    user_id: int,
    notes: Optional[str] = None
) -> bool:
    """Remove a lead from a campaign (soft delete by setting status to REMOVED)"""
    # Check if relationship exists
    existing = await fetch_one(
        "campaign_leads", 
        {"campaign_id": campaign_id, "lead_id": lead_id}
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} is not in campaign with id {campaign_id}"
        )
    
    # Update status to REMOVED
    update_data = {
        "status": LeadCampaignStatus.REMOVED.value,
        "updated_at": datetime.now().isoformat()
    }
    
    if notes:
        if existing["notes"]:
            update_data["notes"] = f"{existing['notes']} | Removed: {notes}"
        else:
            update_data["notes"] = f"Removed: {notes}"
    
    await update_row("campaign_leads", existing["id"], update_data)
    
    # Update lead count in campaign
    await update_campaign_lead_count(campaign_id)
    
    # Log activity
    campaign = await get_campaign_by_id(campaign_id)
    current_time = datetime.now().isoformat()
    
    await insert_row("activities", {
        "lead_id": lead_id,
        "user_id": user_id,
        "activity_type": "campaign_removed",
        "activity_id": existing["id"],
        "metadata": {
            "campaign_id": campaign_id,
            "campaign_name": campaign.name
        },
        "created_at": current_time
    })
    
    return True


async def update_campaign_lead_status(
    campaign_id: int, 
    lead_id: int, 
    status: LeadCampaignStatus,
    user_id: int,
    notes: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> CampaignLead:
    """Update the status of a lead in a campaign"""
    # Check if relationship exists
    existing = await fetch_one(
        "campaign_leads", 
        {"campaign_id": campaign_id, "lead_id": lead_id}
    )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with id {lead_id} is not in campaign with id {campaign_id}"
        )
    
    # Update status
    update_data = {
        "status": status.value,
        "updated_at": datetime.now().isoformat()
    }
    
    if notes:
        if existing["notes"]:
            update_data["notes"] = f"{existing['notes']} | {notes}"
        else:
            update_data["notes"] = notes
    
    if metadata:
        existing_metadata = existing.get("metadata", {})
        merged_metadata = {**existing_metadata, **metadata}
        update_data["metadata"] = merged_metadata
    
    result = await update_row("campaign_leads", existing["id"], update_data)
    
    # Log activity
    campaign = await get_campaign_by_id(campaign_id)
    current_time = datetime.now().isoformat()
    
    await insert_row("activities", {
        "lead_id": lead_id,
        "user_id": user_id,
        "activity_type": "campaign_status_updated",
        "activity_id": existing["id"],
        "metadata": {
            "campaign_id": campaign_id,
            "campaign_name": campaign.name,
            "previous_status": existing["status"],
            "new_status": status.value
        },
        "created_at": current_time
    })
    
    return CampaignLead(**result)


async def get_campaign_leads(
    campaign_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[List[LeadCampaignStatus]] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True
) -> List[Dict[str, Any]]:
    """Get all leads in a campaign with optional filtering"""
    # Check if campaign exists
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Build query params
    query_params = {"campaign_id": campaign_id}
    
    if status:
        statuses = [s.value for s in status]
        query_params["status"] = {"operator": "in", "value": statuses}
    else:
        # By default, exclude removed leads
        query_params["status"] = {"operator": "neq", "value": LeadCampaignStatus.REMOVED.value}
    
    # Get campaign-lead relationships
    relations = await fetch_all(
        "campaign_leads",
        query_params=query_params,
        order_by={sort_by: "desc" if sort_desc else "asc"},
        limit=limit,
        offset=skip
    )
    
    # If no leads found, return empty list
    if not relations:
        return []
    
    # Get leads data
    lead_ids = [relation["lead_id"] for relation in relations]
    leads_data = await fetch_all(
        "leads",
        {"id": {"operator": "in", "value": lead_ids}},
        select="id, first_name, last_name, email, company, status, lead_score, created_at, updated_at"
    )
    
    # Create a mapping of lead ID to lead data
    leads_map = {lead["id"]: lead for lead in leads_data}
    
    # Combine lead data with campaign-lead relationship data
    result = []
    for relation in relations:
        lead_id = relation["lead_id"]
        if lead_id in leads_map:
            combined = {
                **relation,
                "lead": leads_map[lead_id]
            }
            result.append(combined)
    
    return result


async def get_lead_campaigns(
    lead_id: int,
    include_removed: bool = False
) -> List[Dict[str, Any]]:
    """Get all campaigns a lead is part of"""
    # Build query params
    query_params = {"lead_id": lead_id}
    
    if not include_removed:
        query_params["status"] = {"operator": "neq", "value": LeadCampaignStatus.REMOVED.value}
    
    # Get campaign-lead relationships
    relations = await fetch_all(
        "campaign_leads",
        query_params=query_params,
        order_by={"created_at": "desc"}
    )
    
    # If no campaigns found, return empty list
    if not relations:
        return []
    
    # Get campaigns data
    campaign_ids = [relation["campaign_id"] for relation in relations]
    campaigns_data = await fetch_all(
        "campaigns",
        {"id": {"operator": "in", "value": campaign_ids}},
        select="id, name, description, type, status, start_date, end_date, created_at, metrics"
    )
    
    # Create a mapping of campaign ID to campaign data
    campaigns_map = {campaign["id"]: campaign for campaign in campaigns_data}
    
    # Combine campaign data with campaign-lead relationship data
    result = []
    for relation in relations:
        campaign_id = relation["campaign_id"]
        if campaign_id in campaigns_map:
            combined = {
                **relation,
                "campaign": campaigns_map[campaign_id]
            }
            result.append(combined)
    
    return result


async def update_campaign_lead_count(campaign_id: int) -> None:
    """Update the lead count in a campaign"""
    # Count active leads in the campaign (excluding REMOVED)
    lead_count = await fetch_all(
        "campaign_leads",
        {
            "campaign_id": campaign_id,
            "status": {"operator": "neq", "value": LeadCampaignStatus.REMOVED.value}
        },
        select="COUNT(*) as count"
    )
    
    count = lead_count[0]["count"] if lead_count else 0
    
    # Update campaign lead count
    await update_row("campaigns", campaign_id, {"lead_count": count})


async def bulk_add_leads_to_campaign(
    campaign_id: int,
    lead_ids: List[int],
    user_id: int,
    status: LeadCampaignStatus = LeadCampaignStatus.ADDED,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """Add multiple leads to a campaign at once"""
    # Check if campaign exists
    campaign = await get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with id {campaign_id} not found"
        )
    
    # Process each lead
    results = {
        "success": 0,
        "already_in_campaign": 0,
        "lead_not_found": 0,
        "error": 0
    }
    
    current_time = datetime.now().isoformat()
    
    for lead_id in lead_ids:
        try:
            # Check if lead exists
            lead = await fetch_one("leads", {"id": lead_id})
            if not lead:
                results["lead_not_found"] += 1
                continue
            
            # Check if relationship already exists
            existing = await fetch_one(
                "campaign_leads", 
                {"campaign_id": campaign_id, "lead_id": lead_id}
            )
            
            if existing:
                # If removed, update status
                if existing["status"] == LeadCampaignStatus.REMOVED.value:
                    update_data = {
                        "status": status.value,
                        "updated_at": current_time
                    }
                    if notes:
                        update_data["notes"] = notes
                    
                    await update_row("campaign_leads", existing["id"], update_data)
                    results["success"] += 1
                else:
                    # Already in campaign
                    results["already_in_campaign"] += 1
                continue
            
            # Create relationship
            campaign_lead_data = {
                "campaign_id": campaign_id,
                "lead_id": lead_id,
                "status": status.value,
                "added_by": user_id,
                "notes": notes or "",
                "metadata": {},
                "created_at": current_time,
                "updated_at": current_time,
                "open_count": 0,
                "click_count": 0,
                "response_count": 0
            }
            
            await insert_row("campaign_leads", campaign_lead_data)
            
            # Log activity
            await insert_row("activities", {
                "lead_id": lead_id,
                "user_id": user_id,
                "activity_type": "campaign_added",
                "activity_id": campaign_id,
                "metadata": {
                    "campaign_id": campaign_id,
                    "campaign_name": campaign.name,
                    "bulk_operation": True
                },
                "created_at": current_time
            })
            
            results["success"] += 1
            
        except Exception as e:
            results["error"] += 1
    
    # Update lead count in campaign
    await update_campaign_lead_count(campaign_id)
    
    return results 