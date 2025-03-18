"""
Communication Assistant Agent for the AI-powered CRM.

This agent is responsible for:
1. Generating personalized email and SMS content
2. Creating call scripts and meeting agendas
3. Suggesting follow-up messages based on previous interactions
4. Adapting tone and style to match the lead's preferences
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union, Tuple, cast
from pydantic import BaseModel, Field
from datetime import datetime

from langchain.agents import AgentExecutor
from langchain.schema.runnable import RunnableMap, RunnablePassthrough
from langchain.prompts import ChatPromptTemplate
from langchain.tools import BaseTool
from langgraph.graph import StateGraph, END

from app.agents.base import AgentState, create_llm, create_system_message, create_human_message
from app.core.config import settings
from app.core.database import fetch_one, fetch_all
from app.services import ai as ai_service
from app.models.ai import (
    ContentGenerationRequest,
    ContentGenerationResponse,
    SentimentScore
)

# Configure logger
logger = logging.getLogger(__name__)

# Define CommunicationAssistant-specific state
class CommunicationAssistantState(AgentState):
    """State for the CommunicationAssistant agent."""
    # Lead ID for personalization
    lead_id: Optional[int] = None
    
    # Content specifications
    content_type: Optional[str] = None  # email, sms, call_script, meeting_agenda
    purpose: Optional[str] = None  # introduction, follow_up, proposal, check_in
    tone: str = "professional"  # professional, friendly, formal, casual
    key_points: List[str] = Field(default_factory=list)
    
    # Lead information for personalization
    lead_info: Dict[str, Any] = Field(default_factory=dict)
    
    # Communication history for context
    communication_history: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Generated content
    generated_content: Dict[str, Any] = Field(default_factory=dict)
    
    # Generation stage
    stage: str = "initial"
    
    # Result of generation
    result: Dict[str, Any] = Field(default_factory=dict)

# Define tools for the CommunicationAssistant agent
class FetchLeadInfoTool(BaseTool):
    """Tool to fetch lead information for personalization."""
    name: str = "fetch_lead_info"
    description: str = "Fetch information about a lead for personalization."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch lead information from the database."""
        logger.info(f"Fetching information for lead ID: {lead_id}")
        
        # This would normally fetch from the database
        # For now, we'll use dummy data
        
        # Dummy lead data for testing
        lead_info = {
            "id": lead_id,
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "company": "Acme Corp",
            "title": "CEO",
            "lead_score": 80,
            "status": "qualified",
            "custom_fields": {
                "industry": "Technology",
                "interests": ["CRM", "AI", "Automation"],
                "preferred_contact_method": "email"
            }
        }
        
        return json.dumps(lead_info)

