"""
Insight Generator Agent for the AI-powered CRM.

This agent is responsible for:
1. Analyzing interactions with leads to extract insights
2. Identifying patterns and opportunities in communication data
3. Generating lead scoring based on multiple factors
4. Providing actionable recommendations based on lead behavior
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union, Tuple, cast
from pydantic import BaseModel, Field
from datetime import datetime, timedelta

from langchain.agents import AgentExecutor
from langchain.schema.runnable import RunnableMap, RunnablePassthrough
from langchain.prompts import ChatPromptTemplate
from langchain.tools import BaseTool
from langgraph.graph import StateGraph, END

from app.agents.base import AgentState, create_llm, create_system_message, create_human_message
from app.core.config import settings
from app.core.database import fetch_one, fetch_all
from app.models.ai import (
    LeadScoreResponse,
    LeadScoreComponent,
    LeadScoreFactors,
    LeadInsight,
    LeadInsightsResponse,
    SentimentScore
)

# Configure logger
logger = logging.getLogger(__name__)

# Define InsightGenerator-specific state
class InsightGeneratorState(AgentState):
    """State for the InsightGenerator agent."""
    # Lead ID for analysis
    lead_id: Optional[int] = None
    
    # Lead information
    lead_info: Dict[str, Any] = Field(default_factory=dict)
    
    # Communication data
    emails: List[Dict[str, Any]] = Field(default_factory=list)
    calls: List[Dict[str, Any]] = Field(default_factory=list)
    meetings: List[Dict[str, Any]] = Field(default_factory=list)
    sms: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Lead score components
    score_components: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Insights
    insights: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Analysis stage
    stage: str = "initial"
    
    # Result of analysis
    result: Dict[str, Any] = Field(default_factory=dict)

# Define tools for the InsightGenerator agent
class FetchLeadDataTool(BaseTool):
    """Tool to fetch comprehensive lead data for analysis."""
    name = "fetch_lead_data"
    description = "Fetch comprehensive lead data including profile and custom fields."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch lead data from the database."""
        logger.info(f"Fetching comprehensive data for lead ID: {lead_id}")
        
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
            "created_at": "2023-01-15T10:00:00Z",
            "updated_at": "2023-03-10T15:30:00Z",
            "custom_fields": {
                "industry": "Technology",
                "interests": ["CRM", "AI", "Automation"],
                "company_size": "50-100",
                "budget": "100000-250000",
                "timeline": "3-6 months",
                "pain_points": ["Data management", "Customer retention", "Sales automation"]
            }
        }
        
        return json.dumps(lead_info)

