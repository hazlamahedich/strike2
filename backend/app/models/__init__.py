"""
Models for the AI-powered CRM.

This module contains all the Pydantic models used in the application.
"""

from app.models import (
    user, lead, task, communication, meeting, campaign, campaign_lead,
    notification, analytics, ai, content, follow_up, insights, chatbot
)

# Models package initialization 

# Import all models for easier importing in other files
from app.models.content import ContentGenerationRequest, ContentGenerationResponse
from app.models.insights import LeadInsight, LeadInsightsResponse
from app.models.follow_up import FollowUpSuggestion, FollowUpSuggestionsResponse
from app.models.users import User 