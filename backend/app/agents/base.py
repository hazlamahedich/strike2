"""
Base agent utilities for the AI-powered CRM.

This module provides common functionality and base classes for all agents in the system.
"""

import logging
import aiohttp
import json
from typing import Any, Dict, List, Callable, Optional, TypeVar, Generic, Union
from pydantic import BaseModel, Field
from langchain.schema import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_community.chat_models import ChatOpenAI
from langchain.tools import BaseTool
from langchain.callbacks.manager import CallbackManagerForToolRun
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Type definitions
T = TypeVar('T')

class AgentState(BaseModel):
    """Base state object for agents to track their state during execution."""
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Agent can store arbitrary intermediate values
    context: Dict[str, Any] = Field(default_factory=dict)
    
    # The current status of the agent
    status: str = "idle"
    
    # Store any errors that occurred
    errors: List[str] = Field(default_factory=list)
    
    # Metrics for the agent
    metrics: Dict[str, Any] = Field(default_factory=dict)
    
    def add_message(self, role: str, content: str) -> None:
        """Add a message to the message history."""
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": None  # Could use datetime.now() if needed
        })
    
    def get_recent_messages(self, n: int = 5) -> List[Dict[str, Any]]:
        """Get the n most recent messages."""
        return self.messages[-n:] if self.messages else []
    
    def clear_messages(self) -> None:
        """Clear all messages."""
        self.messages = []
    
    def set_error(self, error: str) -> None:
        """Add an error to the state."""
        self.errors.append(error)
        self.status = "error"
        logger.error(f"Agent error: {error}")
    
    def reset(self) -> None:
        """Reset the agent state to initial values."""
        self.messages = []
        self.context = {}
        self.status = "idle"
        self.errors = []
        self.metrics = {}

class DatabaseTool(BaseTool):
    """Base tool for database operations."""
    name: str
    description: str
    
    async def _arun(self, query: str, **kwargs) -> str:
        """Run the database query asynchronously."""
        raise NotImplementedError("Subclasses must implement this method")

class CRMTool(BaseTool):
    """Base tool for CRM-specific operations."""
    name: str
    description: str
    
    def _run(
        self,
        tool_input: str = "",
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Run the tool."""
        raise NotImplementedError("Subclasses must implement this method")

class CentralizedLLM:
    """Wrapper for the centralized LLM service."""
    
    def __init__(self, temperature: float = 0.0, model_name: Optional[str] = None, feature_name: str = "agent"):
        self.temperature = temperature
        self.model_name = model_name
        self.feature_name = feature_name
        self.base_url = settings.LLM_API_BASE_URL
        
    async def apredict(self, prompt: str) -> str:
        """Generate a prediction from the LLM service."""
        if not self.base_url:
            raise ValueError("LLM_API_BASE_URL not configured")
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/llm/generate", json={
                    "prompt": prompt,
                    "temperature": self.temperature,
                    "feature_name": self.feature_name,
                    "model_name": self.model_name
                }) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        logger.error(f"Error from LLM service: {error_text}")
                        raise ValueError(f"LLM service error: {error_text}")
                    
                    result = await resp.json()
                    return result.get("text", "")
        except Exception as e:
            logger.error(f"Error calling LLM service: {str(e)}")
            raise

    async def apredict_json(self, prompt: str) -> Dict[str, Any]:
        """Generate a JSON prediction from the LLM service."""
        if not self.base_url:
            raise ValueError("LLM_API_BASE_URL not configured")
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/llm/generate", json={
                    "prompt": prompt,
                    "temperature": self.temperature,
                    "feature_name": self.feature_name,
                    "model_name": self.model_name,
                    "response_format": {"type": "json_object"}
                }) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        logger.error(f"Error from LLM service: {error_text}")
                        raise ValueError(f"LLM service error: {error_text}")
                    
                    result = await resp.json()
                    response_text = result.get("text", "{}")
                    
                    try:
                        return json.loads(response_text)
                    except json.JSONDecodeError:
                        # Try to extract JSON from the response text
                        import re
                        match = re.search(r"```json\s*(.*?)\s*```", response_text, re.DOTALL)
                        if match:
                            json_str = match.group(1)
                            return json.loads(json_str)
                        
                        logger.error("Failed to parse JSON from LLM response")
                        raise ValueError("Invalid JSON response from LLM service")
        except Exception as e:
            logger.error(f"Error calling LLM service for JSON: {str(e)}")
            raise

async def create_llm(model_name: Optional[str] = None, temperature: float = 0.0, feature_name: str = "agent"):
    """Create a centralized language model instance with specified parameters."""
    # First check if we should use the centralized LLM service
    if settings.LLM_API_BASE_URL:
        logger.info(f"Using centralized LLM service at {settings.LLM_API_BASE_URL}")
        return CentralizedLLM(
            temperature=temperature,
            model_name=model_name or settings.DEFAULT_MODEL,
            feature_name=feature_name
        )
    
    # Fallback to direct OpenAI usage if centralized service not available
    logger.warning("Centralized LLM service not configured, falling back to direct OpenAI usage")
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model_name=model_name or settings.DEFAULT_MODEL,
        temperature=temperature,
    )

def create_system_message(content: str) -> SystemMessage:
    """Create a system message for LLM prompting."""
    return SystemMessage(content=content)

def create_human_message(content: str) -> HumanMessage:
    """Create a human message for LLM prompting."""
    return HumanMessage(content=content)

def create_ai_message(content: str) -> AIMessage:
    """Create an AI message for LLM prompting."""
    return AIMessage(content=content)

def create_chat_prompt(
    system_message: str,
    human_template: str,
    input_variables: List[str],
    include_history: bool = True,
) -> ChatPromptTemplate:
    """Create a chat prompt template with optional message history."""
    messages = [
        ("system", system_message),
    ]
    
    if include_history:
        messages.append(MessagesPlaceholder(variable_name="chat_history"))
    
    messages.append(("human", human_template))
    
    return ChatPromptTemplate.from_messages(messages) 