from typing import Dict, Any, Optional
import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

async def insert_row(table: str, data: Dict[str, Any], returning: str = "id") -> Any:
    """
    Insert a row into a table and return a value
    
    Args:
        table: Table name
        data: Dictionary of column:value pairs
        returning: Column to return from the inserted row
        
    Returns:
        Value of the returning column
    """
    try:
        # Get Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            # Try local Supabase
            supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
            supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Insert data
        response = supabase.table(table).insert(data).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0][returning]
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to insert row: {str(e)}")
        return None

async def insert_related_activity(
    activity_data: Dict[str, Any], 
    parent_activity_id: Optional[int] = None,
    group_id: Optional[str] = None
) -> Optional[int]:
    """
    Insert an activity with relationship to parent activity or group
    
    Args:
        activity_data: Dictionary containing activity data
        parent_activity_id: ID of the parent activity (optional)
        group_id: Group identifier for related activities (optional)
        
    Returns:
        ID of the inserted activity or None if insertion failed
    """
    try:
        # Add relationship fields if provided
        if parent_activity_id:
            activity_data["parent_activity_id"] = parent_activity_id
            
        if group_id:
            activity_data["group_id"] = group_id
            
        # Insert the activity
        return await insert_row("activities", activity_data)
        
    except Exception as e:
        logger.error(f"Failed to insert related activity: {str(e)}")
        return None

async def get_call_activity_id(call_sid: str) -> Optional[int]:
    """
    Get the activity ID for a call based on its SID
    
    Args:
        call_sid: The Twilio Call SID
        
    Returns:
        Activity ID or None if not found
    """
    try:
        # Get Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            # Try local Supabase
            supabase_url = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
            supabase_key = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # First, get the call ID from the calls table
        call_response = supabase.table("calls").select("id").eq("call_sid", call_sid).execute()
        
        if not call_response.data or len(call_response.data) == 0:
            return None
            
        call_id = call_response.data[0]["id"]
        
        # Now get the activity ID from the activities table
        activity_response = supabase.table("activities").select("id").eq("activity_type", "calls").eq("activity_id", call_id).execute()
        
        if activity_response.data and len(activity_response.data) > 0:
            return activity_response.data[0]["id"]
            
        return None
        
    except Exception as e:
        logger.error(f"Failed to get call activity ID: {str(e)}")
        return None 