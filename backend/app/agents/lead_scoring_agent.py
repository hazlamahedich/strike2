"""
Lead Scoring Agent for the AI-powered CRM.

This agent is responsible for:
1. Analyzing lead interaction data across multiple channels
2. Generating intelligent lead scores based on engagement patterns
3. Providing recommendations for lead prioritization
4. Identifying trends in lead behavior for better targeting
"""

import json
import logging
from typing import Any, Dict, List, Optional, Union, Tuple, cast
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from langchain.agents import AgentExecutor
from langchain.schema.runnable import RunnableMap
from langchain.prompts import ChatPromptTemplate
from langchain.tools import BaseTool
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from app.agents.base import AgentState, create_llm, create_system_message, create_human_message, CentralizedLLM
from app.core.config import settings
from app.core.database import fetch_one, fetch_all, insert_row, update_row
from app.models.lead import Lead
from app.services import lead as lead_service
from app.db.models import Interaction
from app.db.session import AsyncSession

# Configure logger
logger = logging.getLogger(__name__)

# Define LeadScoring-specific state
class LeadScoringState(AgentState):
    """State for the LeadScoring agent."""
    # Lead ID to analyze
    lead_id: Optional[int] = None
    
    # Timeframe for analysis
    timeframe_days: int = 30
    
    # Interaction data retrieved from the database
    interaction_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Engagement metrics
    engagement_metrics: Dict[str, Any] = Field(default_factory=dict)
    
    # Lead scoring results
    score_result: Dict[str, Any] = Field(default_factory=dict)
    
    # Recommendations for follow-up
    recommendations: List[str] = Field(default_factory=list)
    
    # Analysis stage
    stage: str = "initial"

