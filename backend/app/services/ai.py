import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from openai import AsyncOpenAI
from langchain.chains import LLMChain
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage
from langchain.prompts import PromptTemplate
from langchain.prompts.chat import ChatPromptTemplate

from app.core.config import settings
from app.models.ai import (
    SentimentScore, 
    SentimentAnalysisRequest, 
    SentimentAnalysisResponse,
    LeadScoreFactors,
    LeadScoreComponent,
    LeadScoreResponse,
    ContentGenerationRequest,
    ContentGenerationResponse,
    LeadInsightsResponse,
    LeadInsight,
    FollowUpSuggestion,
    FollowUpSuggestionsResponse
)
from app.services import lead as lead_service
from app.core.database import fetch_one, fetch_all, insert_row, update_row
from app.agents.agent_manager import agent_manager

# Initialize OpenAI client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

async def analyze_sentiment(request: SentimentAnalysisRequest) -> SentimentAnalysisResponse:
    """
    Analyze sentiment of text using OpenAI.
    """
    try:
        # Create the prompt for sentiment analysis
        prompt = f"""
        Analyze the sentiment of the following text and provide a detailed breakdown:
        
        Text: {request.text}
        
        Respond with a JSON object that includes:
        1. overall_score: A float between -1.0 (very negative) and 1.0 (very positive)
        2. positive: A float between 0.0 and 1.0 indicating likelihood of positive sentiment
        3. neutral: A float between 0.0 and 1.0 indicating likelihood of neutral sentiment
        4. negative: A float between 0.0 and 1.0 indicating likelihood of negative sentiment
        5. key_phrases: An array of important phrases or topics detected in the text
        6. entities: An array of objects with name and type for entities mentioned
        
        JSON format only, no explanations.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a sentiment analysis assistant. Respond only with JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Create sentiment score
        sentiment = SentimentScore(
            score=result.get("overall_score", 0),
            positive=result.get("positive", 0),
            neutral=result.get("neutral", 0),
            negative=result.get("negative", 0)
        )
        
        # Return the response
        return SentimentAnalysisResponse(
            text=request.text,
            sentiment=sentiment,
            key_phrases=result.get("key_phrases", []),
            entities=result.get("entities", [])
        )
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {str(e)}")
        # Fallback to a neutral sentiment
        return SentimentAnalysisResponse(
            text=request.text,
            sentiment=SentimentScore(score=0, positive=0.33, neutral=0.34, negative=0.33),
            key_phrases=[],
            entities=[]
        )

async def calculate_lead_score(lead_id: int, force_recalculate: bool = False) -> LeadScoreResponse:
    """
    Calculate a lead score based on multiple factors.
    """
    try:
        # Get the lead
        lead = await lead_service.get_lead_by_id(lead_id)
        if not lead:
            raise ValueError(f"Lead with ID {lead_id} not found")
        
        # Get lead interactions
        emails = await fetch_all("emails", {"lead_id": lead_id})
        calls = await fetch_all("calls", {"lead_id": lead_id})
        sms = await fetch_all("sms", {"lead_id": lead_id})
        meetings = await fetch_all("meetings", {"lead_id": lead_id})
        
        # Check for recent score calculation (unless force_recalculate is True)
        if not force_recalculate:
            recent_score = await fetch_one(
                "lead_scores", 
                {"lead_id": lead_id},
                order_by={"created_at": "desc"}
            )
            
            # If we have a recent score (within last 24 hours), return it
            if recent_score and (datetime.now() - recent_score["created_at"]).total_seconds() < 86400:
                components = [
                    LeadScoreComponent(
                        factor=component["factor"],
                        weight=component["weight"],
                        score=component["score"],
                        explanation=component["explanation"]
                    )
                    for component in recent_score["components"]
                ]
                
                return LeadScoreResponse(
                    lead_id=lead_id,
                    overall_score=recent_score["overall_score"],
                    conversion_probability=recent_score["conversion_probability"],
                    components=components,
                    timestamp=recent_score["created_at"],
                    next_best_actions=recent_score.get("next_best_actions", [])
                )
        
        # Prepare data for AI analysis
        lead_data = {
            "id": lead.id,
            "name": f"{lead.first_name} {lead.last_name}",
            "email": lead.email,
            "company": lead.company,
            "title": lead.title,
            "source": lead.source,
            "status": lead.status,
            "created_at": lead.created_at.isoformat(),
            "custom_fields": lead.custom_fields,
            "interactions": {
                "emails": len(emails),
                "calls": len(calls),
                "sms": len(sms),
                "meetings": len(meetings)
            }
        }
        
        # Calculate lead score using LLM
        prompt = f"""
        Analyze the following lead data and calculate a lead score based on multiple factors.
        
        Lead Data: {json.dumps(lead_data)}
        
        Provide a JSON response with:
        1. overall_score: A float between 0.0 and 1.0 representing the lead's quality
        2. conversion_probability: A float between 0.0 and 1.0 for conversion likelihood
        3. components: An array of scoring components with:
           - factor: One of {[f.value for f in LeadScoreFactors]}
           - weight: A float between 0.0 and 1.0 for importance
           - score: A float between 0.0 and 1.0 for that factor
           - explanation: A string explaining the score
        4. next_best_actions: An array of recommended actions
        
        JSON format only.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a lead scoring assistant. Respond only with JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Create components
        components = [
            LeadScoreComponent(
                factor=component["factor"],
                weight=component["weight"],
                score=component["score"],
                explanation=component["explanation"]
            )
            for component in result.get("components", [])
        ]
        
        # Create response
        score_response = LeadScoreResponse(
            lead_id=lead_id,
            overall_score=result.get("overall_score", 0.5),
            conversion_probability=result.get("conversion_probability", 0.5),
            components=components,
            timestamp=datetime.now(),
            next_best_actions=result.get("next_best_actions", [])
        )
        
        # Save the score to the database
        score_data = {
            "lead_id": lead_id,
            "overall_score": score_response.overall_score,
            "conversion_probability": score_response.conversion_probability,
            "components": [comp.dict() for comp in components],
            "next_best_actions": score_response.next_best_actions,
            "created_at": datetime.now()
        }
        await insert_row("lead_scores", score_data)
        
        # Update the lead with the new score
        await lead_service.update_lead(
            lead_id, 
            {"lead_score": score_response.overall_score}
        )
        
        return score_response
        
    except Exception as e:
        logger.error(f"Error in lead scoring: {str(e)}")
        # Return a default score
        components = [
            LeadScoreComponent(
                factor=LeadScoreFactors.COMMUNICATION_FREQUENCY,
                weight=0.5,
                score=0.5,
                explanation="Default score due to error in calculation"
            )
        ]
        return LeadScoreResponse(
            lead_id=lead_id,
            overall_score=0.5,
            conversion_probability=0.5,
            components=components,
            timestamp=datetime.now(),
            next_best_actions=[]
        )

