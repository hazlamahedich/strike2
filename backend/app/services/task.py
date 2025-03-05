from datetime import datetime
from typing import Dict, List, Any, Optional, Union

from fastapi import HTTPException, status

from app.core.database import fetch_one, fetch_all, insert_row, update_row, delete_row
from app.models.task import (
    Task, TaskCreate, TaskUpdate, TaskDetail, TaskFilter,
    TaskComment, TaskCommentCreate, TaskCommentUpdate,
    TaskReminder, TaskReminderCreate
)

async def get_task_by_id(task_id: int) -> Optional[Task]:
    """Get a task by ID"""
    task_data = await fetch_one("tasks", {"id": task_id})
    if not task_data:
        return None
    return Task(**task_data)


async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    task_filter: Optional[TaskFilter] = None,
    sort_by: str = "due_date",
    sort_desc: bool = True,
    user_id: Optional[int] = None,
    team_id: Optional[int] = None
) -> List[Task]:
    """Get all tasks with optional filtering"""
    query_params = {}
    order_by = {sort_by: "desc" if sort_desc else "asc"}

    # Apply filters if provided
    if task_filter:
        if task_filter.search:
            # Simple search implementation for title and description
            search_term = f"%{task_filter.search}%"
            # This is a simplification - actual implementation would depend on the database
            query_params["title"] = {"operator": "ilike", "value": search_term}
            # Add more complex search logic if needed
        
        if task_filter.status:
            statuses = [status.value for status in task_filter.status]
            query_params["status"] = {"operator": "in", "value": statuses}
            
        if task_filter.priority:
            priorities = [priority.value for priority in task_filter.priority]
            query_params["priority"] = {"operator": "in", "value": priorities}
            
        if task_filter.assigned_to:
            if isinstance(task_filter.assigned_to, list):
                query_params["assigned_to"] = {"operator": "in", "value": task_filter.assigned_to}
            else:
                query_params["assigned_to"] = task_filter.assigned_to
                
        if task_filter.created_by:
            if isinstance(task_filter.created_by, list):
                query_params["created_by"] = {"operator": "in", "value": task_filter.created_by}
            else:
                query_params["created_by"] = task_filter.created_by
                
        if task_filter.lead_id:
            if isinstance(task_filter.lead_id, list):
                query_params["lead_id"] = {"operator": "in", "value": task_filter.lead_id}
            else:
                query_params["lead_id"] = task_filter.lead_id
        
        if task_filter.due_date_from:
            query_params["due_date"] = {"operator": "gte", "value": task_filter.due_date_from}
            
        if task_filter.due_date_to:
            if "due_date" in query_params:
                # If due_date_from was already added, create a range
                prev_value = query_params["due_date"]["value"]
                query_params["due_date"] = {
                    "operator": "between", 
                    "value": [prev_value, task_filter.due_date_to]
                }
            else:
                query_params["due_date"] = {"operator": "lte", "value": task_filter.due_date_to}
        
        if task_filter.category:
            if isinstance(task_filter.category, list):
                query_params["category"] = {"operator": "in", "value": task_filter.category}
            else:
                query_params["category"] = task_filter.category
        
        if task_filter.tags:
            # This is a simplification - actual array handling depends on the database
            pass  # Would be implemented based on database capabilities for array operations

    # Team filter (for team visibility)
    if team_id:
        # Fetch user IDs for the team to filter by assigned_to or created_by
        team_users = await fetch_all("users", {"team_id": team_id}, select="id")
        team_user_ids = [user["id"] for user in team_users]
        
        # Tasks assigned to anyone in the team
        if "assigned_to" in query_params:
            # Already filtered by specific assigned_to, no need to add team filter
            pass
        else:
            query_params["assigned_to"] = {"operator": "in", "value": team_user_ids}
    
    # User filter (for personal tasks)
    if user_id and "assigned_to" not in query_params:
        # Only apply user filter if not already filtered by assigned_to
        query_params["assigned_to"] = user_id
    
    tasks_data = await fetch_all(
        "tasks", 
        query_params=query_params, 
        order_by=order_by,
        limit=limit,
        offset=skip
    )
    
    return [Task(**task) for task in tasks_data]


async def create_task(task_in: TaskCreate, user_id: int) -> Task:
    """Create a new task"""
    current_time = datetime.now().isoformat()
    
    task_data = task_in.dict()
    task_data.update({
        "created_by": user_id,
        "created_at": current_time,
        "updated_at": current_time
    })
    
    # Add the task
    result = await insert_row("tasks", task_data)
    created_task = Task(**result)
    
    # Log activity if the task is associated with a lead
    if task_in.lead_id:
        activity_data = {
            "lead_id": task_in.lead_id,
            "user_id": user_id,
            "activity_type": "task_created",
            "activity_id": created_task.id,
            "metadata": {
                "task_title": created_task.title,
                "assigned_to": created_task.assigned_to,
                "priority": created_task.priority.value,
                "due_date": created_task.due_date.isoformat() if created_task.due_date else None
            },
            "created_at": current_time
        }
        await insert_row("activities", activity_data)
    
    # Create a reminder if due_date is set
    if task_in.due_date and task_in.assigned_to:
        reminder_data = {
            "task_id": created_task.id,
            "remind_at": (task_in.due_date - datetime.timedelta(hours=1)).isoformat(),  # 1 hour before due
            "remind_user_id": task_in.assigned_to,
            "notification_sent": False,
            "created_by": user_id,
            "created_at": current_time
        }
        await insert_row("task_reminders", reminder_data)
    
    return created_task


