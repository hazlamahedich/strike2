"""
Agent Manager for coordinating AI agents in the CRM system.

This module provides a unified interface for interacting with the various AI agents
in the system, managing their lifecycle and coordinating their activities.
"""

import logging
from typing import Any, Dict, List, Optional, Union

from app.agents.lead_processor import LeadProcessorAgent
from app.agents.communication_assistant import CommunicationAssistantAgent
from app.agents.insight_generator import InsightGeneratorAgent
from app.agents.task_orchestrator import TaskOrchestratorAgent

# Configure logger
logger = logging.getLogger(__name__)

class AgentManager:
    """
    Manager class for coordinating AI agents in the CRM system.
    
    This class provides a unified interface for interacting with the various
    agents, managing their lifecycle, and coordinating their activities.
    """
    
    def __init__(self):
        """Initialize the agent manager and all agent instances."""
        logger.info("Initializing Agent Manager")
        
        # Initialize agent instances
        self._lead_processor = None
        self._communication_assistant = None
        self._insight_generator = None
        self._task_orchestrator = None
        
        logger.info("Agent Manager initialized")
    
    async def get_lead_processor(self) -> LeadProcessorAgent:
        """Get or create the LeadProcessor agent instance."""
        if self._lead_processor is None:
            logger.info("Creating LeadProcessor agent instance")
            self._lead_processor = LeadProcessorAgent()
        return self._lead_processor
    
    async def get_communication_assistant(self) -> CommunicationAssistantAgent:
        """Get or create the CommunicationAssistant agent instance."""
        if self._communication_assistant is None:
            logger.info("Creating CommunicationAssistant agent instance")
            self._communication_assistant = CommunicationAssistantAgent()
        return self._communication_assistant
    
    async def get_insight_generator(self) -> InsightGeneratorAgent:
        """Get or create the InsightGenerator agent instance."""
        if self._insight_generator is None:
            logger.info("Creating InsightGenerator agent instance")
            self._insight_generator = InsightGeneratorAgent()
        return self._insight_generator
    
    async def get_task_orchestrator(self) -> TaskOrchestratorAgent:
        """Get or create the TaskOrchestrator agent instance."""
        if self._task_orchestrator is None:
            logger.info("Creating TaskOrchestrator agent instance")
            self._task_orchestrator = TaskOrchestratorAgent()
        return self._task_orchestrator
    
    async def process_lead_document(
        self,
        document: str,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process an unstructured document to extract and enrich lead information.
        
        Args:
            document: The document or text to process
            source: Optional source information for the lead
            
        Returns:
            Dictionary containing the processing results
        """
        logger.info(f"Processing lead document from source: {source}")
        
        # Get the lead processor agent
        lead_processor = await self.get_lead_processor()
        
        # Process the document
        result = await lead_processor.process_document(document, source)
        
        return result
    
    async def generate_communication_content(
        self,
        lead_id: int,
        content_type: str,
        purpose: str,
        tone: str = "professional",
        key_points: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized communication content for a lead.
        
        Args:
            lead_id: ID of the lead for personalization
            content_type: Type of content (email, sms, call_script, meeting_agenda)
            purpose: Purpose of the content (introduction, follow_up, proposal, check_in)
            tone: Tone of the content (professional, friendly, formal, casual)
            key_points: Key points to include in the content
            
        Returns:
            Dictionary containing the generated content and metadata
        """
        logger.info(f"Generating {content_type} content for lead ID: {lead_id}")
        
        # Get the communication assistant agent
        communication_assistant = await self.get_communication_assistant()
        
        # Generate the content
        result = await communication_assistant.generate_content(
            lead_id=lead_id,
            content_type=content_type,
            purpose=purpose,
            tone=tone,
            key_points=key_points
        )
        
        return result
    
    async def analyze_lead(
        self,
        lead_id: int
    ) -> Dict[str, Any]:
        """
        Analyze a lead to generate insights and recommendations.
        
        Args:
            lead_id: ID of the lead to analyze
            
        Returns:
            Dictionary containing lead score and insights
        """
        logger.info(f"Analyzing lead ID: {lead_id}")
        
        # Get the insight generator agent
        insight_generator = await self.get_insight_generator()
        
        # Analyze the lead
        result = await insight_generator.analyze_lead(lead_id)
        
        return result
    
    async def create_follow_up_plan(
        self,
        lead_id: int
    ) -> Dict[str, Any]:
        """
        Create a follow-up plan for a lead with tasks and scheduling.
        
        Args:
            lead_id: ID of the lead to create a plan for
            
        Returns:
            Dictionary containing follow-up suggestions and task plan
        """
        logger.info(f"Creating follow-up plan for lead ID: {lead_id}")
        
        # Get the task orchestrator agent
        task_orchestrator = await self.get_task_orchestrator()
        
        # Create the follow-up plan
        result = await task_orchestrator.create_follow_up_plan(lead_id)
        
        return result

# Create a singleton instance of the agent manager
agent_manager = AgentManager() 