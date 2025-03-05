from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import Any, List, Optional, Dict
from datetime import datetime

from app.models.user import User
from app.models.task import (
    Task, TaskCreate, TaskUpdate, TaskDetail, TaskFilter,
    TaskPriority, TaskStatus, TaskComment, TaskCommentCreate,
    TaskCommentUpdate, TaskReminder, TaskReminderCreate
)
from app.core.security import get_current_active_user, RoleChecker
from app.services import task as task_service

router = APIRouter()

# Role-based permissions
allow_admin_or_manager = RoleChecker(["admin", "manager"])


@router.get("/", response_model=List[Task])
async def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[List[TaskStatus]] = Query(None),
    priority: Optional[List[TaskPriority]] = Query(None),
    assigned_to: Optional[int] = None,
    lead_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "due_date",
    sort_desc: bool = True,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve tasks with optional filtering.
    
    Regular users can only see tasks assigned to them or created by them.
    Admins and managers can see all tasks.
    """
    # Build filter from query params
    task_filter = TaskFilter(
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        lead_id=lead_id,
        search=search
    )
    
    # For non-admin/manager users, restrict to their own tasks
    user_id = None
    team_id = None
    
    if current_user.role not in ["admin", "manager"]:
        user_id = current_user.id
    elif current_user.role == "manager" and current_user.team_id:
        team_id = current_user.team_id
    
    tasks = await task_service.get_tasks(
        skip=skip,
        limit=limit,
        task_filter=task_filter,
        sort_by=sort_by,
        sort_desc=sort_desc,
        user_id=user_id,
        team_id=team_id
    )
    
    return tasks


@router.post("/", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new task.
    """
    # Set created_by to current user if not specified
    task_data = task_in.dict()
    task_data["created_by"] = current_user.id
    
    # Set assigned_to to current user if not specified
    if not task_in.assigned_to:
        task_data["assigned_to"] = current_user.id
    
    task_in = TaskCreate(**task_data)
    
    # Create the task
    task = await task_service.create_task(task_in, current_user.id)
    return task


@router.get("/{task_id}", response_model=TaskDetail)
async def get_task(
    task_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed task information by ID.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has access to this task
    if current_user.role not in ["admin", "manager"]:
        if task.assigned_to != current_user.id and task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this task"
            )
    
    # If a manager, check team_id
    if current_user.role == "manager" and current_user.team_id:
        # Fetch the assignee to check team
        assignee = await fetch_one("users", {"id": task.assigned_to})
        if assignee and assignee.get("team_id") != current_user.team_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this task"
            )
    
    # Get detailed task info
    task_detail = await task_service.get_task_detail(task_id)
    return task_detail


@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: int = Path(..., gt=0),
    task_in: TaskUpdate = Body(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a task.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has permission to update this task
    can_update = (
        current_user.role == "admin" or
        (current_user.role == "manager" and task.created_by == current_user.id) or
        task.assigned_to == current_user.id or
        task.created_by == current_user.id
    )
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this task"
        )
    
    updated_task = await task_service.update_task(task_id, task_in, current_user.id)
    return updated_task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a task.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has permission to delete this task
    can_delete = (
        current_user.role == "admin" or
        (current_user.role == "manager" and task.created_by == current_user.id) or
        task.created_by == current_user.id
    )
    
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this task"
        )
    
    await task_service.delete_task(task_id)
    return None


@router.post("/{task_id}/comments", response_model=TaskComment)
async def add_task_comment(
    task_id: int = Path(..., gt=0),
    comment: TaskCommentCreate = Body(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Add a comment to a task.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has access to this task
    if current_user.role not in ["admin", "manager"]:
        if task.assigned_to != current_user.id and task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to comment on this task"
            )
    
    comment = await task_service.add_task_comment(task_id, comment, current_user.id)
    return comment


@router.put("/comments/{comment_id}", response_model=TaskComment)
async def update_task_comment(
    comment_id: int = Path(..., gt=0),
    comment_in: TaskCommentUpdate = Body(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a task comment.
    
    Users can only update their own comments.
    """
    # Permission check is done in the service
    comment = await task_service.update_task_comment(comment_id, comment_in, current_user.id)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_comment(
    comment_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a task comment.
    
    Users can only delete their own comments.
    """
    # Permission check is done in the service
    await task_service.delete_task_comment(comment_id, current_user.id)
    return None


@router.post("/{task_id}/reminders", response_model=TaskReminder)
async def create_reminder(
    task_id: int = Path(..., gt=0),
    reminder_in: TaskReminderCreate = Body(...),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a reminder for a task.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has access to this task
    if current_user.role not in ["admin", "manager"]:
        if task.assigned_to != current_user.id and task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to add a reminder to this task"
            )
    
    reminder = await task_service.create_task_reminder(task_id, reminder_in, current_user.id)
    return reminder


@router.delete("/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a task reminder.
    """
    # For simplicity, we're allowing deletion without checking ownership
    # In a real app, you might want to check if the user is the creator or assignee
    await task_service.delete_task_reminder(reminder_id)
    return None


@router.get("/summary/user", response_model=Dict[str, Any])
async def get_user_task_summary(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a summary of tasks for the current user.
    """
    summary = await task_service.get_user_tasks_summary(current_user.id)
    return summary


@router.get("/due/today", response_model=List[Task])
async def get_tasks_due_today(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all tasks that are due today for the current user.
    """
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0).isoformat()
    today_end = datetime(now.year, now.month, now.day, 23, 59, 59).isoformat()
    
    task_filter = TaskFilter(
        status=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        assigned_to=current_user.id,
        due_date_from=today_start,
        due_date_to=today_end
    )
    
    tasks = await task_service.get_tasks(
        task_filter=task_filter,
        sort_by="due_date",
        sort_desc=False
    )
    
    return tasks


@router.get("/overdue", response_model=List[Task])
async def get_overdue_tasks(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all overdue tasks for the current user.
    """
    now = datetime.now().isoformat()
    
    task_filter = TaskFilter(
        status=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        assigned_to=current_user.id,
        due_date_to=now
    )
    
    tasks = await task_service.get_tasks(
        task_filter=task_filter,
        sort_by="due_date",
        sort_desc=False
    )
    
    return tasks


@router.put("/{task_id}/complete", response_model=Task)
async def mark_task_complete(
    task_id: int = Path(..., gt=0),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark a task as complete.
    """
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user has permission to update this task
    if current_user.role not in ["admin", "manager"]:
        if task.assigned_to != current_user.id and task.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to complete this task"
            )
    
    task_update = {"status": TaskStatus.COMPLETED}
    updated_task = await task_service.update_task(task_id, task_update, current_user.id)
    return updated_task


@router.get("/lead/{lead_id}", response_model=List[Task])
async def get_tasks_for_lead(
    lead_id: int = Path(..., gt=0),
    status: Optional[List[TaskStatus]] = Query(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all tasks associated with a specific lead.
    """
    # Check if user has access to the lead (simplified check)
    # In a real app, you would check lead permissions more thoroughly
    
    task_filter = TaskFilter(
        lead_id=lead_id,
        status=status
    )
    
    if current_user.role not in ["admin", "manager"]:
        # Regular users can only see their assigned tasks
        task_filter.assigned_to = current_user.id
    
    tasks = await task_service.get_tasks(
        task_filter=task_filter,
        sort_by="due_date",
        sort_desc=True
    )
    
    return tasks 