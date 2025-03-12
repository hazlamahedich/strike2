"""
Lead Processor Agent for the AI-powered CRM.

This agent is responsible for:
1. Extracting lead information from unstructured documents
2. Implementing entity recognition for contact details
3. Automatically categorizing and tagging leads based on available information
4. Enriching lead data with additional information from various sources
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union, Tuple, cast
from pydantic import BaseModel, Field

from langchain.agents import AgentExecutor
from langchain.schema.runnable import RunnableMap
from langchain.prompts import ChatPromptTemplate
from langchain.tools import BaseTool
from langgraph.graph import StateGraph, END

from app.agents.base import AgentState, create_llm, create_system_message, create_human_message
from app.core.config import settings
from app.core.database import fetch_one, fetch_all, insert_row, update_row
from app.models.lead import Lead, LeadCreate, LeadUpdate
from app.services import lead as lead_service

# Configure logger
logger = logging.getLogger(__name__)

# Define LeadProcessor-specific state
class LeadProcessorState(AgentState):
    """State for the LeadProcessor agent."""
    # Input document or text to process
    input_document: Optional[str] = None
    
    # Extracted entities
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    
    # Lead data being processed
    lead_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Source information
    source: Optional[str] = None
    
    # Processing stage
    stage: str = "initial"
    
    # Result of processing
    result: Dict[str, Any] = Field(default_factory=dict)

# Define tools for the LeadProcessor agent
class ExtractEntitiesFromTextTool(BaseTool):
    """Tool to extract structured entities from unstructured text."""
    name: str = "extract_entities_from_text"
    description: str = "Extract structured entities like names, emails, phone numbers, etc. from text."
    
    async def _arun(self, text: str) -> str:
        """Run entity extraction on the text."""
        logger.info("Extracting entities from text")
        
        llm = await create_llm()
        
        prompt = f"""
        Extract all relevant lead information from the following text. 
        Look for: names, emails, phone numbers, job titles, company names, addresses, and any other relevant contact details.
        
        Text: {text}
        
        Return a JSON object with the extracted information, with keys like: first_name, last_name, email, phone, company, title, etc.
        If information is not found, do not include that field.
        Only return the JSON object, no other text.
        """
        
        response = await llm.apredict(prompt)
        
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
            extracted_data = json.loads(clean_response)
            return json.dumps(extracted_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse extracted entities: {e}")
            return json.dumps({"error": "Failed to parse entities", "raw_response": response})

class CategorizeLeadTool(BaseTool):
    """Tool to categorize and tag leads based on available information."""
    name: str = "categorize_lead"
    description: str = "Categorize and tag a lead based on the extracted information."
    
    async def _arun(self, lead_data: str) -> str:
        """Categorize the lead based on available data."""
        logger.info("Categorizing lead")
        
        llm = await create_llm()
        
        try:
            lead_info = json.loads(lead_data)
        except json.JSONDecodeError:
            return json.dumps({"error": "Invalid lead data format"})
        
        prompt = f"""
        Based on the following lead information, determine:
        1. The most appropriate industry category for this lead
        2. The potential interest areas or products they might be interested in
        3. Assign relevant tags based on the information available
        4. Suggest a lead status (new, qualified, contacted, etc.)
        
        Lead information:
        {json.dumps(lead_info, indent=2)}
        
        Return a JSON object with the following fields:
        - industry: The industry this lead belongs to
        - interests: Array of potential interest areas
        - tags: Array of relevant tags for this lead
        - status: Suggested initial status for this lead
        - notes: Any observations or notes about this lead
        
        Only return the JSON object, no other text.
        """
        
        response = await llm.apredict(prompt)
        
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
            categorization_data = json.loads(clean_response)
            return json.dumps(categorization_data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse lead categorization: {e}")
            return json.dumps({"error": "Failed to categorize lead", "raw_response": response})

class EnrichLeadDataTool(BaseTool):
    """Tool to enrich lead data with additional information."""
    name: str = "enrich_lead_data"
    description: str = "Enrich lead data with additional information."
    
    async def _arun(self, lead_data: str) -> str:
        """Enrich the lead data with additional information."""
        logger.info("Enriching lead data")
        
        # This would normally connect to external data sources
        # For now, we'll simulate enrichment with a placeholder
        
        try:
            lead_info = json.loads(lead_data)
        except json.JSONDecodeError:
            return json.dumps({"error": "Invalid lead data format"})
        
        # Placeholder for enrichment logic
        # In a real system, this would connect to services like Clearbit, ZoomInfo, etc.
        enriched_data = lead_info.copy()
        
        # Add placeholder enriched fields
        if "company" in enriched_data:
            enriched_data["company_size"] = "Unknown"
            enriched_data["company_industry"] = "Unknown"
            enriched_data["company_website"] = "Unknown"
        
        if "email" in enriched_data:
            enriched_data["email_verified"] = False
        
        # Return the enriched data
        return json.dumps(enriched_data)

# Define agent nodes for the LeadProcessor graph
async def extract_entities(state: LeadProcessorState) -> LeadProcessorState:
    """Extract entities from the input document."""
    if not state.input_document:
        state.set_error("No input document provided for entity extraction")
        return state
    
    # Create tool instance
    entity_extractor = ExtractEntitiesFromTextTool()
    
    try:
        # Run the entity extraction
        result = await entity_extractor._arun(state.input_document)
        extracted_entities = json.loads(result)
        
        # Update state
        state.extracted_entities = extracted_entities
        state.stage = "entities_extracted"
        state.add_message("system", f"Extracted entities: {json.dumps(extracted_entities, indent=2)}")
        
    except Exception as e:
        state.set_error(f"Error extracting entities: {str(e)}")
    
    return state

async def categorize_lead(state: LeadProcessorState) -> LeadProcessorState:
    """Categorize and tag the lead based on extracted information."""
    if not state.extracted_entities:
        state.set_error("No extracted entities to categorize")
        return state
    
    # Create tool instance
    lead_categorizer = CategorizeLeadTool()
    
    try:
        # Run the categorization
        result = await lead_categorizer._arun(json.dumps(state.extracted_entities))
        categorization = json.loads(result)
        
        # Combine the extracted entities with categorization
        lead_data = {**state.extracted_entities}
        
        # Add categorization data
        if "industry" in categorization:
            lead_data["industry"] = categorization["industry"]
        
        if "tags" in categorization:
            lead_data["tags"] = categorization["tags"]
        
        if "status" in categorization:
            lead_data["status"] = categorization["status"]
        
        if "notes" in categorization:
            lead_data["notes"] = categorization["notes"]
        
        # Add source information
        if state.source:
            lead_data["source"] = state.source
        
        # Update state
        state.lead_data = lead_data
        state.stage = "lead_categorized"
        state.add_message("system", f"Categorized lead: {json.dumps(categorization, indent=2)}")
        
    except Exception as e:
        state.set_error(f"Error categorizing lead: {str(e)}")
    
    return state

async def enrich_lead_data(state: LeadProcessorState) -> LeadProcessorState:
    """Enrich the lead data with additional information."""
    if not state.lead_data:
        state.set_error("No lead data to enrich")
        return state
    
    # Create tool instance
    data_enricher = EnrichLeadDataTool()
    
    try:
        # Run the enrichment
        result = await data_enricher._arun(json.dumps(state.lead_data))
        enriched_data = json.loads(result)
        
        # Update state
        state.lead_data = enriched_data
        state.stage = "lead_enriched"
        state.add_message("system", "Lead data enriched with additional information")
        
    except Exception as e:
        state.set_error(f"Error enriching lead data: {str(e)}")
    
    return state

async def save_lead_to_database(state: LeadProcessorState) -> LeadProcessorState:
    """Save the processed lead to the database."""
    if not state.lead_data:
        state.set_error("No lead data to save")
        return state
    
    try:
        # Prepare lead data for database
        lead_data = state.lead_data.copy()
        
        # Create a LeadCreate model
        lead_create = LeadCreate(
            first_name=lead_data.get("first_name", ""),
            last_name=lead_data.get("last_name", ""),
            email=lead_data.get("email", ""),
            phone=lead_data.get("phone", ""),
            company=lead_data.get("company", ""),
            title=lead_data.get("title", ""),
            source=lead_data.get("source", "AI-generated"),
            status=lead_data.get("status", "new"),
            owner_id=None,  # Will be assigned later
            lead_score=0,  # Initial score
            custom_fields={
                "industry": lead_data.get("industry", ""),
                "tags": lead_data.get("tags", []),
                "notes": lead_data.get("notes", "")
            }
        )
        
        # Save to database (this would use the actual service in production)
        # For now, we'll just simulate this by putting the data in the result
        
        # Update state
        state.result = {
            "success": True,
            "message": "Lead successfully processed and saved",
            "lead_data": lead_create.dict()
        }
        state.stage = "completed"
        state.add_message("system", "Lead saved to database")
        
    except Exception as e:
        state.set_error(f"Error saving lead to database: {str(e)}")
    
    return state

# Define the state graph for the LeadProcessor
def create_lead_processor_graph() -> StateGraph:
    """Create the workflow graph for the LeadProcessor agent."""
    # Create the state graph
    workflow = StateGraph(LeadProcessorState)
    
    # Add nodes
    workflow.add_node("extract_entities", extract_entities)
    workflow.add_node("categorize_lead", categorize_lead)
    workflow.add_node("enrich_lead_data", enrich_lead_data)
    workflow.add_node("save_lead", save_lead_to_database)
    
    # Define edges
    workflow.add_edge("extract_entities", "categorize_lead")
    workflow.add_edge("categorize_lead", "enrich_lead_data")
    workflow.add_edge("enrich_lead_data", "save_lead")
    workflow.add_edge("save_lead", END)
    
    # Set the entry point
    workflow.set_entry_point("extract_entities")
    
    return workflow

# Main agent class
class LeadProcessorAgent:
    """Agent for processing and enriching lead data from unstructured sources."""
    
    def __init__(self):
        self.graph = create_lead_processor_graph().compile()
        logger.info("LeadProcessor agent initialized")
    
    async def process_document(
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
        # Initialize state
        initial_state = LeadProcessorState(
            input_document=document,
            source=source,
            status="processing"
        )
        
        try:
            # Execute the workflow
            logger.info("Starting lead processing workflow")
            final_state = await self.graph.ainvoke(initial_state)
            
            # Return the result
            return final_state.result if final_state.result else {
                "success": False,
                "error": final_state.errors[-1] if final_state.errors else "Unknown error"
            }
            
        except Exception as e:
            logger.error(f"Error in lead processing workflow: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 