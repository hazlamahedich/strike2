from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.models.lead import Lead, LeadCreate, LeadUpdate, LeadImport, LeadDetail, LeadFilter, LeadNote, LeadNoteCreate, Task, TaskCreate, TaskStatus, CampaignLead, CampaignLeadCreate, LeadCampaignStatus
from app.core.database import get_db
from app.services.lead_service import (
    create_lead,
    get_lead,
    update_lead,
    delete_lead,
    get_leads,
    bulk_create_leads,
    calculate_lead_score,
    add_lead_note,
    get_lead_notes,
    get_lead_timeline,
    add_lead_task,
    get_lead_tasks,
    update_lead_task,
    delete_lead_task,
    get_lead_campaigns,
    add_lead_to_campaign,
    update_lead_campaign_status,
    remove_lead_from_campaign
)

router = APIRouter(prefix="/leads", tags=["leads"])

@router.post("/", response_model=Lead, status_code=status.HTTP_201_CREATED)
def create_new_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    """
    Create a new lead.
    """
    try:
        # Calculate lead score based on provided data
        lead_score = calculate_lead_score(
            email=lead.email,
            phone=lead.phone,
            company=lead.company,
            title=lead.title,
            notes=lead.custom_fields.get("notes", ""),
            linkedin_url=lead.linkedin_url,
            facebook_url=lead.facebook_url,
            twitter_url=lead.twitter_url
        )
        
        # Create the lead with the calculated score
        return create_lead(db=db, lead=lead, lead_score=lead_score)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lead with this email already exists"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lead: {str(e)}"
        )

@router.get("/{lead_id}", response_model=LeadDetail)
def read_lead(lead_id: int, db: Session = Depends(get_db)):
    """
    Get a specific lead by ID.
    """
    lead = get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found"
        )
    return lead

@router.put("/{lead_id}", response_model=Lead)
def update_existing_lead(lead_id: int, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    """
    Update an existing lead.
    """
    lead = get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found"
        )
    
    # If lead score is not provided, calculate it
    if lead_update.lead_score is None:
        # Get the updated fields or use existing ones
        email = lead_update.email or lead.email
        phone = lead_update.phone or lead.phone
        company = lead_update.company or lead.company
        title = lead_update.title or lead.title
        notes = lead_update.custom_fields.get("notes", "") if lead_update.custom_fields else lead.custom_fields.get("notes", "")
        linkedin_url = lead_update.linkedin_url or lead.linkedin_url
        facebook_url = lead_update.facebook_url or lead.facebook_url
        twitter_url = lead_update.twitter_url or lead.twitter_url
        
        lead_update.lead_score = calculate_lead_score(
            email=email,
            phone=phone,
            company=company,
            title=title,
            notes=notes,
            linkedin_url=linkedin_url,
            facebook_url=facebook_url,
            twitter_url=twitter_url
        )
    
    try:
        return update_lead(db=db, lead_id=lead_id, lead_update=lead_update)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update lead: {str(e)}"
        )

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_lead(lead_id: int, db: Session = Depends(get_db)):
    """
    Delete a lead.
    """
    lead = get_lead(db, lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found"
        )
    
    delete_lead(db=db, lead_id=lead_id)
    return {"detail": "Lead deleted successfully"}

