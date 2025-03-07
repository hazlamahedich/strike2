from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime

from app.models.lead import Lead, LeadCreate, LeadUpdate, LeadFilter
from app.models.database import DBLead, DBCampaignLead

def calculate_lead_score(
    email: Optional[str] = None,
    phone: Optional[str] = None,
    company: Optional[str] = None,
    title: Optional[str] = None,
    notes: Optional[str] = None,
    linkedin_url: Optional[str] = None,
    facebook_url: Optional[str] = None,
    twitter_url: Optional[str] = None
) -> float:
    """
    Calculate a lead score based on the provided information.
    
    The score is calculated as follows:
    - Base score: 50 points
    - Email: +10 points
    - Phone: +10 points
    - Company: +10 points
    - Title/Position: +5 points
    - Notes (if longer than 20 chars): +5 points
    - LinkedIn URL: +7 points
    - Facebook URL: +3 points
    - Twitter URL: +3 points
    
    The maximum score is capped at 100.
    """
    score = 50  # Base score
    
    # Add points for basic contact information
    if email:
        score += 10
    if phone:
        score += 10
    if company:
        score += 10
    if title:
        score += 5
    if notes and len(notes) > 20:
        score += 5
    
    # Add points for social media profiles
    if linkedin_url:
        score += 7
    if facebook_url:
        score += 3
    if twitter_url:
        score += 3
    
    # Cap the score at 100
    return min(score, 100)