async def generate_content(request: ContentGenerationRequest) -> ContentGenerationResponse:
    """
    Generate content for emails, SMS, etc. using OpenAI.
    """
    try:
        # Get lead information
        lead = await lead_service.get_lead_by_id(request.lead_id)
        if not lead:
            raise ValueError(f"Lead with ID {request.lead_id} not found")
        
        # Get recent interactions
        recent_interactions = await lead_service.get_lead_timeline(request.lead_id, limit=5)
        
        # Create the prompt
        prompt = f"""
        Generate content for a {request.content_type} to a lead with the following details:
        
        Lead: {lead.first_name} {lead.last_name}
        Company: {lead.company or 'Not specified'}
        Title: {lead.title or 'Not specified'}
        Status: {lead.status}
        
        Purpose: {request.purpose}
        Tone: {request.tone}
        
        Recent interactions:
        {json.dumps(recent_interactions)}
        
        Key points to include:
        {json.dumps(request.key_points) if request.key_points else "None specified"}
        
        Respond with a JSON object that includes:
        1. content: The generated content
        2. variables: Any variable fields that should be replaced
        3. alternative_versions (optional): Array of alternative versions
        
        JSON format only.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": f"You are a {request.tone} copywriter specializing in {request.content_type} content for sales."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Create response
        return ContentGenerationResponse(
            content=result.get("content", ""),
            variables=result.get("variables", {}),
            alternative_versions=result.get("alternative_versions")
        )
        
    except Exception as e:
        logger.error(f"Error in content generation: {str(e)}")
        # Return a generic message
        return ContentGenerationResponse(
            content=f"Hello {lead.first_name}, I wanted to follow up regarding our previous conversation.",
            variables={},
            alternative_versions=None
        )

async def get_lead_insights(lead_id: int) -> LeadInsightsResponse:
    """
    Get AI-powered insights about a lead.
    """
    try:
        # Get lead and its details
        lead = await lead_service.get_lead_by_id(lead_id)
        if not lead:
            raise ValueError(f"Lead with ID {lead_id} not found")
            
        lead_detail = await lead_service.get_lead_detail(lead_id)
        
        # Get latest lead score
        lead_score = await fetch_one(
            "lead_scores", 
            {"lead_id": lead_id},
            order_by={"created_at": "desc"}
        )
        
        # Prepare context for AI
        context = {
            "lead": {
                "id": lead.id,
                "name": f"{lead.first_name} {lead.last_name}",
                "email": lead.email,
                "company": lead.company,
                "title": lead.title,
                "source": lead.source,
                "status": lead.status,
                "created_at": lead.created_at.isoformat(),
                "lead_score": lead.lead_score,
                "custom_fields": lead.custom_fields
            },
            "interactions": {
                "emails": [{"subject": e["subject"], "sentiment": e.get("sentiment_score")} for e in lead_detail.emails],
                "calls": [{"duration": c["duration"], "sentiment": c.get("sentiment_score")} for c in lead_detail.calls],
                "meetings": [{"title": m["title"], "status": m["status"]} for m in lead_detail.meetings],
                "notes": [{"body": n["body"]} for n in lead_detail.notes]
            },
            "tasks": [{"title": t["title"], "status": t["status"]} for t in lead_detail.tasks],
            "lead_score": lead_score
        }
        
        # Generate insights using LLM
        prompt = f"""
        Analyze the following lead data and provide insights to help a sales rep succeed with this lead.
        
        Lead Data: {json.dumps(context)}
        
        Provide a JSON response with:
        1. insights: An array of insight objects with:
           - type: String (opportunity, risk, suggestion, observation)
           - description: String explaining the insight
           - confidence: Float between 0.0 and 1.0
           - supporting_data: Object with relevant data points
           - suggested_actions: Array of strings with action suggestions
        2. optimal_contact_times: Object mapping communication channels to best times
        3. communication_preferences: Object mapping channels to preference scores (0-1)
        
        JSON format only.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a sales intelligence assistant. Respond only with JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Create insights
        insights = [
            LeadInsight(
                type=insight["type"],
                description=insight["description"],
                confidence=insight["confidence"],
                supporting_data=insight["supporting_data"],
                suggested_actions=insight.get("suggested_actions")
            )
            for insight in result.get("insights", [])
        ]
        
        # Return the response
        return LeadInsightsResponse(
            lead_id=lead_id,
            insights=insights,
            optimal_contact_times=result.get("optimal_contact_times"),
            communication_preferences=result.get("communication_preferences")
        )
        
    except Exception as e:
        logger.error(f"Error generating lead insights: {str(e)}")
        # Return basic insights
        return LeadInsightsResponse(
            lead_id=lead_id,
            insights=[
                LeadInsight(
                    type="suggestion",
                    description="Consider following up with this lead",
                    confidence=0.7,
                    supporting_data={"reason": "System generated default suggestion"},
                    suggested_actions=["Schedule a follow-up call"]
                )
            ]
        )

