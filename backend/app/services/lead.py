import json
import csv
import io
import pandas as pd
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import UploadFile, HTTPException, status
from pydantic import ValidationError

from app.models.lead import LeadCreate, LeadUpdate, Lead, LeadDetail, LeadFilter
from app.core.database import fetch_one, fetch_all, insert_row, update_row, delete_row
from app.services.campaign import add_lead_to_campaign, get_lead_campaigns

async def get_lead_by_id(lead_id: int) -> Optional[Lead]:
    """
    Get a lead by ID.
    """
    lead_data = await fetch_one("leads", {"id": lead_id})
    if not lead_data:
        return None
    
    return Lead(**lead_data)

async def get_leads(
    skip: int = 0, 
    limit: int = 100, 
    lead_filter: Optional[LeadFilter] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True
) -> List[Lead]:
    """
    Get multiple leads with filtering options.
    """
    # Build query params from filter
    query_params = {}
    if lead_filter:
        if lead_filter.status:
            query_params["status"] = {"operator": "in", "value": lead_filter.status}
        if lead_filter.source:
            query_params["source"] = {"operator": "in", "value": lead_filter.source}
        if lead_filter.owner_id:
            query_params["owner_id"] = lead_filter.owner_id
        if lead_filter.team_id:
            query_params["team_id"] = lead_filter.team_id
        if lead_filter.lead_score_min is not None:
            query_params["lead_score"] = {"operator": "gte", "value": lead_filter.lead_score_min}
        if lead_filter.lead_score_max is not None:
            query_params["lead_score"] = {"operator": "lte", "value": lead_filter.lead_score_max}
        if lead_filter.created_after:
            query_params["created_at"] = {"operator": "gte", "value": lead_filter.created_after}
        if lead_filter.created_before:
            query_params["created_at"] = {"operator": "lte", "value": lead_filter.created_before}
        if lead_filter.search:
            # For Supabase, we'd use a more sophisticated search query
            # This is a simplification
            query_params["_search"] = {"operator": "ilike", "value": f"%{lead_filter.search}%"}
        
        # New - filter by campaign ID
        if lead_filter.campaign_id:
            # This requires a different approach since we need to join with campaign_leads
            # First, get all lead_ids for this campaign
            relations = await fetch_all(
                "campaign_leads",
                {"campaign_id": lead_filter.campaign_id, "status": {"operator": "neq", "value": "REMOVED"}}
            )
            
            if not relations:
                # No leads in this campaign, return empty list
                return []
            
            # Get lead IDs
            lead_ids = [relation["lead_id"] for relation in relations]
            
            # Add to query params
            query_params["id"] = {"operator": "in", "value": lead_ids}
    
    # Build order by
    order_by = {sort_by: "desc" if sort_desc else "asc"}
    
    # Fetch leads
    leads_data = await fetch_all(
        "leads", 
        query_params=query_params, 
        limit=limit, 
        offset=skip,
        order_by=order_by
    )
    
    # Convert to Lead objects
    return [Lead(**lead_data) for lead_data in leads_data]

async def create_lead(lead_in: LeadCreate, user_id: Optional[int] = None) -> Lead:
    """
    Create a new lead.
    """
    # Prepare lead data
    lead_data = lead_in.dict(exclude={"campaign_ids"})
    lead_data.update({
        "lead_score": 0.0,  # Default score
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    })
    
    # Insert the lead
    new_lead_data = await insert_row("leads", lead_data)
    
    # Record the activity
    activity_data = {
        "lead_id": new_lead_data["id"],
        "user_id": user_id or lead_data.get("owner_id"),
        "activity_type": "lead_created",
        "activity_id": None,
        "metadata": {
            "source": lead_data.get("source"),
            "status": lead_data.get("status")
        },
        "created_at": datetime.now().isoformat()
    }
    await insert_row("activities", activity_data)
    
    # Add to campaigns if specified
    if hasattr(lead_in, "campaign_ids") and lead_in.campaign_ids:
        for campaign_id in lead_in.campaign_ids:
            try:
                await add_lead_to_campaign(
                    campaign_id=campaign_id,
                    lead_id=new_lead_data["id"],
                    user_id=user_id or lead_data.get("owner_id") or 1,  # Default to system user if no owner
                    notes=f"Added during lead creation"
                )
            except HTTPException as e:
                # Log error but continue - don't fail lead creation if campaign assignment fails
                print(f"Error adding lead {new_lead_data['id']} to campaign {campaign_id}: {str(e)}")
    
    # Return the created lead
    return Lead(**new_lead_data)