class FetchCommunicationDataTool(BaseTool):
    """Tool to fetch all communication data for a lead."""
    name = "fetch_communication_data"
    description = "Fetch all emails, calls, SMS, and meetings for a lead."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch communication data from the database."""
        logger.info(f"Fetching communication data for lead ID: {lead_id}")
        
        # This would normally fetch from the database
        # For now, we'll use dummy data
        
        # Dummy communication data for testing
        communication_data = {
            "emails": [
                {
                    "id": 1001,
                    "subject": "Introduction to Our Services",
                    "sent_at": "2023-03-01T10:30:00Z",
                    "direction": "outgoing",
                    "open_count": 2,
                    "click_count": 1,
                    "sentiment_score": 0.2
                },
                {
                    "id": 1002,
                    "subject": "Re: Introduction to Our Services",
                    "sent_at": "2023-03-02T14:15:00Z",
                    "direction": "incoming",
                    "sentiment_score": 0.7
                },
                {
                    "id": 1003,
                    "subject": "Follow-up on our conversation",
                    "sent_at": "2023-03-07T09:45:00Z",
                    "direction": "outgoing",
                    "open_count": 1,
                    "click_count": 0,
                    "sentiment_score": 0.4
                }
            ],
            "calls": [
                {
                    "id": 2001,
                    "duration": 930,  # in seconds
                    "call_time": "2023-03-05T11:00:00Z",
                    "direction": "outgoing",
                    "sentiment_score": 0.5
                },
                {
                    "id": 2002,
                    "duration": 1200,  # in seconds
                    "call_time": "2023-03-12T15:30:00Z",
                    "direction": "incoming",
                    "sentiment_score": 0.6
                }
            ],
            "meetings": [
                {
                    "id": 3001,
                    "title": "Product Demo",
                    "start_time": "2023-03-15T13:00:00Z",
                    "end_time": "2023-03-15T14:00:00Z",
                    "status": "completed"
                }
            ],
            "sms": [
                {
                    "id": 4001,
                    "sent_at": "2023-03-10T10:15:00Z",
                    "direction": "outgoing",
                    "sentiment_score": 0.3
                },
                {
                    "id": 4002,
                    "sent_at": "2023-03-10T10:45:00Z",
                    "direction": "incoming",
                    "sentiment_score": 0.4
                }
            ]
        }
        
        return json.dumps(communication_data)

class CalculateLeadScoreTool(BaseTool):
    """Tool to calculate a lead score based on various factors."""
    name = "calculate_lead_score"
    description = "Calculate a lead score based on multiple factors."
    
    async def _arun(self, input_json: str) -> str:
        """Calculate lead score based on input data."""
        logger.info("Calculating lead score")
        
        try:
            input_data = json.loads(input_json)
            
            lead_info = input_data.get("lead_info", {})
            emails = input_data.get("emails", [])
            calls = input_data.get("calls", [])
            meetings = input_data.get("meetings", [])
            sms = input_data.get("sms", [])
            
            llm = await create_llm()
            
            prompt = f"""
            Calculate a lead score based on the following information.
            
            Lead Information:
            {json.dumps(lead_info, indent=2)}
            
            Email Communications:
            {json.dumps(emails, indent=2)}
            
            Call Communications:
            {json.dumps(calls, indent=2)}
            
            Meetings:
            {json.dumps(meetings, indent=2)}
            
            SMS Communications:
            {json.dumps(sms, indent=2)}
            
            Calculate a score for each of the following factors:
            1. Email Engagement (based on opens, clicks, responses)
            2. Response Time (how quickly they respond to our communications)
            3. Communication Frequency (how often they engage with us)
            4. Sentiment (the overall sentiment of their communications)
            5. Demographic/Firmographic Fit (based on industry, company size, etc.)
            
            For each factor, provide:
            - A score from 0.0 to 1.0
            - A weight from 0.0 to 1.0 indicating the importance of this factor
            - An explanation of how you calculated this score
            
            Also provide an overall score from 0.0 to 1.0 and a conversion probability from 0.0 to 1.0.
            
            Return only a JSON object with this structure:
            {{
                "overall_score": float,
                "conversion_probability": float,
                "components": [
                    {{
                        "factor": "email_engagement",
                        "weight": float,
                        "score": float,
                        "explanation": "string"
                    }}
                    // more components
                ]
            }}
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
                lead_score_data = json.loads(clean_response)
                return json.dumps(lead_score_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse lead score: {e}")
                return json.dumps({
                    "error": "Failed to parse lead score",
                    "raw_response": response
                })
                
        except Exception as e:
            logger.error(f"Error calculating lead score: {str(e)}")
            return json.dumps({
                "error": f"Error calculating lead score: {str(e)}"
            })

class GenerateInsightsTool(BaseTool):
    """Tool to generate insights and recommendations for a lead."""
    name = "generate_insights"
    description = "Generate insights and recommendations based on lead data and score."
    
    async def _arun(self, input_json: str) -> str:
        """Generate insights based on lead data and score."""
        logger.info("Generating lead insights")
        
        try:
            input_data = json.loads(input_json)
            
            lead_info = input_data.get("lead_info", {})
            score_data = input_data.get("score_data", {})
            emails = input_data.get("emails", [])
            calls = input_data.get("calls", [])
            meetings = input_data.get("meetings", [])
            sms = input_data.get("sms", [])
            
            llm = await create_llm()
            
            prompt = f"""
            Generate insights and recommendations for this lead based on all available data.
            
            Lead Information:
            {json.dumps(lead_info, indent=2)}
            
            Lead Score:
            {json.dumps(score_data, indent=2)}
            
            Communications Summary:
            - {len(emails)} emails
            - {len(calls)} calls
            - {len(meetings)} meetings
            - {len(sms)} SMS messages
            
            Generate the following:
            1. 3-5 key insights about this lead (opportunities, risks, observations)
            2. Optimal contact times and methods
            3. Communication preferences based on their behavior
            4. 2-3 recommended next actions
            
            For each insight, provide:
            - Type (opportunity, risk, suggestion, observation)
            - Description
            - Confidence (0.0 to 1.0)
            - Supporting data points
            - Suggested actions
            
            Return only a JSON object with this structure:
            {{
                "insights": [
                    {{
                        "type": "string",
                        "description": "string",
                        "confidence": float,
                        "supporting_data": {{}},
                        "suggested_actions": ["string"]
                    }}
                    // more insights
                ],
                "optimal_contact_times": {{
                    "email": ["string"],
                    "call": ["string"]
                }},
                "communication_preferences": {{
                    "email": float,
                    "call": float,
                    "sms": float,
                    "meeting": float
                }}
            }}
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
                insights_data = json.loads(clean_response)
                return json.dumps(insights_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse insights: {e}")
                return json.dumps({
                    "error": "Failed to parse insights",
                    "raw_response": response
                })
                
        except Exception as e:
            logger.error(f"Error generating insights: {str(e)}")
            return json.dumps({
                "error": f"Error generating insights: {str(e)}"
            })

# Define agent nodes for the InsightGenerator graph
async def fetch_lead_profile(state: InsightGeneratorState) -> InsightGeneratorState:
    """Fetch lead profile data."""
    if not state.lead_id:
        state.set_error("No lead ID provided for analysis")
        return state
    
    # Create tool instance
    lead_data_tool = FetchLeadDataTool()
    
    try:
        # Fetch lead data
        result = await lead_data_tool._arun(state.lead_id)
        lead_info = json.loads(result)
        
        # Update state
        state.lead_info = lead_info
        state.stage = "lead_profile_fetched"
        state.add_message("system", f"Retrieved lead profile for ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching lead profile: {str(e)}")
    
    return state

async def fetch_communication_data(state: InsightGeneratorState) -> InsightGeneratorState:
    """Fetch communication data for analysis."""
    if not state.lead_id:
        state.set_error("No lead ID provided for communication data")
        return state
    
    # Create tool instance
    communication_tool = FetchCommunicationDataTool()
    
    try:
        # Fetch communication data
        result = await communication_tool._arun(state.lead_id)
        communication_data = json.loads(result)
        
        # Update state
        state.emails = communication_data.get("emails", [])
        state.calls = communication_data.get("calls", [])
        state.meetings = communication_data.get("meetings", [])
        state.sms = communication_data.get("sms", [])
        
        state.stage = "communication_data_fetched"
        state.add_message("system", f"Retrieved communication data for lead ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching communication data: {str(e)}")
    
    return state

async def calculate_lead_score(state: InsightGeneratorState) -> InsightGeneratorState:
    """Calculate lead score based on multiple factors."""
    if not state.lead_info:
        state.set_error("No lead information available for scoring")
        return state
    
    # Create tool instance
    score_calculator = CalculateLeadScoreTool()
    
    try:
        # Prepare input for score calculation
        input_data = {
            "lead_info": state.lead_info,
            "emails": state.emails,
            "calls": state.calls,
            "meetings": state.meetings,
            "sms": state.sms
        }
        
        # Calculate lead score
        result = await score_calculator._arun(json.dumps(input_data))
        score_data = json.loads(result)
        
        # Update state
        state.score_components = score_data.get("components", [])
        state.stage = "lead_score_calculated"
        state.add_message("system", f"Calculated lead score: {score_data.get('overall_score', 0)}")
        
        # Store the score data for insight generation
        state.context["score_data"] = score_data
        
    except Exception as e:
        state.set_error(f"Error calculating lead score: {str(e)}")
    
    return state

async def generate_insights(state: InsightGeneratorState) -> InsightGeneratorState:
    """Generate insights and recommendations based on lead data."""
    if not state.lead_info or "score_data" not in state.context:
        state.set_error("Missing lead information or score data for insight generation")
        return state
    
    # Create tool instance
    insights_generator = GenerateInsightsTool()
    
    try:
        # Prepare input for insight generation
        input_data = {
            "lead_info": state.lead_info,
            "score_data": state.context["score_data"],
            "emails": state.emails,
            "calls": state.calls,
            "meetings": state.meetings,
            "sms": state.sms
        }
        
        # Generate insights
        result = await insights_generator._arun(json.dumps(input_data))
        insights_data = json.loads(result)
        
        # Update state
        state.insights = insights_data.get("insights", [])
        state.stage = "insights_generated"
        state.add_message("system", f"Generated {len(state.insights)} insights for lead")
        
        # Prepare result
        score_data = state.context["score_data"]
        
        # Convert components to correct format
        components = []
        for comp in score_data.get("components", []):
            components.append({
                "factor": comp.get("factor", "unknown"),
                "weight": comp.get("weight", 0.0),
                "score": comp.get("score", 0.0),
                "explanation": comp.get("explanation", "")
            })
        
        # Create lead score response
        lead_score = {
            "lead_id": state.lead_id,
            "overall_score": score_data.get("overall_score", 0.0),
            "conversion_probability": score_data.get("conversion_probability", 0.0),
            "components": components,
            "timestamp": datetime.now().isoformat()
        }
        
        # Create insights response
        insights_result = {
            "lead_id": state.lead_id,
            "insights": insights_data.get("insights", []),
            "optimal_contact_times": insights_data.get("optimal_contact_times", {}),
            "communication_preferences": insights_data.get("communication_preferences", {})
        }
        
        state.result = {
            "success": True,
            "message": "Successfully generated lead insights",
            "lead_score": lead_score,
            "insights": insights_result
        }
        
    except Exception as e:
        state.set_error(f"Error generating insights: {str(e)}")
    
    return state

# Define the state graph for the InsightGenerator
def create_insight_generator_graph() -> StateGraph:
    """Create the workflow graph for the InsightGenerator agent."""
    # Create the state graph
    workflow = StateGraph(InsightGeneratorState)
    
    # Add nodes
    workflow.add_node("fetch_lead_profile", fetch_lead_profile)
    workflow.add_node("fetch_communication_data", fetch_communication_data)
    workflow.add_node("calculate_lead_score", calculate_lead_score)
    workflow.add_node("generate_insights", generate_insights)
    
    # Define edges
    workflow.add_edge("fetch_lead_profile", "fetch_communication_data")
    workflow.add_edge("fetch_communication_data", "calculate_lead_score")
    workflow.add_edge("calculate_lead_score", "generate_insights")
    workflow.add_edge("generate_insights", END)
    
    # Set the entry point
    workflow.set_entry_point("fetch_lead_profile")
    
    return workflow

# Main agent class
class InsightGeneratorAgent:
    """Agent for generating insights and recommendations from lead data."""
    
    def __init__(self):
        self.graph = create_insight_generator_graph().compile()
        logger.info("InsightGenerator agent initialized")
    
    async def analyze_lead(
        self,
        lead_id: int,
    ) -> Dict[str, Any]:
        """
        Analyze a lead to generate insights and recommendations.
        
        Args:
            lead_id: ID of the lead to analyze
            
        Returns:
            Dictionary containing lead score and insights
        """
        # Initialize state
        initial_state = InsightGeneratorState(
            lead_id=lead_id,
            status="processing"
        )
        
        try:
            # Execute the workflow
            logger.info(f"Starting lead analysis workflow for lead ID: {lead_id}")
            final_state = await self.graph.ainvoke(initial_state)
            
            # Return the result
            return final_state.result if final_state.result else {
                "success": False,
                "error": final_state.errors[-1] if final_state.errors else "Unknown error"
            }
            
        except Exception as e:
            logger.error(f"Error in lead analysis workflow: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 