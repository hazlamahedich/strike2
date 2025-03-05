-- Supabase Schema for AI-Powered CRM with UUID Support
-- This script creates all the necessary tables for the CRM system
-- Modified to use UUIDs for user IDs to match Supabase auth system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- 1. Users Table with UUID primary key
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep',
    team_id INTEGER,
    auth_id UUID, -- Link to Supabase auth.users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to users table
ALTER TABLE users
ADD CONSTRAINT fk_users_team
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 3. Leads Table (with UUID for owner_id)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    title VARCHAR(255),
    source VARCHAR(50) DEFAULT 'other',
    status VARCHAR(50) DEFAULT 'new',
    owner_id UUID, -- Changed to UUID
    team_id INTEGER,
    lead_score FLOAT DEFAULT 0.0,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 4. Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    team_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 5. Lead Status History Table (with UUID for moved_by)
CREATE TABLE IF NOT EXISTS lead_status_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    stage_id INTEGER,
    previous_stage_id INTEGER,
    moved_by UUID, -- Changed to UUID
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (previous_stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (moved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Tasks Table (with UUIDs for assigned_to and created_by)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to UUID, -- Changed to UUID
    lead_id INTEGER,
    created_by UUID, -- Changed to UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Task Notes Table (with UUID for created_by)
CREATE TABLE IF NOT EXISTS task_notes (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_by UUID, -- Changed to UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    subject VARCHAR(255),
    body TEXT,
    sent_from VARCHAR(255) NOT NULL,
    sent_to VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent',
    sentiment_score FLOAT,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    sent_by UUID, -- Added UUID field for the sender
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Calls Table
CREATE TABLE IF NOT EXISTS calls (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    direction VARCHAR(50) NOT NULL,
    duration INTEGER,
    recording_url VARCHAR(255),
    transcript TEXT,
    sentiment_score FLOAT,
    notes TEXT,
    caller VARCHAR(255),
    recipient VARCHAR(255),
    call_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID, -- Added UUID field for the user who made/received the call
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. SMS Table
CREATE TABLE IF NOT EXISTS sms (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    sent_from VARCHAR(50) NOT NULL,
    sent_to VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'sent',
    sentiment_score FLOAT,
    sent_by UUID, -- Added UUID field for the sender
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Meetings Table (with UUID for created_by)
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID, -- Changed to UUID
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Notes Table (with UUID for created_by)
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_by UUID, -- Changed to UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Activities Table (with UUID for user_id)
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    user_id UUID, -- Changed to UUID
    activity_type VARCHAR(50) NOT NULL,
    activity_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Integrations Table
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    provider VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 15. Campaigns Table (with UUID for created_by)
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    type VARCHAR(50) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID, -- Changed to UUID
    team_id INTEGER,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- 16. Campaign Leads Junction Table
CREATE TABLE IF NOT EXISTS campaign_leads (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL,
    lead_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID, -- Added UUID field for the user who added this lead
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(campaign_id, lead_id)
);

-- 17. Lead Scores Table
CREATE TABLE IF NOT EXISTS lead_scores (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL,
    score FLOAT NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    factors JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID, -- Added UUID field for the user/system that calculated the score
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (calculated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 18. Recordings Table (for call recordings and meeting recordings)
CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL, -- 'call' or 'meeting'
    source_id INTEGER NOT NULL,
    url VARCHAR(255) NOT NULL,
    duration INTEGER,
    transcript TEXT,
    sentiment_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Added UUID field for the user who created the recording
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 19. Profiles Table (for user profiles and preferences) (with UUID for user_id)
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE, -- Changed to UUID
    avatar_url VARCHAR(255),
    preferences JSONB DEFAULT '{}'::jsonb,
    notification_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_leads_owner ON leads(owner_id);
CREATE INDEX idx_leads_team ON leads(team_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead_id ON campaign_leads(lead_id);

-- Create text search indexes
CREATE INDEX idx_leads_name_trgm ON leads USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_leads_company_trgm ON leads USING gin (company gin_trgm_ops);
CREATE INDEX idx_leads_email_trgm ON leads USING gin (email gin_trgm_ops);

-- Create RLS (Row Level Security) policies
-- These policies control access to data based on user roles

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

-- Create policies (examples - these should be customized based on your security requirements)
-- Note: Now auth.uid() can be directly compared with user.id without type casting

-- Users policy - admins can see all users, managers can see their team, users can only see themselves
CREATE POLICY users_policy ON users
    USING (
        (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')) OR
        (auth.uid() IN (SELECT id FROM users WHERE role = 'manager' AND team_id = users.team_id)) OR
        (auth.uid() = id)
    );

-- Leads policy - users can see leads they own or in their team
CREATE POLICY leads_policy ON leads
    USING (
        (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')) OR
        (auth.uid() IN (SELECT id FROM users WHERE role = 'manager' AND team_id = leads.team_id)) OR
        (owner_id = auth.uid()) OR
        (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_teams_timestamp BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_leads_timestamp BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_pipeline_stages_timestamp BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_task_notes_timestamp BEFORE UPDATE ON task_notes FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_notes_timestamp BEFORE UPDATE ON notes FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_integrations_timestamp BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_campaigns_timestamp BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Create a function to log lead status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO lead_status_history (
            lead_id,
            stage_id,
            previous_stage_id,
            moved_by,
            notes
        ) VALUES (
            NEW.id,
            (SELECT id FROM pipeline_stages WHERE name = NEW.status LIMIT 1),
            (SELECT id FROM pipeline_stages WHERE name = OLD.status LIMIT 1),
            auth.uid(), -- This now works directly with UUID
            'Status changed from ' || OLD.status || ' to ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to log lead status changes
CREATE TRIGGER log_lead_status_change
AFTER UPDATE OF status ON leads
FOR EACH ROW
EXECUTE PROCEDURE log_lead_status_change();

-- Create a function to log activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activities (
        lead_id,
        user_id,
        activity_type,
        activity_id,
        metadata
    ) VALUES (
        NEW.lead_id,
        auth.uid(), -- This now works directly with UUID
        TG_TABLE_NAME,
        NEW.id,
        jsonb_build_object('action', TG_OP, 'timestamp', NOW())
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the activity logging trigger to relevant tables
CREATE TRIGGER log_email_activity AFTER INSERT ON emails FOR EACH ROW EXECUTE PROCEDURE log_activity();
CREATE TRIGGER log_call_activity AFTER INSERT ON calls FOR EACH ROW EXECUTE PROCEDURE log_activity();
CREATE TRIGGER log_sms_activity AFTER INSERT ON sms FOR EACH ROW EXECUTE PROCEDURE log_activity();
CREATE TRIGGER log_meeting_activity AFTER INSERT ON meetings FOR EACH ROW EXECUTE PROCEDURE log_activity();
CREATE TRIGGER log_note_activity AFTER INSERT ON notes FOR EACH ROW EXECUTE PROCEDURE log_activity();
CREATE TRIGGER log_task_activity AFTER INSERT ON tasks FOR EACH ROW EXECUTE PROCEDURE log_activity(); 