-- Chatbot Schema for AI-Powered CRM (UUID version)
-- This script creates all the necessary tables for the chatbot system

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Chatbot Sessions Table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Changed to UUID to match users.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Chatbot Feedback Table
CREATE TABLE IF NOT EXISTS chatbot_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chatbot_sessions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'partially_helpful'
    comment TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL  -- Changed to UUID to match users.id
);

-- 4. Chatbot FAQ Table
CREATE TABLE IF NOT EXISTS chatbot_faq (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chatbot Learning Table
CREATE TABLE IF NOT EXISTS chatbot_learning (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    feedback_score FLOAT, -- 0.0 to 1.0
    query_type VARCHAR(50), -- 'app_functionality', 'database_query', 'troubleshooting', 'faq', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_session_id ON chatbot_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_session_id ON chatbot_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_id ON chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_faq_category ON chatbot_faq(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_learning_query_type ON chatbot_learning(query_type);

-- Add some initial FAQ entries
INSERT INTO chatbot_faq (question, answer, category) VALUES
('How do I reset my password?', 'You can reset your password by clicking on the "Forgot Password" link on the login page. You''ll receive an email with instructions to create a new password.', 'Account Management'),
('How do I create a new lead?', 'To create a new lead, go to the Leads section and click the "Add Lead" button. Fill in the required information and click "Save".', 'Lead Management'),
('How do I assign a task to another team member?', 'When creating or editing a task, use the "Assigned To" dropdown to select the team member you want to assign the task to.', 'Task Management'),
('How do I track email communications with leads?', 'The system automatically tracks emails when you use the built-in email tool. You can also manually log emails by going to a lead''s profile and clicking "Log Activity" > "Email".', 'Communication'),
('How does the lead scoring system work?', 'The lead scoring system uses AI to analyze various factors including email engagement, response time, communication frequency, sentiment analysis, and more to assign a score from 0-100 to each lead.', 'Lead Management'),
('How can I export my leads data?', 'Go to the Leads section, use filters to select the leads you want to export, then click the "Export" button and choose your preferred format (CSV or Excel).', 'Data Management'),
('How do I create a new campaign?', 'Go to the Campaigns section and click "Create Campaign". Fill in the campaign details, select your target leads, and set up the campaign sequence.', 'Campaign Management'),
('How can I see my team''s performance?', 'Go to the Analytics section where you can view dashboards showing team performance metrics, lead conversion rates, and other key indicators.', 'Analytics'),
('How do I integrate with other tools?', 'Go to Settings > Integrations to set up connections with email providers, calendar apps, and other third-party tools.', 'Integrations'),
('Is my data secure?', 'Yes, we use industry-standard encryption and security practices to protect your data. All information is stored securely and access is strictly controlled.', 'Security'); 