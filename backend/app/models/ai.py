from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from enum import Enum
from datetime import datetime

class SentimentScore(BaseModel):
    """Model for sentiment analysis scores"""
    score: float  # Range from -1.0 (negative) to 1.0 (positive)
    positive: float  # Probability of positive sentiment (0.0 to 1.0)
    neutral: float  # Probability of neutral sentiment (0.0 to 1.0)
    negative: float  # Probability of negative sentiment (0.0 to 1.0)
    
    @validator('score')
    def validate_score(cls, v):
        if v < -1.0 or v > 1.0:
            raise ValueError('Sentiment score must be between -1.0 and 1.0')
        return v
    
    @validator('positive', 'neutral', 'negative')
    def validate_probabilities(cls, v):
        if v < 0.0 or v > 1.0:
            raise ValueError('Probability values must be between 0.0 and 1.0')
        return v

class SentimentAnalysisRequest(BaseModel):
    """Request model for sentiment analysis"""
    text: str
    content_type: str = "general"  # general, email, sms, call_transcript

class SentimentAnalysisResponse(BaseModel):
    """Response model for sentiment analysis"""
    text: str
    sentiment: SentimentScore
    key_phrases: List[str] = []
    entities: List[Dict[str, Any]] = []
    
class LeadScoreFactors(str, Enum):
    """Factors that contribute to lead scoring"""
    EMAIL_ENGAGEMENT = "email_engagement"
    RESPONSE_TIME = "response_time"
    COMMUNICATION_FREQUENCY = "communication_frequency"
    SENTIMENT = "sentiment"
    WEBSITE_BEHAVIOR = "website_behavior"
    DEMOGRAPHIC = "demographic"
    FIRMOGRAPHIC = "firmographic"
    SOCIAL_MEDIA = "social_media"
    CUSTOM = "custom"

class LeadScoreComponent(BaseModel):
    """Component of a lead score"""
    factor: LeadScoreFactors
    weight: float  # 0.0 to 1.0, indicating importance
    score: float  # 0.0 to 1.0
    explanation: str
    
    @validator('weight', 'score')
    def validate_values(cls, v):
        if v < 0.0 or v > 1.0:
            raise ValueError('Weight and score values must be between 0.0 and 1.0')
        return v

class LeadScoreRequest(BaseModel):
    """Request to calculate a lead score"""
    lead_id: int
    recalculate: bool = False  # Force recalculation even if recent score exists

class LeadScoreResponse(BaseModel):
    """Response with lead score details"""
    lead_id: int
    overall_score: float  # 0.0 to 1.0
    conversion_probability: float  # 0.0 to 1.0
    components: List[LeadScoreComponent]
    timestamp: datetime
    next_best_actions: List[Dict[str, Any]] = []
    
    @validator('overall_score', 'conversion_probability')
    def validate_scores(cls, v):
        if v < 0.0 or v > 1.0:
            raise ValueError('Score values must be between 0.0 and 1.0')
        return v

class ContentGenerationRequest(BaseModel):
    """Request for AI-generated content"""
    content_type: str  # email, sms, call_script, meeting_agenda, follow_up
    lead_id: int
    purpose: str  # introduction, follow_up, proposal, check_in
    tone: str = "professional"  # professional, friendly, formal, casual
    key_points: Optional[List[str]] = None
    max_length: Optional[int] = None

class ContentGenerationResponse(BaseModel):
    """Response with AI-generated content"""
    content: str
    variables: Dict[str, str] = {}
    alternative_versions: Optional[List[str]] = None
    
class EntityExtractionRequest(BaseModel):
    """Request to extract entities from unstructured text"""
    text: str
    entity_types: List[str] = ["person", "organization", "email", "phone", "date", "address"]

class Entity(BaseModel):
    """Extracted entity"""
    text: str
    type: str
    start: int
    end: int
    confidence: float
    metadata: Dict[str, Any] = {}

class EntityExtractionResponse(BaseModel):
    """Response with extracted entities"""
    entities: List[Entity]
    
class ConversationSummaryRequest(BaseModel):
    """Request to summarize a conversation"""
    conversation: List[Dict[str, Any]]  # List of message objects
    max_length: Optional[int] = None