def create_lead(db: Session, lead: LeadCreate, lead_score: float = None) -> Lead:
    """
    Create a new lead in the database.
    
    Args:
        db: Database session
        lead: Lead data to create
        lead_score: Optional pre-calculated lead score
        
    Returns:
        The created lead
    """
    # If lead score is not provided, calculate it
    if lead_score is None:
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
    
    # Create the database model
    db_lead = DBLead(
        first_name=lead.first_name,
        last_name=lead.last_name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        title=lead.title,
        source=lead.source,
        status=lead.status,
        owner_id=lead.owner_id,
        team_id=lead.team_id,
        custom_fields=lead.custom_fields,
        lead_score=lead_score,
        linkedin_url=lead.linkedin_url,
        facebook_url=lead.facebook_url,
        twitter_url=lead.twitter_url,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Add to database
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    # If campaign_ids are provided, associate the lead with those campaigns
    if lead.campaign_ids:
        for campaign_id in lead.campaign_ids:
            db_campaign_lead = DBCampaignLead(
                campaign_id=campaign_id,
                lead_id=db_lead.id,
                status="added",
                added_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(db_campaign_lead)
        
        db.commit()
    
    # Convert to Pydantic model and return
    return Lead.from_orm(db_lead)

def get_lead(db: Session, lead_id: int) -> Optional[Lead]:
    """
    Get a lead by ID.
    
    Args:
        db: Database session
        lead_id: ID of the lead to retrieve
        
    Returns:
        The lead if found, None otherwise
    """
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if db_lead is None:
        return None
    
    return Lead.from_orm(db_lead)

def update_lead(db: Session, lead_id: int, lead_update: LeadUpdate) -> Lead:
    """
    Update an existing lead.
    
    Args:
        db: Database session
        lead_id: ID of the lead to update
        lead_update: Updated lead data
        
    Returns:
        The updated lead
    """
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if db_lead is None:
        return None
    
    # Update fields if provided
    update_data = lead_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key not in ["add_to_campaigns", "remove_from_campaigns"]:
            setattr(db_lead, key, value)
    
    # Always update the updated_at timestamp
    db_lead.updated_at = datetime.now()
    
    # Handle campaign associations
    if lead_update.add_to_campaigns:
        for campaign_id in lead_update.add_to_campaigns:
            # Check if association already exists
            existing = db.query(DBCampaignLead).filter(
                DBCampaignLead.campaign_id == campaign_id,
                DBCampaignLead.lead_id == lead_id
            ).first()
            
            if not existing:
                db_campaign_lead = DBCampaignLead(
                    campaign_id=campaign_id,
                    lead_id=lead_id,
                    status="added",
                    added_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(db_campaign_lead)
    
    if lead_update.remove_from_campaigns:
        for campaign_id in lead_update.remove_from_campaigns:
            db.query(DBCampaignLead).filter(
                DBCampaignLead.campaign_id == campaign_id,
                DBCampaignLead.lead_id == lead_id
            ).delete()
    
    db.commit()
    db.refresh(db_lead)
    
    return Lead.from_orm(db_lead)

def delete_lead(db: Session, lead_id: int) -> None:
    """
    Delete a lead.
    
    Args:
        db: Database session
        lead_id: ID of the lead to delete
    """
    # First delete campaign associations
    db.query(DBCampaignLead).filter(DBCampaignLead.lead_id == lead_id).delete()
    
    # Then delete the lead
    db.query(DBLead).filter(DBLead.id == lead_id).delete()
    db.commit()

def get_leads(db: Session, skip: int = 0, limit: int = 100, filters: Optional[LeadFilter] = None) -> List[Lead]:
    """
    Get leads with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        filters: Optional filters to apply
        
    Returns:
        List of leads matching the criteria
    """
    query = db.query(DBLead)
    
    # Apply filters if provided
    if filters:
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                (DBLead.first_name.ilike(search_term)) |
                (DBLead.last_name.ilike(search_term)) |
                (DBLead.email.ilike(search_term)) |
                (DBLead.company.ilike(search_term))
            )
        
        if filters.status:
            query = query.filter(DBLead.status.in_(filters.status))
        
        if filters.source:
            query = query.filter(DBLead.source.in_(filters.source))
        
        if filters.owner_id:
            if isinstance(filters.owner_id, list):
                query = query.filter(DBLead.owner_id.in_(filters.owner_id))
            else:
                query = query.filter(DBLead.owner_id == filters.owner_id)
        
        if filters.team_id:
            if isinstance(filters.team_id, list):
                query = query.filter(DBLead.team_id.in_(filters.team_id))
            else:
                query = query.filter(DBLead.team_id == filters.team_id)
        
        if filters.lead_score_min is not None:
            query = query.filter(DBLead.lead_score >= filters.lead_score_min)
        
        if filters.lead_score_max is not None:
            query = query.filter(DBLead.lead_score <= filters.lead_score_max)
        
        if filters.created_after:
            query = query.filter(DBLead.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(DBLead.created_at <= filters.created_before)
        
        if filters.updated_after:
            query = query.filter(DBLead.updated_at >= filters.updated_after)
        
        if filters.updated_before:
            query = query.filter(DBLead.updated_at <= filters.updated_before)
        
        if filters.campaign_id:
            if isinstance(filters.campaign_id, list):
                query = query.join(DBCampaignLead).filter(DBCampaignLead.campaign_id.in_(filters.campaign_id))
            else:
                query = query.join(DBCampaignLead).filter(DBCampaignLead.campaign_id == filters.campaign_id)
    
    # Order by created_at descending (newest first)
    query = query.order_by(desc(DBLead.created_at))
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query and convert to Pydantic models
    db_leads = query.all()
    return [Lead.from_orm(db_lead) for db_lead in db_leads]

def bulk_create_leads(
    db: Session, 
    leads: List[Tuple[LeadCreate, float]], 
    handle_duplicates: str = "skip",
    campaign_ids: Optional[List[int]] = None
) -> List[Lead]:
    """
    Bulk create leads.
    
    Args:
        db: Database session
        leads: List of (LeadCreate, lead_score) tuples
        handle_duplicates: How to handle duplicate emails ("skip", "update", or "create_new")
        campaign_ids: Optional list of campaign IDs to associate all leads with
        
    Returns:
        List of created leads
    """
    created_leads = []
    
    for lead_create, lead_score in leads:
        # Check for duplicates if email is provided
        if lead_create.email and handle_duplicates != "create_new":
            existing_lead = db.query(DBLead).filter(DBLead.email == lead_create.email).first()
            
            if existing_lead:
                if handle_duplicates == "update":
                    # Update the existing lead
                    update_data = lead_create.dict(exclude_unset=True)
                    for key, value in update_data.items():
                        if key != "campaign_ids":
                            setattr(existing_lead, key, value)
                    
                    existing_lead.lead_score = lead_score
                    existing_lead.updated_at = datetime.now()
                    
                    db.commit()
                    db.refresh(existing_lead)
                    created_leads.append(Lead.from_orm(existing_lead))
                
                # If handle_duplicates is "skip", do nothing for this lead
                continue
        
        # Create a new lead
        db_lead = DBLead(
            first_name=lead_create.first_name,
            last_name=lead_create.last_name,
            email=lead_create.email,
            phone=lead_create.phone,
            company=lead_create.company,
            title=lead_create.title,
            source=lead_create.source,
            status=lead_create.status,
            owner_id=lead_create.owner_id,
            team_id=lead_create.team_id,
            custom_fields=lead_create.custom_fields,
            lead_score=lead_score,
            linkedin_url=lead_create.linkedin_url,
            facebook_url=lead_create.facebook_url,
            twitter_url=lead_create.twitter_url,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        
        # Associate with campaigns
        lead_campaign_ids = list(lead_create.campaign_ids or [])
        if campaign_ids:
            lead_campaign_ids.extend(campaign_ids)
        
        if lead_campaign_ids:
            for campaign_id in lead_campaign_ids:
                db_campaign_lead = DBCampaignLead(
                    campaign_id=campaign_id,
                    lead_id=db_lead.id,
                    status="added",
                    added_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(db_campaign_lead)
            
            db.commit()
        
        created_leads.append(Lead.from_orm(db_lead))
    
    return created_leads 