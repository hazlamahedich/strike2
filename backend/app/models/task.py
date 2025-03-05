from pydantic import BaseModel, Field, validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class TaskPriority(str, Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, Enum):
    """Task status options"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DEFERRED = "deferred"

class TaskType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    FOLLOW_UP = "follow_up"
    GENERAL = "general"

class TaskBase(BaseModel):
    """Base model for tasks with common fields"""
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    task_type: TaskType = TaskType.GENERAL
    assigned_to: Optional[int] = None  # User ID
    lead_id: Optional[int] = None  # Can be associated with a lead
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class TaskCreate(TaskBase):
    """Model for creating a new task"""
    created_by: int

class TaskUpdate(BaseModel):
    """Model for updating an existing task"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    task_type: Optional[TaskType] = None
    assigned_to: Optional[int] = None
    lead_id: Optional[int] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None
    reminder: Optional[datetime] = None
    
    @model_validator(mode='after')
    def validate_reminder_time(self) -> 'TaskUpdate':
        reminder = getattr(self, 'reminder', None)
        due_date = getattr(self, 'due_date', None)
        if reminder is not None and due_date is not None:
            if reminder > due_date:
                raise ValueError('Reminder cannot be after due date')
        return self

class Task(TaskBase):
    """Complete task model with system fields"""
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    completed_by: Optional[int] = None
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class TaskDetail(Task):
    """Task with additional details like assignee and lead information"""
    assignee: Optional[Dict[str, Any]] = None
    lead: Optional[Dict[str, Any]] = None
    creator: Optional[Dict[str, Any]] = None
    reminders: List[Dict[str, Any]] = Field(default_factory=list)
    comments: List[Dict[str, Any]] = Field(default_factory=list)
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class TaskFilter(BaseModel):
    """Model for filtering tasks"""
    search: Optional[str] = None
    status: Optional[List[TaskStatus]] = None
    priority: Optional[List[TaskPriority]] = None
    task_type: Optional[List[TaskType]] = None
    assigned_to: Optional[Union[int, List[int]]] = None
    created_by: Optional[Union[int, List[int]]] = None
    lead_id: Optional[Union[int, List[int]]] = None
    due_date_from: Optional[datetime] = None
    due_date_to: Optional[datetime] = None
    category: Optional[Union[str, List[str]]] = None
    tags: Optional[List[str]] = None

class TaskComment(BaseModel):
    """Model for task comments"""
    id: Optional[int] = None
    task_id: int
    user_id: int
    comment: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class TaskCommentCreate(BaseModel):
    """Model for creating a task comment"""
    comment: str

class TaskCommentUpdate(BaseModel):
    """Model for updating a task comment"""
    comment: Optional[str] = None

class TaskReminder(BaseModel):
    """Model for task reminders"""
    id: Optional[int] = None
    task_id: int
    remind_at: datetime
    remind_user_id: int
    notification_sent: bool = False
    created_by: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class TaskReminderCreate(BaseModel):
    """Model for creating a task reminder"""
    remind_at: datetime
    remind_user_id: Optional[int] = None  # If not provided, will default to the assigned user

class TaskNote(BaseModel):
    """Model for task notes"""
    task_id: int
    content: str
    created_by: int
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class TaskNoteCreate(BaseModel):
    content: str

class TaskNoteResponse(TaskNote):
    id: int
    created_at: datetime
    updated_at: datetime
    creator: Dict[str, Any] 