async def update_lead(lead_id: int, lead_in: Union[LeadUpdate, Dict[str, Any]], user_id: Optional[int] = None) -> Lead:
    """
    Update a lead.
    """
    # Get current lead
    current_lead_data = await fetch_one("leads", {"id": lead_id})
    if not current_lead_data:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Extract campaign-related fields
    add_to_campaigns = None
    remove_from_campaigns = None
    
    # Prepare update data
    if isinstance(lead_in, LeadUpdate):
        update_data = lead_in.dict(exclude_unset=True)
        
        # Handle campaign operations
        if hasattr(lead_in, "add_to_campaigns") and lead_in.add_to_campaigns is not None:
            add_to_campaigns = lead_in.add_to_campaigns
            if "add_to_campaigns" in update_data:
                del update_data["add_to_campaigns"]
        
        if hasattr(lead_in, "remove_from_campaigns") and lead_in.remove_from_campaigns is not None:
            remove_from_campaigns = lead_in.remove_from_campaigns
            if "remove_from_campaigns" in update_data:
                del update_data["remove_from_campaigns"]
    else:
        update_data = lead_in.copy()
        
        # Handle campaign operations
        if "add_to_campaigns" in update_data:
            add_to_campaigns = update_data.pop("add_to_campaigns")
        
        if "remove_from_campaigns" in update_data:
            remove_from_campaigns = update_data.pop("remove_from_campaigns")
    
    # Add updated_at timestamp
    update_data["updated_at"] = datetime.now().isoformat()
    
    # Update the lead
    updated_lead_data = await update_row("leads", lead_id, update_data)
    
    # Handle campaign operations
    if add_to_campaigns:
        for campaign_id in add_to_campaigns:
            try:
                await add_lead_to_campaign(
                    campaign_id=campaign_id,
                    lead_id=lead_id,
                    user_id=user_id or updated_lead_data.get("owner_id") or 1,
                    notes=f"Added during lead update"
                )
            except HTTPException as e:
                if e.status_code != status.HTTP_400_BAD_REQUEST:  # Ignore if already in campaign
                    print(f"Error adding lead {lead_id} to campaign {campaign_id}: {str(e)}")
    
    if remove_from_campaigns:
        from app.services.campaign import remove_lead_from_campaign
        for campaign_id in remove_from_campaigns:
            try:
                await remove_lead_from_campaign(
                    campaign_id=campaign_id,
                    lead_id=lead_id,
                    user_id=user_id or updated_lead_data.get("owner_id") or 1,
                    notes=f"Removed during lead update"
                )
            except HTTPException as e:
                print(f"Error removing lead {lead_id} from campaign {campaign_id}: {str(e)}")
    
    # Record status change if applicable
    if "status" in update_data and update_data["status"] != current_lead_data["status"]:
        history_data = {
            "lead_id": lead_id,
            "stage_id": update_data["status"],
            "previous_stage_id": current_lead_data["status"],
            "moved_by": user_id or update_data.get("owner_id", current_lead_data["owner_id"]),
            "moved_at": datetime.now().isoformat(),
            "notes": update_data.get("status_change_notes")
        }
        await insert_row("lead_stage_history", history_data)
        
        # Also record as activity
        activity_data = {
            "lead_id": lead_id,
            "user_id": user_id or update_data.get("owner_id", current_lead_data["owner_id"]),
            "activity_type": "status_changed",
            "activity_id": None,
            "metadata": {
                "from_status": current_lead_data["status"],
                "to_status": update_data["status"]
            },
            "created_at": datetime.now().isoformat()
        }
        await insert_row("activities", activity_data)
    
    # Return the updated lead
    return Lead(**updated_lead_data)

async def delete_lead(lead_id: int) -> bool:
    """
    Delete a lead.
    """
    # In a real application, we might want to soft delete or archive
    # Remove from all campaigns first
    try:
        # Remove lead from all campaign relationships
        await delete_row("campaign_leads", lead_id, "lead_id")
    except Exception as e:
        print(f"Error removing lead {lead_id} from campaigns: {str(e)}")
    
    # Delete the lead
    deleted = await delete_row("leads", lead_id)
    return deleted

