from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class CompanyAnalysisStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    INVALID_URL = "invalid_url"
    NO_CONTENT = "no_content"

class CompanyAnalysisResult(BaseModel):
    """
    Schema for company analysis result
    """
    company_summary: str
    industry: Optional[str] = None
    products_services: Optional[List[str]] = None
    value_proposition: Optional[str] = None
    target_audience: Optional[str] = None
    company_size_estimate: Optional[str] = None
    strengths: Optional[List[str]] = None
    opportunities: Optional[List[str]] = None
    conversion_strategy: Optional[str] = None
    key_topics: Optional[List[str]] = None
    potential_pain_points: Optional[List[str]] = None
    lead_score_factors: Optional[List[str]] = None
    analysis_timestamp: Optional[datetime] = None
    content_length: Optional[int] = None
    subpages_analyzed: Optional[int] = None
    error: Optional[str] = None

class CompanyAnalysis(BaseModel):
    """
    Schema for company analysis
    """
    id: Optional[int] = None
    lead_id: int
    status: CompanyAnalysisStatus = CompanyAnalysisStatus.PENDING
    website_url: Optional[str] = None
    content_length: Optional[int] = None
    subpages_analyzed: Optional[int] = None
    result: Optional[CompanyAnalysisResult] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        orm_mode = True

class CompanyAnalysisResponse(BaseModel):
    """
    Schema for company analysis response
    """
    lead_id: int
    status: str
    message: Optional[str] = None
    website_url: Optional[str] = None
    updated_at: Optional[datetime] = None
    analysis: Optional[CompanyAnalysisResult] = None

class WebScrapingRequest(BaseModel):
    """
    Schema for web scraping request
    """
    lead_id: int

class BatchWebScrapingRequest(BaseModel):
    """
    Schema for batch web scraping request
    """
    lead_ids: List[int]
    
class WebScrapingResponse(BaseModel):
    """
    Schema for web scraping response
    """
    status: str
    message: str
    lead_id: Optional[int] = None
    
class BatchWebScrapingResponse(BaseModel):
    """
    Schema for batch web scraping response
    """
    status: str
    message: str
    total_leads: int
    batches: int 