from fastapi import APIRouter, HTTPException, Depends, Body
from typing import Dict, Any, List, Optional
from uuid import UUID

from app.models.chatbot import (
    ChatRequest, ChatResponse, ChatFeedback, ChatSession, ChatMessage
)
from app.services.chatbot import ChatbotService
from app.core.security import get_current_active_user, get_optional_user
from app.models.user import User

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user)
) -> ChatResponse:
    """
    Process a chat message and get a response from the AI assistant.
    
    This endpoint allows both authenticated and anonymous users to interact with the chatbot.
    """
    # Set the user_id if the user is authenticated
    if current_user:
        request.user_id = current_user.id
    
    # Process the message
    response = await ChatbotService.process_message(request)
    return response

@router.post("/feedback", response_model=Dict[str, Any])
async def provide_feedback(
    feedback: ChatFeedback,
    current_user: Optional[User] = Depends(get_optional_user)
) -> Dict[str, Any]:
    """
    Provide feedback on a chat response.
    
    This feedback is used to improve the chatbot over time.
    """
    # Set the user_id if the user is authenticated
    if current_user:
        feedback.user_id = current_user.id
    
    # Process the feedback
    result = await ChatbotService.provide_feedback(feedback)
    return result

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> ChatSession:
    """
    Get a chat session by ID.
    
    This endpoint requires authentication and will only return sessions owned by the current user.
    """
    session = await ChatbotService.get_session(session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/sessions", response_model=List[ChatSession])
async def list_sessions(
    current_user: User = Depends(get_current_active_user)
) -> List[ChatSession]:
    """
    List all chat sessions for the current user.
    
    This endpoint requires authentication.
    """
    sessions = await ChatbotService.list_sessions(current_user.id)
    return sessions

@router.delete("/sessions/{session_id}", response_model=Dict[str, Any])
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Delete a chat session.
    
    This endpoint requires authentication and will only delete sessions owned by the current user.
    """
    success = await ChatbotService.delete_session(session_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "message": "Session deleted"}

@router.get("/analytics", response_model=Dict[str, Any])
async def get_analytics(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get analytics data for the chatbot.
    
    This endpoint requires authentication and admin privileges.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access analytics")
    
    analytics = await ChatbotService.get_analytics()
    return analytics 