async def get_lead_detail(lead_id: int, include_campaign_data: bool = True) -> LeadDetail:
    """
    Get detailed information about a lead.
    """
    # Get lead data
    lead_data = await fetch_one("leads", {"id": lead_id})
    if not lead_data:
        raise ValueError(f"Lead with ID {lead_id} not found")
    
    # Get related data
    tasks = await fetch_all("tasks", {"lead_id": lead_id})
    emails = await fetch_all("emails", {"lead_id": lead_id})
    calls = await fetch_all("calls", {"lead_id": lead_id})
    sms = await fetch_all("sms", {"lead_id": lead_id})
    meetings = await fetch_all("meetings", {"lead_id": lead_id})
    notes = await fetch_all("notes", {"lead_id": lead_id})
    activities = await fetch_all("activities", {"lead_id": lead_id}, order_by={"created_at": "desc"})
    
    # Get owner info if available
    owner = None
    if lead_data.get("owner_id"):
        owner_data = await fetch_one("users", {"id": lead_data["owner_id"]})
        if owner_data:
            owner = {
                "id": owner_data["id"],
                "name": owner_data["name"],
                "email": owner_data["email"]
            }
    
    # Build timeline of all interactions
    timeline = await get_lead_timeline(lead_id)
    
    # Get campaign data if requested
    campaigns = []
    if include_campaign_data:
        campaigns = await get_lead_campaigns(lead_id=lead_id)
    
    # Create the lead detail
    return LeadDetail(
        **lead_data,
        tasks=tasks,
        emails=emails,
        calls=calls,
        meetings=meetings,
        notes=notes,
        activities=activities,
        owner=owner,
        timeline=timeline,
        campaigns=campaigns
    )