async def get_follow_up_suggestions(lead_id: int, last_interaction_type: Optional[str] = None) -> FollowUpSuggestionsResponse:
    """
    Get AI-powered follow-up suggestions for a lead.
    """
    try:
        # Get lead and its interactions
        lead_detail = await lead_service.get_lead_detail(lead_id)
        if not lead_detail:
            raise ValueError(f"Lead with ID {lead_id} not found")
        
        # Get days since last contact
        timeline = await lead_service.get_lead_timeline(lead_id, limit=1)
        days_since_contact = 0
        if timeline:
            last_contact = datetime.fromisoformat(timeline[0]["timestamp"])
            days_since_contact = (datetime.now() - last_contact).days
        
        # Prepare context
        context = {
            "lead": {
                "name": f"{lead_detail.first_name} {lead_detail.last_name}",
                "status": lead_detail.status,
                "score": lead_detail.lead_score
            },
            "last_interaction_type": last_interaction_type,
            "days_since_contact": days_since_contact,
            "interaction_counts": {
                "emails": len(lead_detail.emails),
                "calls": len(lead_detail.calls),
                "meetings": len(lead_detail.meetings)
            }
        }
        
        # Generate suggestions using LLM
        prompt = f"""
        Suggest follow-up actions for a lead with these details:
        
        Lead Data: {json.dumps(context)}
        
        Provide a JSON response with an array of suggestions, each containing:
        1. type: String (email, call, meeting, task)
        2. priority: Float between 0.0 and 1.0
        3. suggested_timing: String with human-readable timing
        4. template: Optional string with template ID or name
        5. explanation: String explaining why this is recommended
        
        JSON format only.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a sales follow-up assistant. Respond only with JSON."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Create suggestions
        suggestions = [
            FollowUpSuggestion(
                type=suggestion["type"],
                priority=suggestion["priority"],
                suggested_timing=suggestion["suggested_timing"],
                template=suggestion.get("template"),
                explanation=suggestion["explanation"]
            )
            for suggestion in result.get("suggestions", [])
        ]
        
        # Return the response
        return FollowUpSuggestionsResponse(
            lead_id=lead_id,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"Error generating follow-up suggestions: {str(e)}")
        # Return a default suggestion
        return FollowUpSuggestionsResponse(
            lead_id=lead_id,
            suggestions=[
                FollowUpSuggestion(
                    type="email",
                    priority=0.7,
                    suggested_timing="within 2 days",
                    explanation="Regular follow-up to maintain engagement"
                )
            ]
        )

# Add new functions to use the LangGraph-based agents

async def process_lead_document(document: str, source: Optional[str] = None) -> Dict[str, Any]:
    """
    Process an unstructured document to extract and enrich lead information using LangGraph agents.
    
    Args:
        document: The document or text to process
        source: Optional source information for the lead
        
    Returns:
        Dictionary containing the processing results
    """
    logger.info(f"Processing lead document with LangGraph agent from source: {source}")
    
    try:
        # Process the document using the agent manager
        result = await agent_manager.process_lead_document(document, source)
        
        return result
    except Exception as e:
        logger.error(f"Error in lead document processing: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

async def generate_advanced_content(request: ContentGenerationRequest) -> ContentGenerationResponse:
    """
    Generate personalized communication content using the LangGraph agent.
    
    This version uses the advanced CommunicationAssistant agent which provides more
    context-aware and personalized content generation than the standard version.
    
    Args:
        request: The content generation request parameters
        
    Returns:
        ContentGenerationResponse object with the generated content
    """
    logger.info(f"Generating advanced content for lead ID: {request.lead_id}")
    
    try:
        # Generate the content using the agent manager
        result = await agent_manager.generate_communication_content(
            lead_id=request.lead_id,
            content_type=request.content_type,
            purpose=request.purpose,
            tone=request.tone,
            key_points=request.key_points
        )
        
        if result.get("success", False):
            content_data = result.get("content", {})
            
            # Create the response
            return ContentGenerationResponse(
                content=content_data.get("content", ""),
                variables=content_data.get("variables", {}),
                alternative_versions=content_data.get("alternative_versions", [])
            )
        else:
            logger.error(f"Error in advanced content generation: {result.get('error', 'Unknown error')}")
            # Return a basic response
            return ContentGenerationResponse(
                content=f"[Error generating content: {result.get('error', 'Unknown error')}]",
                variables={},
                alternative_versions=[]
            )
    except Exception as e:
        logger.error(f"Error in advanced content generation: {str(e)}")
        return ContentGenerationResponse(
            content=f"[Error generating content: {str(e)}]",
            variables={},
            alternative_versions=[]
        )

async def get_advanced_lead_insights(lead_id: int) -> LeadInsightsResponse:
    """
    Get advanced insights for a lead using the LangGraph InsightGenerator agent.
    
    This version provides more comprehensive insights by analyzing all available
    lead data and communication history in a structured workflow.
    
    Args:
        lead_id: The ID of the lead to analyze
        
    Returns:
        LeadInsightsResponse object with insights and recommendations
    """
    logger.info(f"Generating advanced insights for lead ID: {lead_id}")
    
    try:
        # Analyze the lead using the agent manager
        result = await agent_manager.analyze_lead(lead_id)
        
        if result.get("success", False):
            insights_data = result.get("insights", {})
            
            # Extract insights
            insights = []
            for insight_data in insights_data.get("insights", []):
                insights.append(LeadInsight(
                    type=insight_data.get("type", "observation"),
                    description=insight_data.get("description", ""),
                    confidence=insight_data.get("confidence", 0.0),
                    supporting_data=insight_data.get("supporting_data", {}),
                    suggested_actions=insight_data.get("suggested_actions", [])
                ))
            
            # Create the response
            return LeadInsightsResponse(
                lead_id=lead_id,
                insights=insights,
                optimal_contact_times=insights_data.get("optimal_contact_times", {}),
                communication_preferences=insights_data.get("communication_preferences", {})
            )
        else:
            logger.error(f"Error in advanced lead insights: {result.get('error', 'Unknown error')}")
            # Return a basic response
            return LeadInsightsResponse(
                lead_id=lead_id,
                insights=[]
            )
    except Exception as e:
        logger.error(f"Error in advanced lead insights: {str(e)}")
        return LeadInsightsResponse(
            lead_id=lead_id,
            insights=[]
        )

async def get_advanced_follow_up_suggestions(lead_id: int) -> FollowUpSuggestionsResponse:
    """
    Get advanced follow-up suggestions using the LangGraph TaskOrchestrator agent.
    
    This version creates a comprehensive follow-up plan that considers the user's
    calendar, lead insights, and communication preferences.
    
    Args:
        lead_id: The ID of the lead to create suggestions for
        
    Returns:
        FollowUpSuggestionsResponse object with suggestions
    """
    logger.info(f"Generating advanced follow-up suggestions for lead ID: {lead_id}")
    
    try:
        # Create the follow-up plan using the agent manager
        result = await agent_manager.create_follow_up_plan(lead_id)
        
        if result.get("success", False):
            # Get the follow-up suggestions
            suggestions_data = result.get("follow_up_suggestions", [])
            
            # Convert to the expected format
            suggestions = []
            for suggestion_data in suggestions_data:
                suggestions.append(FollowUpSuggestion(
                    type=suggestion_data.get("type", "email"),
                    priority=suggestion_data.get("priority", 0.5),
                    suggested_timing=suggestion_data.get("suggested_timing", ""),
                    template=suggestion_data.get("template", ""),
                    explanation=suggestion_data.get("explanation", "")
                ))
            
            # Create the response
            return FollowUpSuggestionsResponse(
                lead_id=lead_id,
                suggestions=suggestions
            )
        else:
            logger.error(f"Error in advanced follow-up suggestions: {result.get('error', 'Unknown error')}")
            # Return a basic response
            return FollowUpSuggestionsResponse(
                lead_id=lead_id,
                suggestions=[]
            )
    except Exception as e:
        logger.error(f"Error in advanced follow-up suggestions: {str(e)}")
        return FollowUpSuggestionsResponse(
            lead_id=lead_id,
            suggestions=[]
        ) 