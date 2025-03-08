from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from datetime import datetime
from uuid import UUID, uuid4

class ChatMessageRole(str, Enum):
    """Roles for chat messages"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ChatMessage(BaseModel):
    """Model for a chat message"""
    id: UUID = Field(default_factory=uuid4)
    role: ChatMessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatSession(BaseModel):
    """Model for a chat session"""
    id: UUID = Field(default_factory=uuid4)
    user_id: Optional[UUID] = None  # Can be None for anonymous users
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatRequest(BaseModel):
    """Request model for chat interactions"""
    session_id: Optional[UUID] = None
    message: str
    user_id: Optional[UUID] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatResponse(BaseModel):
    """Response model for chat interactions"""
    session_id: UUID
    message: str
    sources: Optional[List[Dict[str, Any]]] = None
    suggested_follow_ups: Optional[List[str]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class FeedbackType(str, Enum):
    """Types of feedback for chat responses"""
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    PARTIALLY_HELPFUL = "partially_helpful"

class ChatFeedback(BaseModel):
    """Model for feedback on chat responses"""
    session_id: UUID
    message_id: UUID
    feedback_type: FeedbackType
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    user_id: Optional[UUID] = None

class ChatbotQueryType(str, Enum):
    """Types of queries the chatbot can handle"""
    APP_FUNCTIONALITY = "app_functionality"
    DATABASE_QUERY = "database_query"
    TROUBLESHOOTING = "troubleshooting"
    FAQ = "faq"
    GENERAL = "general"

class ChatbotAnalytics(BaseModel):
    """Model for chatbot analytics"""
    total_sessions: int
    total_messages: int
    avg_messages_per_session: float
    top_query_types: Dict[ChatbotQueryType, int]
    avg_satisfaction_score: float
    common_queries: List[str]
    period_start: datetime
    period_end: datetime 