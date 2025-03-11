from pydantic_settings import BaseSettings
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AI-Powered CRM"
    
    # Security settings
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000", "http://localhost:3002"]
    
    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/crm"
    
    # OpenAI settings
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_ORGANIZATION: Optional[str] = None
    DEFAULT_MODEL: Optional[str] = "gpt-4"
    
    # LiteLLM settings
    LITELLM_API_KEY: Optional[str] = None
    LITELLM_CACHE_ENABLED: bool = True
    LITELLM_CACHE_FOLDER: str = ".cache"
    LITELLM_TELEMETRY: bool = False
    LITELLM_LOGGING_ENABLED: bool = True
    LITELLM_LOGGING_LEVEL: str = "INFO"
    
    # Anthropic settings
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Google AI settings
    GOOGLE_API_KEY: Optional[str] = None
    
    # Azure OpenAI settings
    AZURE_API_KEY: Optional[str] = None
    AZURE_API_BASE: Optional[str] = None
    AZURE_API_VERSION: Optional[str] = None
    
    # Email settings
    SENDGRID_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@example.com"
    EMAIL_FROM_NAME: str = "CRM System"
    SENDGRID_FROM_EMAIL: Optional[str] = "crm@example.com"
    
    # Twilio settings
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_API_KEY_SID: Optional[str] = None
    TWILIO_API_KEY_SECRET: Optional[str] = None
    TWILIO_TWIML_APP_SID: Optional[str] = None
    
    # Supabase settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    # Local Supabase settings
    SUPABASE_LOCAL_URL: str = os.getenv("SUPABASE_LOCAL_URL", "http://localhost:8080")
    SUPABASE_LOCAL_KEY: str = os.getenv("SUPABASE_LOCAL_KEY", "postgres")
    SUPABASE_DB_HOST: str = os.getenv("SUPABASE_DB_HOST", "supabase-db")
    SUPABASE_DB_PORT: int = int(os.getenv("SUPABASE_DB_PORT", "5432"))
    SUPABASE_DB_NAME: str = os.getenv("SUPABASE_DB_NAME", "postgres")
    SUPABASE_DB_USER: str = os.getenv("SUPABASE_DB_USER", "postgres")
    SUPABASE_DB_PASSWORD: str = os.getenv("SUPABASE_DB_PASSWORD", "postgres")
    # Set to 'local' to use local Supabase, 'cloud' to use Supabase cloud
    SUPABASE_ENV: str = os.getenv("SUPABASE_ENV", "local")
    
    # Sentry settings
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Feature flags
    ENABLE_AI_FEATURES: bool = True
    ENABLE_EMAIL: bool = True
    ENABLE_SMS: bool = True
    ENABLE_CALL_TRACKING: bool = True
    
    # Timezone setting
    TIMEZONE: str = "UTC"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings() 