class FetchCommunicationHistoryTool(BaseTool):
    """Tool to fetch communication history for a lead."""
    name: str = "fetch_communication_history"
    description: str = "Fetch communication history for a lead."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch communication history from the database."""
        logger.info(f"Fetching communication history for lead ID: {lead_id}")
        
        # This would normally fetch from the database
        # For now, we'll use dummy data
        
        # Dummy communication history for testing
        history = [
            {
                "type": "email",
                "direction": "outgoing",
                "timestamp": "2023-03-01T10:30:00Z",
                "subject": "Introduction to Our Services",
                "content": "Hello John, I wanted to introduce our new AI-powered CRM system...",
                "sentiment": {
                    "score": 0.2,
                    "positive": 0.6,
                    "neutral": 0.4,
                    "negative": 0.0
                }
            },
            {
                "type": "email",
                "direction": "incoming",
                "timestamp": "2023-03-02T14:15:00Z",
                "subject": "Re: Introduction to Our Services",
                "content": "Hi, thanks for reaching out. I'm interested in learning more about your AI capabilities...",
                "sentiment": {
                    "score": 0.7,
                    "positive": 0.8,
                    "neutral": 0.2,
                    "negative": 0.0
                }
            },
            {
                "type": "call",
                "direction": "outgoing",
                "timestamp": "2023-03-05T11:00:00Z",
                "duration": "15:30",
                "summary": "Discussed AI features, pricing plans, and implementation timeline.",
                "sentiment": {
                    "score": 0.5,
                    "positive": 0.6,
                    "neutral": 0.3,
                    "negative": 0.1
                }
            }
        ]
        
        return json.dumps(history)

class GenerateContentTool(BaseTool):
    """Tool to generate communication content."""
    name: str = "generate_content"
    description: str = "Generate personalized communication content."
    
    async def _arun(self, input_json: str) -> str:
        """Generate personalized communication content."""
        logger.info("Generating personalized communication content")
        
        try:
            input_data = json.loads(input_json)
            
            content_type = input_data.get("content_type", "email")
            purpose = input_data.get("purpose", "follow_up")
            tone = input_data.get("tone", "professional")
            lead_info = input_data.get("lead_info", {})
            key_points = input_data.get("key_points", [])
            communication_history = input_data.get("communication_history", [])
            
            llm = await create_llm(temperature=0.7)
            
            system_prompt = f"""
            You are an expert communication assistant for a CRM system. Your task is to generate personalized 
            {content_type} content for a {purpose} message. Use a {tone} tone.
            
            Incorporate the lead's information and communication history to make this highly personalized.
            Reference previous conversations when appropriate.
            """
            
            human_prompt = f"""
            Generate {content_type} content for a {purpose} to the following lead:
            
            Lead Information:
            {json.dumps(lead_info, indent=2)}
            
            Communication History:
            {json.dumps(communication_history, indent=2)}
            
            Key Points to Include:
            {json.dumps(key_points, indent=2)}
            
            The tone should be {tone}.
            
            Return a JSON object with the following format:
            {{
                "content": "The generated content",
                "subject": "Subject line (for emails only)",
                "variables": {{"variable_name": "value"}},
                "alternative_versions": ["Alternative version 1", "Alternative version 2"]
            }}
            
            For emails, include a subject line. For SMS and other types, subject is not needed.
            Include 1-3 alternative versions with different approaches.
            Identify any variables that could be personalized further.
            """
            
            response = await llm.apredict(system_prompt + human_prompt)
            
            # Clean up and parse the response
            try:
                # Strip any markdown formatting
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                
                clean_response = clean_response.strip()
                
                # Parse the JSON
                generated_content = json.loads(clean_response)
                return json.dumps(generated_content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse generated content: {e}")
                return json.dumps({
                    "error": "Failed to parse generated content",
                    "raw_response": response
                })
                
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            return json.dumps({
                "error": f"Error generating content: {str(e)}"
            })

# Define agent nodes for the CommunicationAssistant graph
async def get_lead_info(state: CommunicationAssistantState) -> CommunicationAssistantState:
    """Fetch lead information for personalization."""
    if not state.lead_id:
        state.set_error("No lead ID provided for personalization")
        return state
    
    # Create tool instance
    lead_info_tool = FetchLeadInfoTool()
    
    try:
        # Fetch lead information
        result = await lead_info_tool._arun(state.lead_id)
        lead_info = json.loads(result)
        
        # Update state
        state.lead_info = lead_info
        state.stage = "lead_info_fetched"
        state.add_message("system", f"Retrieved lead information for ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching lead information: {str(e)}")
    
    return state

async def get_communication_history(state: CommunicationAssistantState) -> CommunicationAssistantState:
    """Fetch communication history for context."""
    if not state.lead_id:
        state.set_error("No lead ID provided for fetching communication history")
        return state
    
    # Create tool instance
    history_tool = FetchCommunicationHistoryTool()
    
    try:
        # Fetch communication history
        result = await history_tool._arun(state.lead_id)
        communication_history = json.loads(result)
        
        # Update state
        state.communication_history = communication_history
        state.stage = "communication_history_fetched"
        state.add_message("system", f"Retrieved communication history for lead ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching communication history: {str(e)}")
    
    return state

async def generate_content(state: CommunicationAssistantState) -> CommunicationAssistantState:
    """Generate personalized communication content."""
    if not state.lead_info:
        state.set_error("No lead information available for content generation")
        return state
    
    if not state.content_type or not state.purpose:
        state.set_error("Content type or purpose not specified")
        return state
    
    # Create tool instance
    content_generator = GenerateContentTool()
    
    try:
        # Prepare input for content generation
        input_data = {
            "content_type": state.content_type,
            "purpose": state.purpose,
            "tone": state.tone,
            "lead_info": state.lead_info,
            "key_points": state.key_points,
            "communication_history": state.communication_history
        }
        
        # Generate content
        result = await content_generator._arun(json.dumps(input_data))
        generated_content = json.loads(result)
        
        # Update state
        state.generated_content = generated_content
        state.stage = "content_generated"
        state.add_message("system", "Generated personalized communication content")
        
        # Prepare result
        state.result = {
            "success": True,
            "message": f"Successfully generated {state.content_type} content",
            "content": generated_content
        }
        
    except Exception as e:
        state.set_error(f"Error generating content: {str(e)}")
    
    return state

# Define the state graph for the CommunicationAssistant
def create_communication_assistant_graph() -> StateGraph:
    """Create the workflow graph for the CommunicationAssistant agent."""
    # Create the state graph
    workflow = StateGraph(CommunicationAssistantState)
    
    # Add nodes
    workflow.add_node("get_lead_info", get_lead_info)
    workflow.add_node("get_communication_history", get_communication_history)
    workflow.add_node("generate_content", generate_content)
    
    # Define edges
    workflow.add_edge("get_lead_info", "get_communication_history")
    workflow.add_edge("get_communication_history", "generate_content")
    workflow.add_edge("generate_content", END)
    
    # Set the entry point
    workflow.set_entry_point("get_lead_info")
    
    return workflow

# Main agent class
class CommunicationAssistantAgent:
    """Agent for generating personalized communication content."""
    
    def __init__(self):
        self.graph = create_communication_assistant_graph().compile()
        logger.info("CommunicationAssistant agent initialized")
    
    async def generate_content(
        self,
        lead_id: int,
        content_type: str,
        purpose: str,
        tone: str = "professional",
        key_points: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized communication content.
        
        Args:
            lead_id: ID of the lead for personalization
            content_type: Type of content (email, sms, call_script, meeting_agenda)
            purpose: Purpose of the content (introduction, follow_up, proposal, check_in)
            tone: Tone of the content (professional, friendly, formal, casual)
            key_points: Key points to include in the content
            
        Returns:
            Dictionary containing the generated content and metadata
        """
        # Initialize state
        initial_state = CommunicationAssistantState(
            lead_id=lead_id,
            content_type=content_type,
            purpose=purpose,
            tone=tone,
            key_points=key_points or [],
            status="processing"
        )
        
        try:
            # Execute the workflow
            logger.info(f"Starting content generation workflow for lead ID: {lead_id}")
            final_state = await self.graph.ainvoke(initial_state)
            
            # Return the result
            return final_state.result if final_state.result else {
                "success": False,
                "error": final_state.errors[-1] if final_state.errors else "Unknown error"
            }
            
        except Exception as e:
            logger.error(f"Error in content generation workflow: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 