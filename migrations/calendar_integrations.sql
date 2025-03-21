-- Create lead_calendar_integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS lead_calendar_integrations_lead_id_idx ON lead_calendar_integrations(lead_id);
CREATE INDEX IF NOT EXISTS lead_calendar_integrations_provider_idx ON lead_calendar_integrations(provider);

-- Add a constraint to ensure only one integration per lead per provider
ALTER TABLE lead_calendar_integrations 
DROP CONSTRAINT IF EXISTS lead_calendar_integrations_lead_id_provider_key;
ALTER TABLE lead_calendar_integrations 
ADD CONSTRAINT lead_calendar_integrations_lead_id_provider_key 
UNIQUE (lead_id, provider);

-- Add RLS policies
ALTER TABLE lead_calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read calendar integrations
DROP POLICY IF EXISTS lead_calendar_integrations_select_policy ON lead_calendar_integrations;
CREATE POLICY lead_calendar_integrations_select_policy ON lead_calendar_integrations 
FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy to allow authenticated users to insert calendar integrations
DROP POLICY IF EXISTS lead_calendar_integrations_insert_policy ON lead_calendar_integrations;
CREATE POLICY lead_calendar_integrations_insert_policy ON lead_calendar_integrations 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a policy to allow authenticated users to update calendar integrations
DROP POLICY IF EXISTS lead_calendar_integrations_update_policy ON lead_calendar_integrations;
CREATE POLICY lead_calendar_integrations_update_policy ON lead_calendar_integrations 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a policy to allow authenticated users to delete calendar integrations
DROP POLICY IF EXISTS lead_calendar_integrations_delete_policy ON lead_calendar_integrations;
CREATE POLICY lead_calendar_integrations_delete_policy ON lead_calendar_integrations 
FOR DELETE USING (auth.role() = 'authenticated'); 