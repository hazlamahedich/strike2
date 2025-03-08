from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Path
from typing import Any, List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.models.user import User
from app.core.security import get_current_active_user, get_current_admin_user, RoleChecker
from app.services.low_probability_lead_workflow import low_probability_workflow

router = APIRouter()

# Role-based permissions
allow_admin_or_marketer = RoleChecker(["admin", "marketer"])

class WorkflowRunResponse(BaseModel):
    """Response model for workflow run"""
    campaign_id: int
    new_leads_identified: int
    new_leads_added: int
    leads_rescored: int
    leads_upgraded: int
    leads_remained: int
    leads_completed: int
    timestamp: str

class WorkflowStatsResponse(BaseModel):
    """Response model for workflow statistics"""
    campaign_id: int
    total_leads: int
    active_leads: int
    upgraded_leads: int
    lost_leads: int
    average_cycles_to_upgrade: float
    conversion_rate: float
    last_run: str

@router.post("/run", response_model=WorkflowRunResponse)
async def run_workflow(
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Run the low probability lead workflow.
    
    This will:
    1. Identify new low probability leads
    2. Add them to the nurturing campaign
    3. Re-score existing leads in the workflow
    4. Transition leads to appropriate next steps
    
    Returns statistics about the workflow run.
    """
    try:
        result = await low_probability_workflow.run_workflow()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running workflow: {str(e)}"
        )

@router.get("/stats", response_model=WorkflowStatsResponse)
async def get_workflow_stats(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get statistics about the low probability lead workflow.
    """
    try:
        # Set up campaign to ensure it exists
        campaign_id = await low_probability_workflow.setup_campaign()
        
        # Query for workflow statistics
        query = """
        WITH campaign_stats AS (
            SELECT
                COUNT(*) as total_leads,
                SUM(CASE WHEN status IN ('added', 'contacted', 'responded') THEN 1 ELSE 0 END) as active_leads,
                SUM(CASE WHEN status = 'qualified' AND metadata->>'workflow_stage' = 'graduated' THEN 1 ELSE 0 END) as upgraded_leads,
                SUM(CASE WHEN status = 'rejected' AND metadata->>'workflow_stage' = 'lost' THEN 1 ELSE 0 END) as lost_leads,
                AVG(CASE WHEN status = 'qualified' AND metadata->>'workflow_stage' = 'graduated' 
                    THEN CAST(metadata->>'nurturing_cycle' AS INTEGER) ELSE NULL END) as avg_cycles_to_upgrade,
                CASE 
                    WHEN COUNT(*) > 0 THEN 
                        CAST(SUM(CASE WHEN status = 'qualified' AND metadata->>'workflow_stage' = 'graduated' THEN 1 ELSE 0 END) AS FLOAT) / 
                        COUNT(*) * 100
                    ELSE 0
                END as conversion_rate,
                MAX(updated_at) as last_update
            FROM campaign_leads
            WHERE campaign_id = :campaign_id
        )
        SELECT * FROM campaign_stats
        """
        
        from app.core.database import fetch_one
        stats = await fetch_one(query, {"campaign_id": campaign_id})
        
        if not stats:
            # Return default stats if no data yet
            return {
                "campaign_id": campaign_id,
                "total_leads": 0,
                "active_leads": 0,
                "upgraded_leads": 0,
                "lost_leads": 0,
                "average_cycles_to_upgrade": 0.0,
                "conversion_rate": 0.0,
                "last_run": datetime.now().isoformat()
            }
        
        return {
            "campaign_id": campaign_id,
            "total_leads": stats.get("total_leads", 0),
            "active_leads": stats.get("active_leads", 0),
            "upgraded_leads": stats.get("upgraded_leads", 0),
            "lost_leads": stats.get("lost_leads", 0),
            "average_cycles_to_upgrade": stats.get("avg_cycles_to_upgrade", 0.0) or 0.0,
            "conversion_rate": stats.get("conversion_rate", 0.0) or 0.0,
            "last_run": stats.get("last_update", datetime.now()).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting workflow stats: {str(e)}"
        )

@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_workflow_leads(
    status: Optional[str] = Query(None, description="Filter by lead status in the workflow"),
    stage: Optional[str] = Query(None, description="Filter by workflow stage"),
    cycle: Optional[int] = Query(None, description="Filter by nurturing cycle"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get leads in the low probability workflow with filtering options.
    """
    try:
        # Set up campaign to ensure it exists
        campaign_id = await low_probability_workflow.setup_campaign()
        
        # Build query
        query = """
        SELECT 
            cl.lead_id,
            cl.status,
            cl.metadata,
            cl.added_at,
            cl.updated_at,
            l.first_name,
            l.last_name,
            l.email,
            l.company,
            l.lead_score
        FROM campaign_leads cl
        JOIN leads l ON cl.lead_id = l.id
        WHERE cl.campaign_id = :campaign_id
        """
        
        params = {"campaign_id": campaign_id}
        
        # Add filters
        if status:
            query += " AND cl.status = :status"
            params["status"] = status
            
        if stage:
            query += " AND cl.metadata->>'workflow_stage' = :stage"
            params["stage"] = stage
            
        if cycle is not None:
            query += " AND CAST(cl.metadata->>'nurturing_cycle' AS INTEGER) = :cycle"
            params["cycle"] = cycle
            
        # Add pagination
        query += " ORDER BY cl.updated_at DESC LIMIT :limit OFFSET :skip"
        params["limit"] = limit
        params["skip"] = skip
        
        # Execute query
        from app.core.database import fetch_all
        results = await fetch_all(query, params)
        
        # Format results
        leads = []
        for row in results:
            metadata = row.get("metadata", {})
            leads.append({
                "lead_id": row["lead_id"],
                "name": f"{row['first_name']} {row['last_name']}",
                "email": row["email"],
                "company": row["company"],
                "lead_score": row["lead_score"],
                "status": row["status"],
                "workflow_stage": metadata.get("workflow_stage", "unknown"),
                "nurturing_cycle": metadata.get("nurturing_cycle", 0),
                "added_at": row["added_at"].isoformat() if row["added_at"] else None,
                "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
                "next_scoring_date": metadata.get("next_scoring_date")
            })
            
        return leads
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting workflow leads: {str(e)}"
        )

@router.post("/leads/{lead_id}/manual-upgrade", response_model=Dict[str, Any])
async def manually_upgrade_lead(
    lead_id: int = Path(..., gt=0),
    notes: Optional[str] = Body(None),
    current_user: User = Depends(get_current_active_user),
    _: User = Depends(allow_admin_or_marketer)
) -> Any:
    """
    Manually upgrade a lead from the low probability workflow to regular follow-up.
    """
    try:
        # Set up campaign to ensure it exists
        campaign_id = await low_probability_workflow.setup_campaign()
        
        # Get current campaign lead data
        from app.services import lead as lead_service
        campaign_lead = await lead_service.get_lead_campaign(lead_id, campaign_id)
        
        if not campaign_lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead {lead_id} not found in low probability workflow"
            )
            
        metadata = campaign_lead.get("metadata", {})
        current_cycle = metadata.get("nurturing_cycle", 0)
        
        # Update lead campaign status
        await lead_service.update_lead_campaign_status(
            lead_id=lead_id,
            campaign_id=campaign_id,
            status="qualified",
            notes=notes or "Manually upgraded from low probability workflow",
            metadata={
                **metadata,
                "workflow_stage": "manually_upgraded",
                "upgraded_by": current_user.id,
                "upgraded_at": datetime.now().isoformat()
            }
        )
        
        # Create follow-up task
        task_data = {
            "title": "Follow up with manually upgraded lead",
            "description": "This lead was manually upgraded from the low probability workflow. Please follow up directly.",
            "due_date": datetime.now() + timedelta(days=1),
            "priority": "high",
            "status": "pending",
            "assigned_to": current_user.id
        }
        
        task = await lead_service.add_lead_task(lead_id, task_data)
        
        return {
            "success": True,
            "lead_id": lead_id,
            "message": "Lead successfully upgraded",
            "task_id": task.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error upgrading lead: {str(e)}"
        ) 