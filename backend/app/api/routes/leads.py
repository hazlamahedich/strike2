from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.models.lead import Lead, LeadCreate, LeadUpdate, LeadImport, LeadDetail, LeadFilter
from app.core.database import get_db
from app.services.lead_service import (
    create_lead,
    get_lead,
    update_lead,
    delete_lead,
    get_leads,
    bulk_create_leads,
    calculate_lead_score
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