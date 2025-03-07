from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime

from app.models.lead import Lead, LeadCreate, LeadUpdate, LeadFilter, LeadNote, LeadNoteCreate, Task, TaskCreate, TaskStatus, CampaignLead, CampaignLeadCreate, LeadCampaignStatus, Campaign
from app.models.database import DBLead, DBCampaignLead, DBLeadNote, DBTask, DBCampaign

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

def add_lead_note(db: Session, lead_id: int, note: LeadNoteCreate, user_id: Optional[int] = None) -> LeadNote:
    """
    Add a note to a lead
    
    Args:
        db: Database session
        lead_id: ID of the lead to add the note to
        note: Note data
        user_id: ID of the user creating the note (optional)
        
    Returns:
        The created note
        
    Raises:
        ValueError: If the lead doesn't exist
    """
    # Check if lead exists
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not db_lead:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Create the note
    db_note = DBLeadNote(
        lead_id=lead_id,
        content=note.content,
        is_private=note.is_private,
        created_by=user_id
    )
    
    # Add to database
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Convert to Pydantic model and return
    return LeadNote(
        id=db_note.id,
        lead_id=db_note.lead_id,
        content=db_note.content,
        is_private=db_note.is_private,
        created_by=db_note.created_by,
        created_at=db_note.created_at
    )

def get_lead_notes(db: Session, lead_id: int, include_private: bool = True) -> List[LeadNote]:
    """
    Get all notes for a lead
    
    Args:
        db: Database session
        lead_id: ID of the lead to get notes for
        include_private: Whether to include private notes
        
    Returns:
        List of notes
    """
    query = db.query(DBLeadNote).filter(DBLeadNote.lead_id == lead_id)
    
    if not include_private:
        query = query.filter(DBLeadNote.is_private == False)
    
    db_notes = query.order_by(desc(DBLeadNote.created_at)).all()
    
    return [
        LeadNote(
            id=note.id,
            lead_id=note.lead_id,
            content=note.content,
            is_private=note.is_private,
            created_by=note.created_by,
            created_at=note.created_at
        )
        for note in db_notes
    ] 

