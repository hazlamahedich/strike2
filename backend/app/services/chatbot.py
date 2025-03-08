"""
Chatbot service for the AI-powered CRM.

This module provides services for interacting with the chatbot agent.
"""

import logging
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.agents.chatbot_agent import get_chatbot_agent
from app.models.chatbot import (
    ChatRequest, ChatResponse, ChatFeedback, ChatSession, 
    ChatMessage, ChatMessageRole, ChatbotAnalytics, ChatbotQueryType
)
from app.core.database import fetch_all, fetch_one, insert_row, update_row, delete_row

# Configure logger
logger = logging.getLogger(__name__)

class ChatbotService:
    """Service for interacting with the chatbot agent."""
    
    @staticmethod
    async def process_message(request: ChatRequest) -> ChatResponse:
        """Process a message from the user."""
        agent = get_chatbot_agent()
        
        # Process the message
        response = await agent.process_message(request)
        
        # Store the message and response in the database
        await ChatbotService._store_interaction(request, response)
        
        return response
    
    @staticmethod
    async def provide_feedback(feedback: ChatFeedback) -> Dict[str, Any]:
        """Process feedback from the user."""
        agent = get_chatbot_agent()
        
        # Process the feedback
        result = await agent.provide_feedback(feedback)
        
        # Store the feedback in the database
        await ChatbotService._store_feedback(feedback)
        
        return result
    
    @staticmethod
    async def get_session(session_id: UUID, user_id: Optional[UUID] = None) -> Optional[ChatSession]:
        """Get a chat session by ID."""
        # Query the database for the session
        query = """
        SELECT * FROM chatbot_sessions WHERE id = $1
        """
        params = [str(session_id)]
        
        if user_id is not None:
            query += " AND user_id = $2"
            params.append(str(user_id))
        
        session_data = await fetch_one(query, *params)
        if not session_data:
            return None
        
        # Query the database for the messages
        messages_query = """
        SELECT * FROM chatbot_messages 
        WHERE session_id = $1 
        ORDER BY timestamp ASC
        """
        
        messages_data = await fetch_all(messages_query, str(session_id))
        
        # Convert the data to model objects
        messages = [
            ChatMessage(
                id=UUID(msg["id"]),
                role=ChatMessageRole(msg["role"]),
                content=msg["content"],
                timestamp=msg["timestamp"],
                metadata=msg["metadata"] or {},
            )
            for msg in messages_data
        ]
        
        # Create the session object
        session = ChatSession(
            id=UUID(session_data["id"]),
            user_id=UUID(session_data["user_id"]) if session_data["user_id"] else None,
            messages=messages,
            created_at=session_data["created_at"],
            updated_at=session_data["updated_at"],
            metadata=session_data["metadata"] or {},
        )
        
        return session
    
    @staticmethod
    async def list_sessions(user_id: UUID) -> List[ChatSession]:
        """List all chat sessions for a user."""
        # Query the database for the sessions
        query = """
        SELECT * FROM chatbot_sessions 
        WHERE user_id = $1 
        ORDER BY updated_at DESC
        """
        
        sessions_data = await fetch_all(query, str(user_id))
        
        # Convert the data to model objects
        sessions = []
        for session_data in sessions_data:
            # Query the database for the messages
            messages_query = """
            SELECT * FROM chatbot_messages 
            WHERE session_id = $1 
            ORDER BY timestamp ASC
            """
            
            messages_data = await fetch_all(messages_query, session_data["id"])
            
            # Convert the data to model objects
            messages = [
                ChatMessage(
                    id=UUID(msg["id"]),
                    role=ChatMessageRole(msg["role"]),
                    content=msg["content"],
                    timestamp=msg["timestamp"],
                    metadata=msg["metadata"] or {},
                )
                for msg in messages_data
            ]
            
            # Create the session object
            session = ChatSession(
                id=UUID(session_data["id"]),
                user_id=UUID(session_data["user_id"]) if session_data["user_id"] else None,
                messages=messages,
                created_at=session_data["created_at"],
                updated_at=session_data["updated_at"],
                metadata=session_data["metadata"] or {},
            )
            
            sessions.append(session)
        
        return sessions
    
    @staticmethod
    async def delete_session(session_id: UUID, user_id: UUID) -> bool:
        """Delete a chat session."""
        # Delete the messages first
        messages_query = """
        DELETE FROM chatbot_messages 
        WHERE session_id = $1
        """
        
        await delete_row(messages_query, str(session_id))
        
        # Then delete the session
        query = """
        DELETE FROM chatbot_sessions 
        WHERE id = $1 AND user_id = $2
        """
        
        result = await delete_row(query, str(session_id), str(user_id))
        
        return result > 0
    
    @staticmethod
    async def get_analytics() -> Dict[str, Any]:
        """Get analytics data for the chatbot."""
        # Get the total number of sessions
        sessions_query = """
        SELECT COUNT(*) as total_sessions FROM chatbot_sessions
        """
        
        sessions_result = await fetch_one(sessions_query)
        total_sessions = sessions_result["total_sessions"]
        
        # Get the total number of messages
        messages_query = """
        SELECT COUNT(*) as total_messages FROM chatbot_messages
        """
        
        messages_result = await fetch_one(messages_query)
        total_messages = messages_result["total_messages"]
        
        # Calculate the average messages per session
        avg_messages_per_session = total_messages / total_sessions if total_sessions > 0 else 0
        
        # Get the top query types
        query_types_query = """
        SELECT 
            metadata->>'query_type' as query_type, 
            COUNT(*) as count 
        FROM chatbot_messages 
        WHERE role = 'assistant' AND metadata->>'query_type' IS NOT NULL
        GROUP BY metadata->>'query_type'
        ORDER BY count DESC
        """
        
        query_types_result = await fetch_all(query_types_query)
        top_query_types = {
            ChatbotQueryType(row["query_type"]): row["count"]
            for row in query_types_result
        }
        
        # Get the average satisfaction score
        feedback_query = """
        SELECT AVG(
            CASE 
                WHEN feedback_type = 'helpful' THEN 1.0
                WHEN feedback_type = 'partially_helpful' THEN 0.5
                WHEN feedback_type = 'not_helpful' THEN 0.0
            END
        ) as avg_score
        FROM chatbot_feedback
        """
        
        feedback_result = await fetch_one(feedback_query)
        avg_satisfaction_score = feedback_result["avg_score"] or 0.0
        
        # Get the most common queries
        common_queries_query = """
        SELECT content, COUNT(*) as count
        FROM chatbot_messages
        WHERE role = 'user'
        GROUP BY content
        ORDER BY count DESC
        LIMIT 10
        """
        
        common_queries_result = await fetch_all(common_queries_query)
        common_queries = [row["content"] for row in common_queries_result]
        
        # Calculate the period
        now = datetime.now()
        period_start = now - timedelta(days=30)
        
        # Create the analytics object
        analytics = ChatbotAnalytics(
            total_sessions=total_sessions,
            total_messages=total_messages,
            avg_messages_per_session=avg_messages_per_session,
            top_query_types=top_query_types,
            avg_satisfaction_score=avg_satisfaction_score,
            common_queries=common_queries,
            period_start=period_start,
            period_end=now,
        )
        
        return analytics.dict()
    
    @staticmethod
    async def _store_interaction(request: ChatRequest, response: ChatResponse) -> None:
        """Store a user interaction in the database."""
        # Create or update the session
        session_id = response.session_id
        
        if request.session_id:
            # Update the existing session
            session_query = """
            UPDATE chatbot_sessions
            SET updated_at = NOW()
            WHERE id = $1
            RETURNING id
            """
            
            session_result = await update_row(session_query, str(session_id))
            if not session_result:
                # Session doesn't exist, create it
                session_query = """
                INSERT INTO chatbot_sessions (id, user_id, created_at, updated_at, metadata)
                VALUES ($1, $2, NOW(), NOW(), $3)
                RETURNING id
                """
                
                await insert_row(session_query, str(session_id), str(request.user_id) if request.user_id else None, request.metadata or {})
        else:
            # Create a new session
            session_query = """
            INSERT INTO chatbot_sessions (id, user_id, created_at, updated_at, metadata)
            VALUES ($1, $2, NOW(), NOW(), $3)
            RETURNING id
            """
            
            await insert_row(session_query, str(session_id), str(request.user_id) if request.user_id else None, request.metadata or {})
        
        # Store the user message
        user_message_query = """
        INSERT INTO chatbot_messages (id, session_id, role, content, timestamp, metadata)
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), $4)
        """
        
        await insert_row(
            user_message_query, 
            str(session_id), 
            ChatMessageRole.USER.value, 
            request.message,
            request.metadata or {},
        )
        
        # Store the assistant message
        assistant_message_query = """
        INSERT INTO chatbot_messages (id, session_id, role, content, timestamp, metadata)
        VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), $4)
        """
        
        await insert_row(
            assistant_message_query, 
            str(session_id), 
            ChatMessageRole.ASSISTANT.value, 
            response.message,
            {
                "query_type": response.metadata.get("query_type"),
                "suggested_follow_ups": response.suggested_follow_ups,
                "sources": response.sources,
            },
        )
    
    @staticmethod
    async def _store_feedback(feedback: ChatFeedback) -> None:
        """Store user feedback in the database."""
        query = """
        INSERT INTO chatbot_feedback (id, session_id, message_id, feedback_type, comment, timestamp, user_id)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), $5)
        """
        
        await insert_row(
            query,
            str(feedback.session_id),
            str(feedback.message_id),
            feedback.feedback_type.value,
            feedback.comment,
            str(feedback.user_id) if feedback.user_id else None,
        ) 