# Define tools for the LeadScoring agent
class FetchLeadInteractionsTool(BaseTool):
    """Tool to fetch all interactions for a lead across all channels."""
    name: str = "fetch_lead_interactions"
    description: str = "Fetch all interactions (emails, calls, SMS, meetings, notes) for a specific lead."
    
    def __init__(self, db_session: AsyncSession):
        super().__init__()
        self.db_session = db_session
    
    async def _arun(self, lead_id: Union[str, int], days: Union[str, int] = 30) -> str:
        """Fetch interactions for the specified lead."""
        logger.info(f"Fetching interactions for lead ID: {lead_id} from the last {days} days")
        
        # Convert inputs to proper types
        lead_id_int = int(lead_id)
        days_int = int(days)
        
        # Calculate the date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_int)
        
        # Query to fetch emails
        emails_query = """
        SELECT id, lead_id, subject, body, sent_at, direction, opened, clicked
        FROM emails
        WHERE lead_id = :lead_id AND sent_at >= :start_date
        ORDER BY sent_at DESC
        """
        emails = await fetch_all(emails_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Query to fetch calls
        calls_query = """
        SELECT id, lead_id, duration, call_type, notes, occurred_at
        FROM calls
        WHERE lead_id = :lead_id AND occurred_at >= :start_date
        ORDER BY occurred_at DESC
        """
        calls = await fetch_all(calls_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Query to fetch SMS
        sms_query = """
        SELECT id, lead_id, body, sent_at, direction
        FROM sms
        WHERE lead_id = :lead_id AND sent_at >= :start_date
        ORDER BY sent_at DESC
        """
        sms = await fetch_all(sms_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Query to fetch meetings
        meetings_query = """
        SELECT id, lead_id, title, description, start_time, end_time, notes
        FROM meetings
        WHERE lead_id = :lead_id AND start_time >= :start_date
        ORDER BY start_time DESC
        """
        meetings = await fetch_all(meetings_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Query to fetch notes
        notes_query = """
        SELECT id, lead_id, content, created_at
        FROM notes
        WHERE lead_id = :lead_id AND created_at >= :start_date
        ORDER BY created_at DESC
        """
        notes = await fetch_all(notes_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Query to fetch all activities
        activities_query = """
        SELECT id, lead_id, user_id, activity_type, activity_id, created_at, metadata
        FROM activities
        WHERE lead_id = :lead_id AND created_at >= :start_date
        ORDER BY created_at DESC
        """
        activities = await fetch_all(activities_query, {"lead_id": lead_id_int, "start_date": start_date})
        
        # Combine all interactions
        interactions = {
            "emails": emails,
            "calls": calls,
            "sms": sms,
            "meetings": meetings,
            "notes": notes,
            "activities": activities,
            "timeframe_days": days_int,
            "lead_id": lead_id_int
        }
        
        return json.dumps(interactions)

class CalculateEngagementMetricsTool(BaseTool):
    """Tool to calculate engagement metrics from interaction data."""
    name: str = "calculate_engagement_metrics"
    description: str = "Calculate engagement metrics from interaction data."
    
    async def _arun(self, interaction_data_str: str) -> str:
        """Calculate engagement metrics from the interaction data."""
        logger.info("Calculating engagement metrics")
        
        # Parse the interaction data
        interaction_data = json.loads(interaction_data_str)
        
        # Extract the components
        emails = interaction_data.get("emails", [])
        calls = interaction_data.get("calls", [])
        sms = interaction_data.get("sms", [])
        meetings = interaction_data.get("meetings", [])
        notes = interaction_data.get("notes", [])
        activities = interaction_data.get("activities", [])
        timeframe_days = interaction_data.get("timeframe_days", 30)
        
        # Calculate email engagement
        total_emails = len(emails)
        outbound_emails = sum(1 for email in emails if email.get("direction") == "outbound")
        inbound_emails = total_emails - outbound_emails
        opened_emails = sum(1 for email in emails if email.get("opened") is True)
        clicked_emails = sum(1 for email in emails if email.get("clicked") is True)
        
        email_open_rate = opened_emails / outbound_emails if outbound_emails > 0 else 0
        email_click_rate = clicked_emails / outbound_emails if outbound_emails > 0 else 0
        
        # Calculate call engagement
        total_calls = len(calls)
        total_call_duration = sum(call.get("duration", 0) for call in calls)
        avg_call_duration = total_call_duration / total_calls if total_calls > 0 else 0
        
        # Calculate SMS engagement
        total_sms = len(sms)
        outbound_sms = sum(1 for msg in sms if msg.get("direction") == "outbound")
        inbound_sms = total_sms - outbound_sms
        
        # Calculate meeting engagement
        total_meetings = len(meetings)
        total_meeting_duration = sum((
            (datetime.fromisoformat(meeting.get("end_time")) - 
             datetime.fromisoformat(meeting.get("start_time"))).total_seconds() / 60
        ) for meeting in meetings if meeting.get("end_time") and meeting.get("start_time"))
        
        # Calculate activity frequency
        if timeframe_days > 0:
            activity_per_day = len(activities) / timeframe_days
        else:
            activity_per_day = 0
        
        # Calculate recency score
        now = datetime.now()
        
        # Get the most recent activity timestamps
        all_timestamps = []
        
        for email in emails:
            if email.get("sent_at"):
                all_timestamps.append(datetime.fromisoformat(email.get("sent_at")))
        
        for call in calls:
            if call.get("occurred_at"):
                all_timestamps.append(datetime.fromisoformat(call.get("occurred_at")))
        
        for msg in sms:
            if msg.get("sent_at"):
                all_timestamps.append(datetime.fromisoformat(msg.get("sent_at")))
        
        for meeting in meetings:
            if meeting.get("start_time"):
                all_timestamps.append(datetime.fromisoformat(meeting.get("start_time")))
        
        # Calculate recency score
        most_recent = max(all_timestamps) if all_timestamps else now
        days_since_last_activity = (now - most_recent).days
        
        recency_score = max(0, 1 - (days_since_last_activity / 30)) if days_since_last_activity <= 30 else 0
        
        # Compile the engagement metrics
        engagement_metrics = {
            "email_metrics": {
                "total_emails": total_emails,
                "outbound_emails": outbound_emails,
                "inbound_emails": inbound_emails,
                "open_rate": email_open_rate,
                "click_rate": email_click_rate
            },
            "call_metrics": {
                "total_calls": total_calls,
                "total_duration_mins": total_call_duration,
                "avg_duration_mins": avg_call_duration
            },
            "sms_metrics": {
                "total_sms": total_sms,
                "outbound_sms": outbound_sms,
                "inbound_sms": inbound_sms
            },
            "meeting_metrics": {
                "total_meetings": total_meetings,
                "total_duration_mins": total_meeting_duration
            },
            "activity_metrics": {
                "total_activities": len(activities),
                "activity_per_day": activity_per_day,
                "days_since_last_activity": days_since_last_activity,
                "recency_score": recency_score
            }
        }
        
        return json.dumps(engagement_metrics)

class GenerateLeadScoreTool(BaseTool):
    """Tool to generate a lead score based on engagement metrics."""
    name: str = "generate_lead_score"
    description: str = "Generate a lead score based on engagement metrics."
    
    def __init__(self):
        super().__init__()
        self.llm_client = None
    
    async def _initialize_llm(self):
        if not self.llm_client:
            self.llm_client = await create_llm(
                temperature=0.2, 
                feature_name="lead_scoring"
            )
    
    async def _arun(self, metrics_str: str, lead_id: Union[str, int]) -> str:
        """Generate a lead score based on the engagement metrics."""
        logger.info(f"Generating lead score for lead ID: {lead_id}")
        
        # Parse the metrics
        metrics = json.loads(metrics_str)
        lead_id_int = int(lead_id)
        
        # Fetch basic lead information
        lead_query = """
        SELECT id, first_name, last_name, email, phone, company, title, status, source, created_at
        FROM leads
        WHERE id = :lead_id
        """
        lead_data = await fetch_one(lead_query, {"lead_id": lead_id_int})
        
        if not lead_data:
            return json.dumps({"error": f"Lead with ID {lead_id} not found"})
        
        # Create a prompt for the LLM
        prompt = f"""
        Analyze the engagement data for this lead and generate a lead score from 0-100, 
        where 0 is completely unengaged and 100 is extremely engaged and ready to convert.
        
        Lead Information:
        - Name: {lead_data.get("first_name", "")} {lead_data.get("last_name", "")}
        - Company: {lead_data.get("company", "")}
        - Title: {lead_data.get("title", "")}
        - Status: {lead_data.get("status", "")}
        - Source: {lead_data.get("source", "")}
        - Created At: {lead_data.get("created_at", "")}
        
        Engagement Metrics:
        {json.dumps(metrics, indent=2)}
        
        Analyze these metrics to determine:
        1. Overall engagement level (0-100)
        2. Key factors affecting the score
        3. Recommended next actions to increase engagement
        4. Probability of conversion (percentage)
        
        Return a JSON object with the following structure:
        {{
            "lead_score": <0-100 score>,
            "factors": [<list of key factors affecting the score>],
            "recommendations": [<list of recommended next actions>],
            "conversion_probability": <0-100 percentage>,
            "analysis": "<brief analysis of the lead's engagement>"
        }}
        
        Only return the JSON object, no other text.
        """
        
        try:
            await self._initialize_llm()
            
            # If using a CentralizedLLM instance 
            if isinstance(self.llm_client, CentralizedLLM):
                result_json = await self.llm_client.apredict_json(prompt)
            else:
                # Legacy path for direct OpenAI usage
                result = await self.llm_client.apredict(prompt)
                # Parse the result
                try:
                    # Try to parse as JSON directly
                    result_json = json.loads(result)
                except json.JSONDecodeError:
                    # Try to extract JSON from the text
                    import re
                    match = re.search(r"```json\s*(.*?)\s*```", result, re.DOTALL)
                    if match:
                        json_str = match.group(1)
                        result_json = json.loads(json_str)
                    else:
                        raise ValueError("Unable to parse LLM response as JSON")
            
            # Validate and format the result
            validated_result = {
                "lead_id": lead_id_int,
                "lead_score": result_json.get("lead_score", 0),
                "conversion_probability": result_json.get("conversion_probability", 0),
                "factors": result_json.get("factors", []),
                "recommendations": result_json.get("recommendations", []),
                "analysis": result_json.get("analysis"),
            }
            
            # Save the lead score to the database
            score_insert_query = """
            INSERT INTO lead_scores (lead_id, score, factors, recommendations, conversion_probability, analysis, created_at)
            VALUES (:lead_id, :score, :factors, :recommendations, :conversion_probability, :analysis, NOW())
            RETURNING id
            """
            
            score_params = {
                "lead_id": lead_id_int,
                "score": validated_result["lead_score"],
                "factors": json.dumps(validated_result["factors"]),
                "recommendations": json.dumps(validated_result["recommendations"]),
                "conversion_probability": validated_result["conversion_probability"],
                "analysis": validated_result["analysis"]
            }
            
            score_id = await insert_row(score_insert_query, score_params)
            validated_result["score_id"] = score_id
            
            return json.dumps(validated_result)
        
        except Exception as e:
            logger.error(f"Error generating lead score: {str(e)}")
            return json.dumps({"error": str(e)})

# Define the state transitions for the LeadScoring agent
async def fetch_interactions(state: LeadScoringState, session: AsyncSession) -> LeadScoringState:
    """Fetch all interactions for the lead."""
    logger.info(f"Fetching interactions for lead ID: {state.lead_id}")
    
    if not state.lead_id:
        state.set_error("No lead ID provided")
        return state
    
    try:
        tool = FetchLeadInteractionsTool(session)
        result = await tool._arun(lead_id=state.lead_id, days=state.timeframe_days)
        state.interaction_data = json.loads(result)
        state.stage = "interactions_fetched"
        state.add_message("system", f"Successfully fetched interactions for lead ID: {state.lead_id}")
    except Exception as e:
        state.set_error(f"Error fetching interactions: {str(e)}")
    
    return state

async def calculate_metrics(state: LeadScoringState) -> LeadScoringState:
    """Calculate engagement metrics from interaction data."""
    logger.info("Calculating engagement metrics")
    
    if state.stage != "interactions_fetched":
        state.set_error("Cannot calculate metrics without interaction data")
        return state
    
    try:
        tool = CalculateEngagementMetricsTool()
        result = await tool._arun(interaction_data_str=json.dumps(state.interaction_data))
        state.engagement_metrics = json.loads(result)
        state.stage = "metrics_calculated"
        state.add_message("system", "Successfully calculated engagement metrics")
    except Exception as e:
        state.set_error(f"Error calculating metrics: {str(e)}")
    
    return state

async def generate_score(state: LeadScoringState) -> LeadScoringState:
    """Generate a lead score based on engagement metrics."""
    logger.info("Generating lead score")
    
    if state.stage != "metrics_calculated":
        state.set_error("Cannot generate score without metrics")
        return state
    
    try:
        tool = GenerateLeadScoreTool()
        result = await tool._arun(metrics_str=json.dumps(state.engagement_metrics), lead_id=state.lead_id)
        state.score_result = json.loads(result)
        state.recommendations = state.score_result.get("recommendations", [])
        state.stage = "score_generated"
        state.add_message("system", "Successfully generated lead score")
    except Exception as e:
        state.set_error(f"Error generating score: {str(e)}")
    
    return state

def should_end(state: LeadScoringState) -> bool:
    """Determine if the workflow should end."""
    return state.stage == "score_generated" or state.status == "error"

def create_lead_scoring_graph() -> StateGraph:
    """Create the workflow for lead scoring."""
    # Create the state graph
    workflow = StateGraph(LeadScoringState)
    
    # Define the nodes
    workflow.add_node("fetch_interactions", fetch_interactions)
    workflow.add_node("calculate_metrics", calculate_metrics)
    workflow.add_node("generate_score", generate_score)
    
    # Define the edges
    workflow.add_edge("fetch_interactions", "calculate_metrics")
    workflow.add_edge("calculate_metrics", "generate_score")
    
    # Set the entry point
    workflow.set_entry_point("fetch_interactions")
    
    # Set conditional edges
    workflow.add_conditional_edges(
        "generate_score",
        should_end,
        {
            True: END,
            False: "fetch_interactions"  # This should never happen, but just in case
        }
    )
    
    return workflow

class LeadScoringAgent:
    """Agent for scoring leads based on their engagement and interaction data."""
    
    def __init__(self):
        """Initialize the LeadScoring agent."""
        self.workflow = create_lead_scoring_graph().compile()
    
    async def score_lead(
        self,
        lead_id: int,
        timeframe_days: int = 30
    ) -> Dict[str, Any]:
        """
        Score a lead based on their interaction data.
        
        Args:
            lead_id: ID of the lead to score
            timeframe_days: Number of days of history to analyze
            
        Returns:
            Dictionary containing the lead score and recommendations
        """
        logger.info(f"Scoring lead ID: {lead_id} with timeframe of {timeframe_days} days")
        
        # Create the initial state
        state = LeadScoringState(
            lead_id=lead_id,
            timeframe_days=timeframe_days,
            stage="initial",
            status="idle"
        )
        
        # Execute the workflow
        result = await self.workflow.ainvoke(state)
        
        # Prepare the result
        if result.status == "error":
            return {
                "status": "error",
                "errors": result.errors,
                "lead_id": lead_id
            }
        
        return {
            "status": "success",
            "lead_id": lead_id,
            "timeframe_days": timeframe_days,
            "lead_score": result.score_result.get("lead_score"),
            "conversion_probability": result.score_result.get("conversion_probability"),
            "factors": result.score_result.get("factors", []),
            "recommendations": result.score_result.get("recommendations", []),
            "analysis": result.score_result.get("analysis"),
            "score_id": result.score_result.get("score_id")
        } 