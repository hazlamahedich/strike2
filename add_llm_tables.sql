-- Create LLM models table
CREATE TABLE IF NOT EXISTS llm_models (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    api_base VARCHAR(255),
    api_version VARCHAR(50),
    organization_id VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    max_tokens INTEGER,
    temperature FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create LLM usage records table
CREATE TABLE IF NOT EXISTS llm_usage_records (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost FLOAT NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    request_id VARCHAR(255),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create AI functionality settings table
CREATE TABLE IF NOT EXISTS ai_functionality_settings (
    id SERIAL PRIMARY KEY,
    feature_key VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    requires_subscription BOOLEAN DEFAULT FALSE,
    default_model_id INTEGER REFERENCES llm_models(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default AI functionality settings
INSERT INTO ai_functionality_settings (feature_key, display_name, description, is_enabled)
VALUES 
('sentiment_analysis', 'Sentiment Analysis', 'Analyze the sentiment of text content from emails, calls, and other communications', TRUE),
('lead_scoring', 'Lead Scoring', 'AI-powered scoring of leads based on engagement and other factors', TRUE),
('content_generation', 'Content Generation', 'Generate email templates, follow-ups, and other content', TRUE),
('entity_extraction', 'Entity Extraction', 'Extract entities like names, organizations, and contact info from text', TRUE),
('conversation_summary', 'Conversation Summary', 'Summarize conversations and extract key points', TRUE),
('lead_insights', 'Lead Insights', 'Generate AI insights about leads and opportunities', TRUE),
('follow_up_suggestions', 'Follow-up Suggestions', 'Get AI-powered suggestions for follow-up actions', TRUE),
('workflow_automation', 'Workflow Automation', 'AI-powered workflow automation and optimization', TRUE)
ON CONFLICT (feature_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_models_is_default ON llm_models(is_default);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_model_id ON llm_usage_records(model_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_user_id ON llm_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_timestamp ON llm_usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_request_type ON llm_usage_records(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_functionality_settings_feature_key ON ai_functionality_settings(feature_key);

-- Insert default OpenAI model if API key is set
DO $$
DECLARE
    openai_api_key TEXT;
BEGIN
    -- Get the OpenAI API key from the environment
    SELECT current_setting('app.openai_api_key', TRUE) INTO openai_api_key;
    
    -- If the API key is set and no default model exists, create one
    IF openai_api_key IS NOT NULL AND openai_api_key != '' THEN
        IF NOT EXISTS (SELECT 1 FROM llm_models WHERE is_default = TRUE) THEN
            INSERT INTO llm_models (
                provider, 
                model_name, 
                api_key, 
                is_default, 
                temperature
            ) VALUES (
                'openai',
                'gpt-4',
                openai_api_key,
                TRUE,
                0.0
            );
        END IF;
    END IF;
END $$; 