async def get_lead_timeline(lead_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get a timeline of all interactions with a lead.
    """
    # Get all relevant activities
    activities = await fetch_all("activities", {"lead_id": lead_id}, limit=limit, order_by={"created_at": "desc"})
    
    # Get all communication records
    emails = await fetch_all("emails", {"lead_id": lead_id})
    calls = await fetch_all("calls", {"lead_id": lead_id})
    sms = await fetch_all("sms", {"lead_id": lead_id})
    meetings = await fetch_all("meetings", {"lead_id": lead_id})
    notes = await fetch_all("notes", {"lead_id": lead_id})
    tasks = await fetch_all("tasks", {"lead_id": lead_id})
    
    # Build the timeline
    timeline = []
    
    # Add activities
    for activity in activities:
        timeline.append({
            "type": "activity",
            "subtype": activity["activity_type"],
            "timestamp": activity["created_at"].isoformat() if isinstance(activity["created_at"], datetime) else activity["created_at"],
            "data": activity["metadata"],
            "user_id": activity["user_id"]
        })
    
    # Add emails
    for email in emails:
        timeline.append({
            "type": "email",
            "subtype": "sent" if email["status"] in ["sent", "delivered", "opened", "clicked"] else "draft",
            "timestamp": (email["sent_at"] or email["created_at"]).isoformat() if isinstance(email.get("sent_at") or email["created_at"], datetime) else (email.get("sent_at") or email["created_at"]),
            "data": {
                "subject": email["subject"],
                "body_preview": email["body"][:100] + "..." if len(email["body"]) > 100 else email["body"],
                "status": email["status"],
                "sentiment_score": email.get("sentiment_score")
            },
            "user_id": email["user_id"]
        })
    
    # Add calls
    for call in calls:
        timeline.append({
            "type": "call",
            "subtype": call["direction"],
            "timestamp": (call["call_time"] or call["created_at"]).isoformat(),
            "data": {
                "duration": call["duration"],
                "status": call["status"],
                "notes": call["notes"],
                "sentiment_score": call.get("sentiment_score")
            },
            "user_id": call["user_id"]
        })
    
    # Add SMS
    for msg in sms:
        timeline.append({
            "type": "sms",
            "subtype": "sent" if msg["status"] in ["sent", "delivered"] else "draft",
            "timestamp": (msg["sent_at"] or msg["created_at"]).isoformat(),
            "data": {
                "body_preview": msg["body"][:100] + "..." if len(msg["body"]) > 100 else msg["body"],
                "status": msg["status"],
                "sentiment_score": msg.get("sentiment_score")
            },
            "user_id": msg["user_id"]
        })
    
    # Add meetings
    for meeting in meetings:
        timeline.append({
            "type": "meeting",
            "subtype": meeting["status"],
            "timestamp": meeting["start_time"].isoformat(),
            "data": {
                "title": meeting["title"],
                "description": meeting["description"],
                "location": meeting["location"],
                "end_time": meeting["end_time"].isoformat()
            },
            "user_id": meeting["created_by"]
        })
    
    # Add notes
    for note in notes:
        timeline.append({
            "type": "note",
            "subtype": "note",
            "timestamp": note["created_at"].isoformat(),
            "data": {
                "body": note["body"]
            },
            "user_id": note["created_by"]
        })
    
    # Add tasks
    for task in tasks:
        timeline.append({
            "type": "task",
            "subtype": task["status"],
            "timestamp": task["created_at"].isoformat(),
            "data": {
                "title": task["title"],
                "description": task["description"],
                "due_date": task["due_date"].isoformat() if task["due_date"] else None,
                "priority": task["priority"]
            },
            "user_id": task["created_by"]
        })
    
    # Sort by timestamp (newest first)
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Limit the result
    return timeline[:limit]

async def import_leads(
    file: UploadFile,
    field_mapping: Dict[str, str],
    handle_duplicates: str = "skip",
    user_id: Optional[int] = None,
    team_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Import leads from CSV/Excel file.
    """
    try:
        # Read the file
        contents = await file.read()
        file_ext = file.filename.split(".")[-1].lower()
        
        # Parse based on file type
        if file_ext == "csv":
            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        elif file_ext in ["xls", "xlsx"]:
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Map fields
        leads_to_import = []
        for _, row in df.iterrows():
            lead_data = {}
            for target_field, source_field in field_mapping.items():
                if source_field in row:
                    lead_data[target_field] = row[source_field]
            
            # Add default values
            if not lead_data.get("owner_id") and user_id:
                lead_data["owner_id"] = user_id
            if not lead_data.get("team_id") and team_id:
                lead_data["team_id"] = team_id
            
            leads_to_import.append(lead_data)
        
        # Process the leads
        leads_created = 0
        leads_updated = 0
        leads_skipped = 0
        errors = []
        
        for lead_data in leads_to_import:
            try:
                # Check for required fields
                if "first_name" not in lead_data or "last_name" not in lead_data:
                    errors.append(f"Missing required fields for lead: {lead_data}")
                    leads_skipped += 1
                    continue
                
                # Check for duplicates
                duplicate = None
                if "email" in lead_data and lead_data["email"]:
                    duplicate = await fetch_one("leads", {"email": lead_data["email"]})
                
                if duplicate:
                    if handle_duplicates == "skip":
                        leads_skipped += 1
                        continue
                    elif handle_duplicates == "update":
                        # Update the existing lead
                        lead_data["updated_at"] = datetime.now()
                        await update_row("leads", duplicate["id"], lead_data)
                        leads_updated += 1
                        continue
                    # If "create_new", fall through to create a new lead
                
                # Create lead
                lead_create = LeadCreate(**lead_data)
                await create_lead(lead_create)
                leads_created += 1
                
            except ValidationError as e:
                errors.append(f"Validation error for lead: {lead_data}, error: {str(e)}")
                leads_skipped += 1
            except Exception as e:
                errors.append(f"Error processing lead: {lead_data}, error: {str(e)}")
                leads_skipped += 1
        
        return {
            "success": True,
            "leads_created": leads_created,
            "leads_updated": leads_updated,
            "leads_skipped": leads_skipped,
            "errors": errors
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def export_leads(
    lead_ids: Optional[List[int]] = None,
    filters: Optional[Dict[str, Any]] = None,
    export_format: str = "csv",
    include_fields: Optional[List[str]] = None,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    team_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Export leads to CSV/Excel.
    """
    try:
        # Build query based on lead_ids or filters
        query_params = {}
        if lead_ids:
            query_params["id"] = {"operator": "in", "value": lead_ids}
        elif filters:
            # Map filters to query params
            for key, value in filters.items():
                if key == "status" and value:
                    query_params["status"] = {"operator": "in", "value": value}
                elif key == "source" and value:
                    query_params["source"] = {"operator": "in", "value": value}
                elif key == "owner_id" and value:
                    query_params["owner_id"] = value
                elif key == "team_id" and value:
                    query_params["team_id"] = value
        
        # Apply permissions
        if user_role not in ["admin", "manager"]:
            query_params["owner_id"] = user_id
        elif user_role == "manager" and team_id:
            query_params["team_id"] = team_id
        
        # Fetch leads
        leads_data = await fetch_all("leads", query_params=query_params)
        
        # Prepare field list
        if not include_fields:
            include_fields = [
                "id", "first_name", "last_name", "email", "phone", 
                "company", "title", "source", "status", "lead_score",
                "created_at", "updated_at"
            ]
        
        # Filter fields
        filtered_leads = []
        for lead in leads_data:
            filtered_lead = {}
            for field in include_fields:
                if field in lead:
                    if isinstance(lead[field], datetime):
                        filtered_lead[field] = lead[field].isoformat()
                    else:
                        filtered_lead[field] = lead[field]
            filtered_leads.append(filtered_lead)
        
        # Create file
        if export_format == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=include_fields)
            writer.writeheader()
            writer.writerows(filtered_leads)
            file_content = output.getvalue()
            content_type = "text/csv"
        elif export_format == "xlsx":
            # Use pandas for Excel export
            df = pd.DataFrame(filtered_leads)
            output = io.BytesIO()
            df.to_excel(output, index=False)
            file_content = output.getvalue()
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            raise ValueError(f"Unsupported export format: {export_format}")
        
        return {
            "success": True,
            "content": file_content,
            "content_type": content_type,
            "filename": f"leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        } 