"""
Task Orchestrator Agent for the AI-powered CRM.

This agent is responsible for:
1. Prioritizing follow-up activities based on lead scores and insights
2. Suggesting optimal tasks and communication methods
3. Creating a coordinated sequence of actions across leads
4. Adapting to changes in lead status and behavior
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
from app.core.database import fetch_one, fetch_all, insert_row, update_row
from app.models.ai import FollowUpSuggestion, FollowUpSuggestionsResponse

# Configure logger
logger = logging.getLogger(__name__)

# Define TaskOrchestrator-specific state
class TaskOrchestratorState(AgentState):
    """State for the TaskOrchestrator agent."""
    # Lead ID for task orchestration
    lead_id: Optional[int] = None
    
    # Lead information
    lead_info: Dict[str, Any] = Field(default_factory=dict)
    
    # Lead insights and score
    insights: Dict[str, Any] = Field(default_factory=dict)
    
    # User's calendar and availability
    user_calendar: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Existing tasks
    existing_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Generated follow-up suggestions
    follow_up_suggestions: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Generated task plan
    task_plan: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Orchestration stage
    stage: str = "initial"
    
    # Result of orchestration
    result: Dict[str, Any] = Field(default_factory=dict)

# Define tools for the TaskOrchestrator agent
class FetchLeadWithInsightsTool(BaseTool):
    """Tool to fetch lead information with insights."""
    name: str = "fetch_lead_with_insights"
    description: str = "Fetch lead information along with insights and scoring."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch lead information with insights from the database."""
        logger.info(f"Fetching lead with insights for ID: {lead_id}")
        
        # This would normally fetch from the database
        # For now, we'll use dummy data
        
        # Dummy lead info with insights for testing
        lead_with_insights = {
            "lead_info": {
                "id": lead_id,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "company": "Acme Corp",
                "title": "CEO",
                "lead_score": 80,
                "status": "qualified",
                "created_at": "2023-01-15T10:00:00Z",
                "updated_at": "2023-03-10T15:30:00Z"
            },
            "insights": {
                "lead_score": {
                    "overall_score": 0.78,
                    "conversion_probability": 0.65,
                    "components": [
                        {
                            "factor": "email_engagement",
                            "weight": 0.3,
                            "score": 0.8,
                            "explanation": "High open and click rates"
                        },
                        {
                            "factor": "response_time",
                            "weight": 0.2,
                            "score": 0.7,
                            "explanation": "Typically responds within 24 hours"
                        },
                        {
                            "factor": "communication_frequency",
                            "weight": 0.2,
                            "score": 0.9,
                            "explanation": "Regular engagement over the past 2 months"
                        },
                        {
                            "factor": "sentiment",
                            "weight": 0.2,
                            "score": 0.6,
                            "explanation": "Generally positive sentiment in communications"
                        },
                        {
                            "factor": "demographic",
                            "weight": 0.1,
                            "score": 0.8,
                            "explanation": "Good fit for our target market"
                        }
                    ]
                },
                "insights": [
                    {
                        "type": "opportunity",
                        "description": "Highly interested in AI automation features",
                        "confidence": 0.9,
                        "supporting_data": {
                            "email_mentions": 3,
                            "call_discussions": 2
                        },
                        "suggested_actions": [
                            "Schedule product demo focusing on AI capabilities",
                            "Share case study on AI automation ROI"
                        ]
                    },
                    {
                        "type": "risk",
                        "description": "Concerned about implementation timeline",
                        "confidence": 0.7,
                        "supporting_data": {
                            "email_mentions": 1,
                            "call_discussions": 1
                        },
                        "suggested_actions": [
                            "Provide detailed implementation plan",
                            "Offer accelerated onboarding option"
                        ]
                    },
                    {
                        "type": "observation",
                        "description": "Decision will likely require board approval",
                        "confidence": 0.6,
                        "supporting_data": {
                            "email_mentions": 1
                        },
                        "suggested_actions": [
                            "Prepare board-level presentation materials",
                            "Identify and engage other stakeholders"
                        ]
                    }
                ],
                "optimal_contact_times": {
                    "email": ["morning", "tuesday", "wednesday"],
                    "call": ["afternoon", "thursday"]
                },
                "communication_preferences": {
                    "email": 0.8,
                    "call": 0.6,
                    "sms": 0.3,
                    "meeting": 0.7
                }
            }
        }
        
        return json.dumps(lead_with_insights)