async def update_task(task_id: int, task_in: Union[TaskUpdate, Dict[str, Any]], user_id: int) -> Task:
    """Update an existing task"""
    # Check if task exists
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )
    
    # Prepare update data
    if isinstance(task_in, TaskUpdate):
        update_data = task_in.dict(exclude_unset=True)
    else:
        update_data = task_in
        
    # Add updated_at
    current_time = datetime.now().isoformat()
    update_data["updated_at"] = current_time
    
    # If status changed to completed, add completed info
    if "status" in update_data and update_data["status"] == "completed" and task.status != "completed":
        update_data["completed_at"] = current_time
        update_data["completed_by"] = user_id
        
    # Update the task
    result = await update_row("tasks", task_id, update_data)
    updated_task = Task(**result)
    
    # Log activity if the task is associated with a lead
    if updated_task.lead_id:
        # Only log significant changes
        significant_fields = ["status", "priority", "due_date", "assigned_to"]
        significant_change = False
        
        for field in significant_fields:
            if field in update_data:
                significant_change = True
                break
        
        if significant_change:
            activity_data = {
                "lead_id": updated_task.lead_id,
                "user_id": user_id,
                "activity_type": "task_updated",
                "activity_id": task_id,
                "metadata": {
                    "task_title": updated_task.title,
                    "updated_fields": list(update_data.keys()),
                    "status": updated_task.status.value if hasattr(updated_task.status, "value") else updated_task.status,
                    "completed": "status" in update_data and update_data["status"] == "completed"
                },
                "created_at": current_time
            }
            await insert_row("activities", activity_data)
    
    # Update reminders if due_date changed
    if "due_date" in update_data and updated_task.assigned_to:
        # Delete existing reminders
        await delete_row("task_reminders", task_id, "task_id")
        
        # Create new reminder
        if updated_task.due_date:
            reminder_data = {
                "task_id": task_id,
                "remind_at": (updated_task.due_date - datetime.timedelta(hours=1)).isoformat(),  # 1 hour before due
                "remind_user_id": updated_task.assigned_to,
                "notification_sent": False,
                "created_by": user_id,
                "created_at": current_time
            }
            await insert_row("task_reminders", reminder_data)
    
    return updated_task


async def delete_task(task_id: int) -> bool:
    """Delete a task"""
    # Check if task exists
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )
    
    # Delete associated reminders and comments
    await delete_row("task_reminders", task_id, "task_id")
    await delete_row("task_comments", task_id, "task_id")
    
    # Delete the task
    return await delete_row("tasks", task_id)


async def get_task_detail(task_id: int) -> TaskDetail:
    """Get detailed task information including assignee and lead details"""
    # Get task data
    task_data = await fetch_one("tasks", {"id": task_id})
    if not task_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )
    
    # Get assignee info if available
    assignee = None
    if task_data.get("assigned_to"):
        assignee_data = await fetch_one(
            "users", 
            {"id": task_data["assigned_to"]}, 
            select="id, name, email, role"
        )
        if assignee_data:
            assignee = assignee_data
    
    # Get creator info
    creator = None
    if task_data.get("created_by"):
        creator_data = await fetch_one(
            "users", 
            {"id": task_data["created_by"]}, 
            select="id, name, email, role"
        )
        if creator_data:
            creator = creator_data
    
    # Get lead info if available
    lead = None
    if task_data.get("lead_id"):
        lead_data = await fetch_one(
            "leads", 
            {"id": task_data["lead_id"]}, 
            select="id, first_name, last_name, email, company, status"
        )
        if lead_data:
            lead = lead_data
    
    # Get reminders
    reminders = await fetch_all("task_reminders", {"task_id": task_id})
    
    # Get comments
    comments = await fetch_all(
        "task_comments", 
        {"task_id": task_id},
        order_by={"created_at": "asc"}
    )
    
    # Enrich comments with user info
    for comment in comments:
        user_data = await fetch_one(
            "users", 
            {"id": comment["user_id"]}, 
            select="id, name, email, role"
        )
        if user_data:
            comment["user"] = user_data
    
    # Construct task detail
    task_detail = TaskDetail(
        **task_data,
        assignee=assignee,
        creator=creator,
        lead=lead,
        reminders=reminders,
        comments=comments
    )
    
    return task_detail


