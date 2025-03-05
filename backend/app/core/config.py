from pydantic_settings import BaseSettings
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "AI-Powered CRM"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://yourdomain.com"]
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
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
    
    # OpenAI settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = "gpt-4-1106-preview"
    
    # SendGrid settings
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "crm@yourdomain.com")
    
    # Twilio settings
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    
    # Sentry settings
    SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
    
    # Feature flags
    ENABLE_AI_FEATURES: bool = True
    ENABLE_EMAIL: bool = True
    ENABLE_SMS: bool = True
    ENABLE_CALL_TRACKING: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create a global settings object
settings = Settings() 