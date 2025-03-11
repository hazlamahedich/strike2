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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_models_is_default ON llm_models(is_default);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_model_id ON llm_usage_records(model_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_user_id ON llm_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_timestamp ON llm_usage_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_llm_usage_records_request_type ON llm_usage_records(request_type);

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