async def add_task_comment(task_id: int, comment_in: TaskCommentCreate, user_id: int) -> TaskComment:
    """Add a comment to a task"""
    # Check if task exists
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )
    
    current_time = datetime.now().isoformat()
    
    # Create comment
    comment_data = {
        "task_id": task_id,
        "user_id": user_id,
        "comment": comment_in.comment,
        "created_at": current_time,
        "updated_at": current_time
    }
    
    result = await insert_row("task_comments", comment_data)
    
    # Log activity if task is associated with a lead
    if task.lead_id:
        activity_data = {
            "lead_id": task.lead_id,
            "user_id": user_id,
            "activity_type": "task_comment_added",
            "activity_id": result["id"],
            "metadata": {
                "task_id": task_id,
                "task_title": task.title,
                "comment_preview": comment_in.comment[:50] + ("..." if len(comment_in.comment) > 50 else "")
            },
            "created_at": current_time
        }
        await insert_row("activities", activity_data)
    
    return TaskComment(**result)


async def update_task_comment(comment_id: int, comment_in: TaskCommentUpdate, user_id: int) -> TaskComment:
    """Update a task comment"""
    # Check if comment exists and belongs to the user
    comment = await fetch_one("task_comments", {"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found"
        )
    
    # Check if user is the comment author
    if comment["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments"
        )
    
    # Prepare update data
    update_data = comment_in.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now().isoformat()
    
    # Update the comment
    result = await update_row("task_comments", comment_id, update_data)
    
    return TaskComment(**result)


async def delete_task_comment(comment_id: int, user_id: int) -> bool:
    """Delete a task comment"""
    # Check if comment exists and belongs to the user
    comment = await fetch_one("task_comments", {"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found"
        )
    
    # Check if user is the comment author
    if comment["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments"
        )
    
    # Delete the comment
    return await delete_row("task_comments", comment_id)


async def create_task_reminder(task_id: int, reminder_in: TaskReminderCreate, user_id: int) -> TaskReminder:
    """Create a reminder for a task"""
    # Check if task exists
    task = await get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )
    
    # Determine the user to remind
    remind_user_id = reminder_in.remind_user_id or task.assigned_to
    if not remind_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user specified for the reminder"
        )
    
    # Create reminder
    reminder_data = {
        "task_id": task_id,
        "remind_at": reminder_in.remind_at.isoformat(),
        "remind_user_id": remind_user_id,
        "notification_sent": False,
        "created_by": user_id,
        "created_at": datetime.now().isoformat()
    }
    
    result = await insert_row("task_reminders", reminder_data)
    
    return TaskReminder(**result)


async def delete_task_reminder(reminder_id: int) -> bool:
    """Delete a task reminder"""
    # Check if reminder exists
    reminder = await fetch_one("task_reminders", {"id": reminder_id})
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reminder with id {reminder_id} not found"
        )
    
    # Delete the reminder
    return await delete_row("task_reminders", reminder_id)


async def get_pending_reminders() -> List[Dict[str, Any]]:
    """Get all pending reminders that should be sent"""
    current_time = datetime.now().isoformat()
    
    # Get all unsent reminders where remind_at <= current_time
    reminders = await fetch_all(
        "task_reminders",
        {
            "notification_sent": False,
            "remind_at": {"operator": "lte", "value": current_time}
        }
    )
    
    result = []
    for reminder in reminders:
        # Get task info
        task = await get_task_by_id(reminder["task_id"])
        if task and task.status != "completed" and task.status != "cancelled":
            # Only send reminders for active tasks
            user = await fetch_one(
                "users",
                {"id": reminder["remind_user_id"]},
                select="id, name, email"
            )
            
            if user:
                result.append({
                    "reminder": reminder,
                    "task": task.dict(),
                    "user": user
                })
    
    return result


async def mark_reminder_sent(reminder_id: int) -> bool:
    """Mark a reminder as sent"""
    await update_row("task_reminders", reminder_id, {"notification_sent": True})
    return True


async def get_user_tasks_summary(user_id: int) -> Dict[str, Any]:
    """Get a summary of tasks for a user"""
    # Get counts by status
    pending_count = len(await fetch_all("tasks", {"assigned_to": user_id, "status": "pending"}))
    in_progress_count = len(await fetch_all("tasks", {"assigned_to": user_id, "status": "in_progress"}))
    completed_count = len(await fetch_all("tasks", {"assigned_to": user_id, "status": "completed"}))
    
    # Get overdue tasks
    current_time = datetime.now().isoformat()
    overdue_tasks = await fetch_all(
        "tasks",
        {
            "assigned_to": user_id,
            "status": {"operator": "in", "value": ["pending", "in_progress"]},
            "due_date": {"operator": "lt", "value": current_time}
        }
    )
    
    # Get upcoming tasks (due in the next 24 hours)
    tomorrow = (datetime.now() + datetime.timedelta(days=1)).isoformat()
    upcoming_tasks = await fetch_all(
        "tasks",
        {
            "assigned_to": user_id,
            "status": {"operator": "in", "value": ["pending", "in_progress"]},
            "due_date": {"operator": "between", "value": [current_time, tomorrow]}
        }
    )
    
    return {
        "pending_count": pending_count,
        "in_progress_count": in_progress_count,
        "completed_count": completed_count,
        "overdue_count": len(overdue_tasks),
        "upcoming_count": len(upcoming_tasks),
        "overdue_tasks": [Task(**task).dict() for task in overdue_tasks],
        "upcoming_tasks": [Task(**task).dict() for task in upcoming_tasks]
    } 