class ConversationSummaryResponse(BaseModel):
    """Response with conversation summary"""
    summary: str
    key_points: List[str]
    action_items: List[str]
    sentiment: SentimentScore

class LeadInsightsRequest(BaseModel):
    """Request for AI insights about a lead"""
    lead_id: int

class LeadInsight(BaseModel):
    """A single insight about a lead"""
    type: str  # opportunity, risk, suggestion, observation
    description: str
    confidence: float  # 0.0 to 1.0
    supporting_data: Dict[str, Any]
    suggested_actions: Optional[List[str]] = None

class LeadInsightsResponse(BaseModel):
    """Response with insights about a lead"""
    lead_id: int
    insights: List[LeadInsight]
    optimal_contact_times: Optional[Dict[str, List[str]]] = None  # e.g. {"email": ["morning", "tuesday"], "call": ["afternoon"]}
    communication_preferences: Optional[Dict[str, float]] = None  # e.g. {"email": 0.8, "call": 0.3, "sms": 0.5}

class FollowUpSuggestionRequest(BaseModel):
    """Request for follow-up suggestions"""
    lead_id: int
    last_interaction_type: Optional[str] = None  # email, call, meeting
    days_since_contact: Optional[int] = None

class FollowUpSuggestion(BaseModel):
    """A single follow-up suggestion"""
    type: str  # email, call, meeting, task
    priority: float  # 0.0 to 1.0
    suggested_timing: str  # e.g. "tomorrow morning", "next week"
    template: Optional[str] = None
    explanation: str

class FollowUpSuggestionsResponse(BaseModel):
    """Response with follow-up suggestions"""
    lead_id: int
    suggestions: List[FollowUpSuggestion]

class AdvancedLeadScoringRequest(BaseModel):
    """Request for advanced lead scoring using the LangGraph LeadScoringAgent"""
    lead_id: int
    timeframe_days: int = 30  # Number of days of interaction history to analyze

class AdvancedLeadScoringResponse(BaseModel):
    """Response from the advanced lead scoring agent"""
    lead_id: int
    status: str  # success or error
    lead_score: Optional[float] = None  # 0-100 score
    conversion_probability: Optional[float] = None  # 0-100 percentage
    factors: Optional[List[str]] = None  # Factors affecting the score
    recommendations: Optional[List[str]] = None  # Recommended actions
    analysis: Optional[str] = None  # Brief analysis text
    score_id: Optional[int] = None  # Database ID of the stored score
    errors: Optional[List[str]] = None  # Any errors that occurred
    timeframe_days: int  # The timeframe used for analysis

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE = "azure"
    GOOGLE = "google"
    COHERE = "cohere"
    HUGGINGFACE = "huggingface"
    CUSTOM = "custom"

class LLMModel(BaseModel):
    """Model for LLM configuration"""
    id: Optional[int] = None
    provider: LLMProvider
    model_name: str
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    api_version: Optional[str] = None
    organization_id: Optional[str] = None
    is_default: bool = False
    max_tokens: Optional[int] = None
    temperature: float = 0.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @validator('temperature')
    def validate_temperature(cls, v):
        if v < 0.0 or v > 2.0:
            raise ValueError('Temperature must be between 0.0 and 2.0')
        return v

class LLMUsageRecord(BaseModel):
    """Model for tracking LLM usage"""
    id: Optional[int] = None
    model_id: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    request_type: str  # e.g., "sentiment_analysis", "lead_scoring", etc.
    user_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    request_id: Optional[str] = None
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = {}

class LLMUsageSummary(BaseModel):
    """Summary of LLM usage"""
    total_requests: int
    total_tokens: int
    total_cost: float
    tokens_by_model: Dict[str, int]
    cost_by_model: Dict[str, float]
    requests_by_type: Dict[str, int]
    usage_by_day: Dict[str, Dict[str, float]]  # date -> {tokens, cost}
    
class LLMSettingsResponse(BaseModel):
    """Response with LLM settings"""
    models: List[LLMModel]
    default_model: Optional[LLMModel] = None
    usage_summary: Optional[LLMUsageSummary] = None 