def get_lead_timeline(db: Session, lead_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get the timeline for a lead, including notes, tasks, campaigns, and other activities
    
    Args:
        db: Database session
        lead_id: ID of the lead to get the timeline for
        limit: Maximum number of items to return
        
    Returns:
        List of timeline items
    """
    # Check if lead exists
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not db_lead:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Get notes
    notes = get_lead_notes(db, lead_id)
    
    # Get tasks
    tasks = get_lead_tasks(db, lead_id)
    
    # Get campaign events
    campaign_events = db.query(DBCampaignLead, DBCampaign).join(
        DBCampaign, DBCampaignLead.campaign_id == DBCampaign.id
    ).filter(DBCampaignLead.lead_id == lead_id).all()
    
    # Convert to timeline items
    timeline_items = []
    
    # Add notes to timeline
    for note in notes:
        timeline_items.append({
            "id": f"note_{note.id}",
            "type": "note",
            "description": "Note added",
            "details": note.content,
            "is_private": note.is_private,
            "timestamp": note.created_at,
            "created_by": note.created_by
        })
    
    # Add tasks to timeline
    for task in tasks:
        timeline_items.append({
            "id": f"task_{task.id}",
            "type": "task",
            "description": f"Task created: {task.title}",
            "details": task.description,
            "due_date": task.due_date,
            "priority": task.priority,
            "status": task.status,
            "assigned_to": task.assigned_to,
            "timestamp": task.created_at,
            "created_by": task.created_by
        })
    
    # Add campaign events to timeline
    for campaign_lead, campaign in campaign_events:
        timeline_items.append({
            "id": f"campaign_{campaign.id}_{campaign_lead.status}",
            "type": "campaign",
            "description": f"Campaign status: {campaign_lead.status}",
            "details": campaign_lead.notes,
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "status": campaign_lead.status,
            "timestamp": campaign_lead.updated_at,
            "created_by": campaign_lead.added_by
        })
    
    # In a real app, you would also include other activities like:
    # - Status changes
    # - Emails
    # - Calls
    # - Meetings
    # - etc.
    
    # Sort by timestamp (newest first) and limit
    timeline_items.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline_items[:limit]

def add_lead_task(db: Session, lead_id: int, task: TaskCreate, user_id: Optional[int] = None) -> Task:
    """
    Add a task to a lead
    
    Args:
        db: Database session
        lead_id: ID of the lead to add the task to
        task: Task data
        user_id: ID of the user creating the task (optional)
        
    Returns:
        The created task
        
    Raises:
        ValueError: If the lead doesn't exist
    """
    # Check if lead exists
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not db_lead:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Create the task
    db_task = DBTask(
        lead_id=lead_id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        priority=task.priority,
        status=task.status,
        assigned_to=task.assigned_to,
        created_by=user_id
    )
    
    # Add to database
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Convert to Pydantic model and return
    return Task(
        id=db_task.id,
        lead_id=db_task.lead_id,
        title=db_task.title,
        description=db_task.description,
        due_date=db_task.due_date,
        priority=db_task.priority,
        status=db_task.status,
        assigned_to=db_task.assigned_to,
        created_by=db_task.created_by,
        created_at=db_task.created_at,
        updated_at=db_task.updated_at
    )

def get_lead_tasks(db: Session, lead_id: int, status: Optional[TaskStatus] = None) -> List[Task]:
    """
    Get all tasks for a lead
    
    Args:
        db: Database session
        lead_id: ID of the lead to get tasks for
        status: Filter tasks by status (optional)
        
    Returns:
        List of tasks
    """
    query = db.query(DBTask).filter(DBTask.lead_id == lead_id)
    
    if status:
        query = query.filter(DBTask.status == status)
    
    db_tasks = query.order_by(DBTask.due_date, desc(DBTask.priority)).all()
    
    return [
        Task(
            id=task.id,
            lead_id=task.lead_id,
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            priority=task.priority,
            status=task.status,
            assigned_to=task.assigned_to,
            created_by=task.created_by,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
        for task in db_tasks
    ] 

def update_lead_task(db: Session, task_id: int, task_update: Dict[str, Any]) -> Task:
    """
    Update a lead task
    
    Args:
        db: Database session
        task_id: ID of the task to update
        task_update: Task data to update
        
    Returns:
        The updated task
        
    Raises:
        ValueError: If the task doesn't exist
    """
    # Check if task exists
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise ValueError(f"Task with ID {task_id} not found")
    
    # Update task fields
    for key, value in task_update.items():
        if hasattr(db_task, key) and value is not None:
            setattr(db_task, key, value)
    
    # Update database
    db.commit()
    db.refresh(db_task)
    
    # Convert to Pydantic model and return
    return Task(
        id=db_task.id,
        lead_id=db_task.lead_id,
        title=db_task.title,
        description=db_task.description,
        due_date=db_task.due_date,
        priority=db_task.priority,
        status=db_task.status,
        assigned_to=db_task.assigned_to,
        created_by=db_task.created_by,
        created_at=db_task.created_at,
        updated_at=db_task.updated_at
    )

def delete_lead_task(db: Session, task_id: int) -> None:
    """
    Delete a lead task
    
    Args:
        db: Database session
        task_id: ID of the task to delete
        
    Raises:
        ValueError: If the task doesn't exist
    """
    # Check if task exists
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if not db_task:
        raise ValueError(f"Task with ID {task_id} not found")
    
    # Delete task
    db.delete(db_task)
    db.commit()

def get_lead_campaigns(db: Session, lead_id: int, include_removed: bool = False) -> List[Dict[str, Any]]:
    """
    Get all campaigns for a lead
    
    Args:
        db: Database session
        lead_id: ID of the lead to get campaigns for
        include_removed: Whether to include removed campaigns
        
    Returns:
        List of campaigns
        
    Raises:
        ValueError: If the lead doesn't exist
    """
    # Check if lead exists
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not db_lead:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Get campaign associations
    query = db.query(DBCampaignLead, DBCampaign).join(
        DBCampaign, DBCampaignLead.campaign_id == DBCampaign.id
    ).filter(DBCampaignLead.lead_id == lead_id)
    
    if not include_removed:
        query = query.filter(DBCampaignLead.status != LeadCampaignStatus.UNSUBSCRIBED)
    
    results = query.order_by(desc(DBCampaignLead.added_at)).all()
    
    return [
        {
            "id": campaign.id,
            "name": campaign.name,
            "description": campaign.description,
            "status": campaign.status,
            "lead_status": campaign_lead.status,
            "added_at": campaign_lead.added_at,
            "updated_at": campaign_lead.updated_at,
            "notes": campaign_lead.notes,
            "metadata": campaign_lead.metadata
        }
        for campaign_lead, campaign in results
    ]

def add_lead_to_campaign(
    db: Session, 
    lead_id: int, 
    campaign_data: CampaignLeadCreate, 
    user_id: Optional[int] = None
) -> CampaignLead:
    """
    Add a lead to a campaign
    
    Args:
        db: Database session
        lead_id: ID of the lead to add to the campaign
        campaign_data: Campaign data
        user_id: ID of the user adding the lead to the campaign (optional)
        
    Returns:
        The created campaign-lead association
        
    Raises:
        ValueError: If the lead or campaign doesn't exist
    """
    # Check if lead exists
    db_lead = db.query(DBLead).filter(DBLead.id == lead_id).first()
    if not db_lead:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Check if campaign exists
    db_campaign = db.query(DBCampaign).filter(DBCampaign.id == campaign_data.campaign_id).first()
    if not db_campaign:
        raise ValueError(f"Campaign with ID {campaign_data.campaign_id} not found")
    
    # Check if lead is already in campaign
    existing = db.query(DBCampaignLead).filter(
        DBCampaignLead.campaign_id == campaign_data.campaign_id,
        DBCampaignLead.lead_id == lead_id
    ).first()
    
    if existing:
        # Update existing association
        existing.status = campaign_data.status
        existing.notes = campaign_data.notes
        existing.metadata = campaign_data.metadata
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        db_campaign_lead = existing
    else:
        # Create new association
        db_campaign_lead = DBCampaignLead(
            campaign_id=campaign_data.campaign_id,
            lead_id=lead_id,
            status=campaign_data.status,
            added_by=user_id,
            notes=campaign_data.notes,
            metadata=campaign_data.metadata
        )
        db.add(db_campaign_lead)
        db.commit()
        db.refresh(db_campaign_lead)
    
    # Convert to Pydantic model and return
    return CampaignLead(
        campaign_id=db_campaign_lead.campaign_id,
        lead_id=db_campaign_lead.lead_id,
        status=db_campaign_lead.status,
        added_by=db_campaign_lead.added_by,
        added_at=db_campaign_lead.added_at,
        updated_at=db_campaign_lead.updated_at,
        notes=db_campaign_lead.notes,
        metadata=db_campaign_lead.metadata
    )

def update_lead_campaign_status(
    db: Session, 
    lead_id: int, 
    campaign_id: int, 
    status: LeadCampaignStatus,
    notes: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> CampaignLead:
    """
    Update the status of a lead in a campaign
    
    Args:
        db: Database session
        lead_id: ID of the lead
        campaign_id: ID of the campaign
        status: New status
        notes: Optional notes
        metadata: Optional metadata
        
    Returns:
        The updated campaign-lead association
        
    Raises:
        ValueError: If the lead-campaign association doesn't exist
    """
    # Check if lead-campaign association exists
    db_campaign_lead = db.query(DBCampaignLead).filter(
        DBCampaignLead.campaign_id == campaign_id,
        DBCampaignLead.lead_id == lead_id
    ).first()
    
    if not db_campaign_lead:
        raise ValueError(f"Lead with ID {lead_id} is not in campaign with ID {campaign_id}")
    
    # Update status
    db_campaign_lead.status = status
    if notes is not None:
        db_campaign_lead.notes = notes
    if metadata is not None:
        db_campaign_lead.metadata = metadata
    db_campaign_lead.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_campaign_lead)
    
    # Convert to Pydantic model and return
    return CampaignLead(
        campaign_id=db_campaign_lead.campaign_id,
        lead_id=db_campaign_lead.lead_id,
        status=db_campaign_lead.status,
        added_by=db_campaign_lead.added_by,
        added_at=db_campaign_lead.added_at,
        updated_at=db_campaign_lead.updated_at,
        notes=db_campaign_lead.notes,
        metadata=db_campaign_lead.metadata
    )

def remove_lead_from_campaign(
    db: Session, 
    lead_id: int, 
    campaign_id: int,
    notes: Optional[str] = None
) -> None:
    """
    Remove a lead from a campaign
    
    Args:
        db: Database session
        lead_id: ID of the lead
        campaign_id: ID of the campaign
        notes: Optional notes
        
    Raises:
        ValueError: If the lead-campaign association doesn't exist
    """
    # Check if lead-campaign association exists
    db_campaign_lead = db.query(DBCampaignLead).filter(
        DBCampaignLead.campaign_id == campaign_id,
        DBCampaignLead.lead_id == lead_id
    ).first()
    
    if not db_campaign_lead:
        raise ValueError(f"Lead with ID {lead_id} is not in campaign with ID {campaign_id}")
    
    # Set status to unsubscribed
    db_campaign_lead.status = LeadCampaignStatus.UNSUBSCRIBED
    if notes is not None:
        db_campaign_lead.notes = notes
    db_campaign_lead.updated_at = datetime.utcnow()
    
    db.commit() 