class FetchUserCalendarTool(BaseTool):
    """Tool to fetch the user's calendar for scheduling."""
    name: str = "fetch_user_calendar"
    description: str = "Fetch the user's calendar to find availability for tasks."
    
    async def _arun(self, user_id: int) -> str:
        """Fetch the user's calendar from the database."""
        logger.info(f"Fetching calendar for user ID: {user_id}")
        
        # This would normally fetch from the database or calendar integration
        # For now, we'll use dummy data
        
        # Dummy calendar data for testing
        today = datetime.now()
        calendar_data = [
            {
                "id": 1,
                "title": "Team Meeting",
                "start_time": (today + timedelta(days=1, hours=10)).isoformat(),
                "end_time": (today + timedelta(days=1, hours=11)).isoformat(),
                "is_busy": True
            },
            {
                "id": 2,
                "title": "Lunch",
                "start_time": (today + timedelta(days=1, hours=12)).isoformat(),
                "end_time": (today + timedelta(days=1, hours=13)).isoformat(),
                "is_busy": True
            },
            {
                "id": 3,
                "title": "Client Call",
                "start_time": (today + timedelta(days=2, hours=14)).isoformat(),
                "end_time": (today + timedelta(days=2, hours=15)).isoformat(),
                "is_busy": True
            },
            {
                "id": 4,
                "title": "Product Demo",
                "start_time": (today + timedelta(days=3, hours=11)).isoformat(),
                "end_time": (today + timedelta(days=3, hours=12)).isoformat(),
                "is_busy": True
            }
        ]
        
        return json.dumps(calendar_data)

class FetchExistingTasksTool(BaseTool):
    """Tool to fetch existing tasks for a lead."""
    name: str = "fetch_existing_tasks"
    description: str = "Fetch existing tasks associated with a lead."
    
    async def _arun(self, lead_id: int) -> str:
        """Fetch existing tasks from the database."""
        logger.info(f"Fetching existing tasks for lead ID: {lead_id}")
        
        # This would normally fetch from the database
        # For now, we'll use dummy data
        
        # Dummy task data for testing
        today = datetime.now()
        tasks_data = [
            {
                "id": 101,
                "title": "Follow up on initial conversation",
                "description": "Send an email to check if they reviewed the materials",
                "due_date": (today - timedelta(days=2)).isoformat(),
                "status": "completed",
                "priority": "medium",
                "task_type": "email"
            },
            {
                "id": 102,
                "title": "Schedule product demo",
                "description": "Reach out to schedule a comprehensive product demo",
                "due_date": (today + timedelta(days=3)).isoformat(),
                "status": "pending",
                "priority": "high",
                "task_type": "call"
            }
        ]
        
        return json.dumps(tasks_data)