@router.get("/", response_model=List[Lead])
def read_leads(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all leads with optional filtering.
    """
    filters = LeadFilter(
        search=search,
        status=[status] if status else None,
        source=[source] if source else None
    )
    return get_leads(db, skip=skip, limit=limit, filters=filters)

@router.post("/bulk", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def bulk_create_new_leads(import_data: LeadImport, db: Session = Depends(get_db)):
    """
    Bulk create leads from imported data.
    """
    try:
        # Process each lead in the import data
        leads_to_create = []
        for lead_data in import_data.data:
            # Map fields according to the provided mapping
            mapped_data = {}
            for target_field, source_field in import_data.field_mapping.items():
                if source_field in lead_data:
                    mapped_data[target_field] = lead_data[source_field]
            
            # Create a LeadCreate object
            lead_create = LeadCreate(**mapped_data)
            
            # Calculate lead score
            lead_score = calculate_lead_score(
                email=lead_create.email,
                phone=lead_create.phone,
                company=lead_create.company,
                title=lead_create.title,
                notes=lead_create.custom_fields.get("notes", ""),
                linkedin_url=lead_create.linkedin_url,
                facebook_url=lead_create.facebook_url,
                twitter_url=lead_create.twitter_url
            )
            
            leads_to_create.append((lead_create, lead_score))
        
        # Bulk create the leads
        created_leads = bulk_create_leads(
            db=db, 
            leads=leads_to_create,
            handle_duplicates=import_data.handle_duplicates,
            campaign_ids=import_data.campaign_ids
        )
        
        return {
            "success": True,
            "created_count": len(created_leads),
            "leads": created_leads
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk create leads: {str(e)}"
        )

@router.post("/{lead_id}/notes", response_model=LeadNote, status_code=status.HTTP_201_CREATED)
def add_note_to_lead(
    lead_id: int, 
    note: LeadNoteCreate, 
    db: Session = Depends(get_db),
    # In a real app, you would get the user_id from the auth token
    # user_id: int = Depends(get_current_user_id)
):
    """
    Add a note to a lead
    """
    try:
        # In a real app, pass the user_id from the auth token
        return add_lead_note(db=db, lead_id=lead_id, note=note, user_id=None)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add note: {str(e)}"
        )

@router.get("/{lead_id}/notes", response_model=List[LeadNote])
def get_lead_notes_endpoint(
    lead_id: int, 
    include_private: bool = True,
    db: Session = Depends(get_db)
):
    """
    Get all notes for a lead
    """
    try:
        return get_lead_notes(db=db, lead_id=lead_id, include_private=include_private)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notes: {str(e)}"
        )

@router.get("/{lead_id}/timeline", response_model=List[Dict[str, Any]])
def get_lead_timeline_endpoint(
    lead_id: int, 
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get the timeline for a lead
    """
    try:
        return get_lead_timeline(db=db, lead_id=lead_id, limit=limit)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get timeline: {str(e)}"
        )

@router.post("/{lead_id}/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def add_task_to_lead(
    lead_id: int, 
    task: TaskCreate, 
    db: Session = Depends(get_db),
    # In a real app, you would get the user_id from the auth token
    # user_id: int = Depends(get_current_user_id)
):
    """
    Add a task to a lead
    """
    try:
        # In a real app, pass the user_id from the auth token
        return add_lead_task(db=db, lead_id=lead_id, task=task, user_id=None)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add task: {str(e)}"
        )

@router.get("/{lead_id}/tasks", response_model=List[Task])
def get_lead_tasks_endpoint(
    lead_id: int, 
    status: Optional[TaskStatus] = None,
    db: Session = Depends(get_db)
):
    """
    Get all tasks for a lead
    """
    try:
        return get_lead_tasks(db=db, lead_id=lead_id, status=status)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tasks: {str(e)}"
        )

@router.put("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: int, 
    task_update: Dict[str, Any] = Body(...), 
    db: Session = Depends(get_db)
):
    """
    Update a task
    """
    try:
        return update_lead_task(db=db, task_id=task_id, task_update=task_update)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}"
        )

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db)
):
    """
    Delete a task
    """
    try:
        delete_lead_task(db=db, task_id=task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}"
        )

@router.get("/{lead_id}/campaigns", response_model=List[Dict[str, Any]])
def get_lead_campaigns_endpoint(
    lead_id: int, 
    include_removed: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get all campaigns for a lead
    """
    try:
        return get_lead_campaigns(db=db, lead_id=lead_id, include_removed=include_removed)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get campaigns: {str(e)}"
        )

@router.post("/{lead_id}/campaigns", response_model=CampaignLead, status_code=status.HTTP_201_CREATED)
def add_lead_to_campaign_endpoint(
    lead_id: int, 
    campaign_data: CampaignLeadCreate, 
    db: Session = Depends(get_db),
    # In a real app, you would get the user_id from the auth token
    # user_id: int = Depends(get_current_user_id)
):
    """
    Add a lead to a campaign
    """
    try:
        # In a real app, pass the user_id from the auth token
        return add_lead_to_campaign(db=db, lead_id=lead_id, campaign_data=campaign_data, user_id=None)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add lead to campaign: {str(e)}"
        )

@router.put("/{lead_id}/campaigns/{campaign_id}/status", response_model=CampaignLead)
def update_lead_campaign_status_endpoint(
    lead_id: int, 
    campaign_id: int, 
    status: LeadCampaignStatus,
    notes: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Update the status of a lead in a campaign
    """
    try:
        return update_lead_campaign_status(
            db=db, 
            lead_id=lead_id, 
            campaign_id=campaign_id, 
            status=status,
            notes=notes,
            metadata=metadata
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update lead campaign status: {str(e)}"
        )

@router.delete("/{lead_id}/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_lead_from_campaign_endpoint(
    lead_id: int, 
    campaign_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Remove a lead from a campaign
    """
    try:
        remove_lead_from_campaign(db=db, lead_id=lead_id, campaign_id=campaign_id, notes=notes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove lead from campaign: {str(e)}"
        ) 