-- Add phone_extension column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_extension VARCHAR(20);

-- Add phone_extension column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_extension VARCHAR(20);

-- Add index for phone_extension on leads table
CREATE INDEX IF NOT EXISTS idx_leads_phone_extension ON leads(phone_extension);

-- Add index for phone_extension on contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_phone_extension ON contacts(phone_extension);

-- Add metadata column to calls table if it doesn't exist
ALTER TABLE calls ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update function to include phone_extension in lead creation
CREATE OR REPLACE FUNCTION create_lead(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_phone_extension VARCHAR,
    p_company VARCHAR,
    p_title VARCHAR,
    p_source VARCHAR,
    p_status VARCHAR,
    p_owner_id UUID,
    p_team_id INTEGER,
    p_custom_fields JSONB,
    p_linkedin_url VARCHAR,
    p_facebook_url VARCHAR,
    p_twitter_url VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_lead_id INTEGER;
BEGIN
    INSERT INTO leads (
        first_name,
        last_name,
        email,
        phone,
        phone_extension,
        company,
        title,
        source,
        status,
        owner_id,
        team_id,
        custom_fields,
        linkedin_url,
        facebook_url,
        twitter_url
    ) VALUES (
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
        p_phone_extension,
        p_company,
        p_title,
        p_source,
        p_status,
        p_owner_id,
        p_team_id,
        p_custom_fields,
        p_linkedin_url,
        p_facebook_url,
        p_twitter_url
    ) RETURNING id INTO v_lead_id;
    
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql; 