class GenerateFollowUpSuggestionsTool(BaseTool):
    """Tool to generate follow-up suggestions for a lead."""
    name: str = "generate_follow_up_suggestions"
    description: str = "Generate personalized follow-up suggestions for a lead."
    
    async def _arun(self, input_json: str) -> str:
        """Generate follow-up suggestions based on lead data and insights."""
        logger.info("Generating follow-up suggestions")
        
        try:
            input_data = json.loads(input_json)
            
            lead_info = input_data.get("lead_info", {})
            insights = input_data.get("insights", {})
            existing_tasks = input_data.get("existing_tasks", [])
            
            llm = await create_llm()
            
            prompt = f"""
            Generate follow-up suggestions for this lead based on their profile, insights, and existing tasks.
            
            Lead Information:
            {json.dumps(lead_info, indent=2)}
            
            Lead Insights:
            {json.dumps(insights, indent=2)}
            
            Existing Tasks:
            {json.dumps(existing_tasks, indent=2)}
            
            Generate 3-5 follow-up suggestions that are:
            1. Personalized to this lead's interests and behavior
            2. Timed appropriately relative to existing tasks
            3. Using their preferred communication methods
            4. Addressing the opportunities and risks identified in the insights
            
            For each suggestion, provide:
            - Type (email, call, meeting, task)
            - Priority (0.0 to 1.0)
            - Suggested timing (e.g., "tomorrow morning", "next week", "in 3 days")
            - Template or content outline
            - Explanation of why this is recommended
            
            Return only a JSON object with this structure:
            {{
                "suggestions": [
                    {{
                        "type": "string",
                        "priority": float,
                        "suggested_timing": "string",
                        "template": "string",
                        "explanation": "string"
                    }}
                    // more suggestions
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
                suggestions_data = json.loads(clean_response)
                return json.dumps(suggestions_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse follow-up suggestions: {e}")
                return json.dumps({
                    "error": "Failed to parse follow-up suggestions",
                    "raw_response": response
                })
                
        except Exception as e:
            logger.error(f"Error generating follow-up suggestions: {str(e)}")
            return json.dumps({
                "error": f"Error generating follow-up suggestions: {str(e)}"
            })

class CreateTaskPlanTool(BaseTool):
    """Tool to create a comprehensive task plan for a lead."""
    name: str = "create_task_plan"
    description: str = "Create a comprehensive task plan for a lead based on follow-up suggestions and calendar."
    
    async def _arun(self, input_json: str) -> str:
        """Create a task plan based on suggestions and calendar availability."""
        logger.info("Creating task plan")
        
        try:
            input_data = json.loads(input_json)
            
            lead_info = input_data.get("lead_info", {})
            follow_up_suggestions = input_data.get("follow_up_suggestions", [])
            user_calendar = input_data.get("user_calendar", [])
            
            llm = await create_llm()
            
            prompt = f"""
            Create a comprehensive task plan for this lead based on the follow-up suggestions and user's calendar.
            
            Lead Information:
            {json.dumps(lead_info, indent=2)}
            
            Follow-up Suggestions:
            {json.dumps(follow_up_suggestions, indent=2)}
            
            User's Calendar:
            {json.dumps(user_calendar, indent=2)}
            
            Create a sequenced plan of tasks that:
            1. Schedules high priority items first
            2. Avoids conflicts with the user's calendar
            3. Spaces tasks appropriately for effective follow-up
            4. Considers the lead's optimal contact times if available
            
            For each task in the plan, provide:
            - Task type (email, call, meeting, task)
            - Title
            - Description
            - Scheduled time (specific datetime)
            - Duration (in minutes)
            - Priority (high, medium, low)
            - Notes for the user
            
            Return only a JSON object with this structure:
            {{
                "tasks": [
                    {{
                        "task_type": "string",
                        "title": "string",
                        "description": "string", 
                        "scheduled_time": "ISO datetime",
                        "duration": integer,
                        "priority": "string",
                        "notes": "string"
                    }}
                    // more tasks
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
                task_plan_data = json.loads(clean_response)
                return json.dumps(task_plan_data)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse task plan: {e}")
                return json.dumps({
                    "error": "Failed to parse task plan",
                    "raw_response": response
                })
                
        except Exception as e:
            logger.error(f"Error creating task plan: {str(e)}")
            return json.dumps({
                "error": f"Error creating task plan: {str(e)}"
            })

# Define agent nodes for the TaskOrchestrator graph
async def get_lead_with_insights(state: TaskOrchestratorState) -> TaskOrchestratorState:
    """Fetch lead information with insights."""
    if not state.lead_id:
        state.set_error("No lead ID provided for task orchestration")
        return state
    
    # Create tool instance
    lead_insight_tool = FetchLeadWithInsightsTool()
    
    try:
        # Fetch lead with insights
        result = await lead_insight_tool._arun(state.lead_id)
        lead_data = json.loads(result)
        
        # Update state
        state.lead_info = lead_data.get("lead_info", {})
        state.insights = lead_data.get("insights", {})
        state.stage = "lead_data_fetched"
        state.add_message("system", f"Retrieved lead information and insights for ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching lead with insights: {str(e)}")
    
    return state

async def get_user_calendar(state: TaskOrchestratorState) -> TaskOrchestratorState:
    """Fetch user's calendar for scheduling."""
    # For now, we'll use a dummy user ID of 1
    user_id = 1
    
    # Create tool instance
    calendar_tool = FetchUserCalendarTool()
    
    try:
        # Fetch user calendar
        result = await calendar_tool._arun(user_id)
        calendar_data = json.loads(result)
        
        # Update state
        state.user_calendar = calendar_data
        state.stage = "calendar_fetched"
        state.add_message("system", f"Retrieved calendar for user ID: {user_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching user calendar: {str(e)}")
    
    return state

async def get_existing_tasks(state: TaskOrchestratorState) -> TaskOrchestratorState:
    """Fetch existing tasks for the lead."""
    if not state.lead_id:
        state.set_error("No lead ID provided for fetching tasks")
        return state
    
    # Create tool instance
    tasks_tool = FetchExistingTasksTool()
    
    try:
        # Fetch existing tasks
        result = await tasks_tool._arun(state.lead_id)
        tasks_data = json.loads(result)
        
        # Update state
        state.existing_tasks = tasks_data
        state.stage = "tasks_fetched"
        state.add_message("system", f"Retrieved existing tasks for lead ID: {state.lead_id}")
        
    except Exception as e:
        state.set_error(f"Error fetching existing tasks: {str(e)}")
    
    return state

async def generate_follow_up_suggestions(state: TaskOrchestratorState) -> TaskOrchestratorState:
    """Generate follow-up suggestions for the lead."""
    if not state.lead_info or not state.insights:
        state.set_error("Missing lead information or insights for generating follow-up suggestions")
        return state
    
    # Create tool instance
    suggestions_tool = GenerateFollowUpSuggestionsTool()
    
    try:
        # Prepare input for generating suggestions
        input_data = {
            "lead_info": state.lead_info,
            "insights": state.insights,
            "existing_tasks": state.existing_tasks
        }
        
        # Generate follow-up suggestions
        result = await suggestions_tool._arun(json.dumps(input_data))
        suggestions_data = json.loads(result)
        
        # Update state
        state.follow_up_suggestions = suggestions_data.get("suggestions", [])
        state.stage = "suggestions_generated"
        state.add_message("system", f"Generated {len(state.follow_up_suggestions)} follow-up suggestions")
        
    except Exception as e:
        state.set_error(f"Error generating follow-up suggestions: {str(e)}")
    
    return state

async def create_task_plan(state: TaskOrchestratorState) -> TaskOrchestratorState:
    """Create a comprehensive task plan for the lead."""
    if not state.lead_info or not state.follow_up_suggestions:
        state.set_error("Missing lead information or follow-up suggestions for creating task plan")
        return state
    
    # Create tool instance
    task_plan_tool = CreateTaskPlanTool()
    
    try:
        # Prepare input for creating task plan
        input_data = {
            "lead_info": state.lead_info,
            "follow_up_suggestions": state.follow_up_suggestions,
            "user_calendar": state.user_calendar
        }
        
        # Create task plan
        result = await task_plan_tool._arun(json.dumps(input_data))
        task_plan_data = json.loads(result)
        
        # Update state
        state.task_plan = task_plan_data.get("tasks", [])
        state.stage = "task_plan_created"
        state.add_message("system", f"Created task plan with {len(state.task_plan)} tasks")
        
        # Prepare final result
        state.result = {
            "success": True,
            "message": "Successfully created task plan",
            "lead_id": state.lead_id,
            "follow_up_suggestions": state.follow_up_suggestions,
            "task_plan": state.task_plan
        }
        
    except Exception as e:
        state.set_error(f"Error creating task plan: {str(e)}")
    
    return state

# Define the state graph for the TaskOrchestrator
def create_task_orchestrator_graph() -> StateGraph:
    """Create the workflow graph for the TaskOrchestrator agent."""
    # Create the state graph
    workflow = StateGraph(TaskOrchestratorState)
    
    # Add nodes
    workflow.add_node("get_lead_with_insights", get_lead_with_insights)
    workflow.add_node("get_user_calendar", get_user_calendar)
    workflow.add_node("get_existing_tasks", get_existing_tasks)
    workflow.add_node("generate_follow_up_suggestions", generate_follow_up_suggestions)
    workflow.add_node("create_task_plan", create_task_plan)
    
    # Define edges
    workflow.add_edge("get_lead_with_insights", "get_user_calendar")
    workflow.add_edge("get_user_calendar", "get_existing_tasks")
    workflow.add_edge("get_existing_tasks", "generate_follow_up_suggestions")
    workflow.add_edge("generate_follow_up_suggestions", "create_task_plan")
    workflow.add_edge("create_task_plan", END)
    
    # Set the entry point
    workflow.set_entry_point("get_lead_with_insights")
    
    return workflow

# Main agent class
class TaskOrchestratorAgent:
    """Agent for orchestrating tasks and follow-ups for leads."""
    
    def __init__(self):
        self.graph = create_task_orchestrator_graph().compile()
        logger.info("TaskOrchestrator agent initialized")
    
    async def create_follow_up_plan(
        self,
        lead_id: int,
    ) -> Dict[str, Any]:
        """
        Create a follow-up plan for a lead with tasks and scheduling.
        
        Args:
            lead_id: ID of the lead to create a plan for
            
        Returns:
            Dictionary containing follow-up suggestions and task plan
        """
        # Initialize state
        initial_state = TaskOrchestratorState(
            lead_id=lead_id,
            status="processing"
        )
        
        try:
            # Execute the workflow
            logger.info(f"Starting task orchestration workflow for lead ID: {lead_id}")
            final_state = await self.graph.ainvoke(initial_state)
            
            # Return the result
            return final_state.result if final_state.result else {
                "success": False,
                "error": final_state.errors[-1] if final_state.errors else "Unknown error"
            }
            
        except Exception as e:
            logger.error(f"Error in task orchestration workflow: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            } 