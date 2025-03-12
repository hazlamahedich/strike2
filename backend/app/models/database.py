from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Table, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.core.database import Base

class DBLead(Base):
    """
    Database model for leads
    """
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    title = Column(String(255), nullable=True)
    source = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    custom_fields = Column(JSON, default={})
    lead_score = Column(Float, default=50.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    linkedin_url = Column(String(255), nullable=True)
    facebook_url = Column(String(255), nullable=True)
    twitter_url = Column(String(255), nullable=True)
    
    # Relationships
    owner = relationship("DBUser", back_populates="leads")
    team = relationship("DBTeam", back_populates="leads")
    campaigns = relationship("DBCampaignLead", back_populates="lead")
    tasks = relationship("DBTask", back_populates="lead", cascade="all, delete-orphan")
    notes = relationship("DBLeadNote", back_populates="lead", cascade="all, delete-orphan")
    activities = relationship("DBActivity", back_populates="lead", cascade="all, delete-orphan")

class DBLeadNote(Base):
    """
    Database model for lead notes
    """
    __tablename__ = "lead_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_private = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lead = relationship("DBLead", back_populates="notes")
    creator = relationship("DBUser", back_populates="lead_notes")

class DBUser(Base):
    """
    Database model for users
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    team = relationship("DBTeam", back_populates="members")
    leads = relationship("DBLead", back_populates="owner")
    lead_notes = relationship("DBLeadNote", back_populates="creator")
    campaigns = relationship("DBCampaignLead", back_populates="adder")

class DBTeam(Base):
    """
    Database model for teams
    """
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    members = relationship("DBUser", back_populates="team")
    leads = relationship("DBLead", back_populates="team")

class DBTask(Base):
    """
    Database model for lead tasks
    """
    __tablename__ = "lead_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String(50), default="medium", nullable=False)
    status = Column(String(50), default="pending", nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = relationship("DBLead", back_populates="tasks")
    assignee = relationship("DBUser", foreign_keys=[assigned_to], backref="assigned_tasks")
    creator = relationship("DBUser", foreign_keys=[created_by], backref="created_tasks")

class DBCampaign(Base):
    """
    Database model for campaigns
    """
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leads = relationship("DBCampaignLead", back_populates="campaign")
    creator = relationship("DBUser", back_populates="campaigns")

class DBCampaignLead(Base):
    """
    Database model for campaign-lead associations
    """
    __tablename__ = "campaign_leads"
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(50), default="added", nullable=False)
    added_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)
    meta_data = Column(JSON, default={})
    
    # Relationships
    campaign = relationship("DBCampaign", back_populates="leads")
    lead = relationship("DBLead", back_populates="campaigns")
    adder = relationship("DBUser", foreign_keys=[added_by], backref="added_campaign_leads")

class DBLLMModel(Base):
    """
    Database model for LLM models configuration
    """
    __tablename__ = "llm_models"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False)
    model_name = Column(String(255), nullable=False)
    api_key = Column(String(255), nullable=True)
    api_base = Column(String(255), nullable=True)
    api_version = Column(String(50), nullable=True)
    organization_id = Column(String(255), nullable=True)
    is_default = Column(Boolean, default=False)
    max_tokens = Column(Integer, nullable=True)
    temperature = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    usage_records = relationship("DBLLMUsageRecord", back_populates="model", cascade="all, delete-orphan")

class DBLLMUsageRecord(Base):
    """
    Database model for tracking LLM usage
    """
    __tablename__ = "llm_usage_records"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("llm_models.id", ondelete="CASCADE"), nullable=False)
    prompt_tokens = Column(Integer, nullable=False)
    completion_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    request_type = Column(String(100), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    request_id = Column(String(255), nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    meta_data = Column(JSON, default={})
    
    # Relationships
    model = relationship("DBLLMModel", back_populates="usage_records")
    user = relationship("DBUser", backref="llm_usage_records") 