-- Add social media profile fields to the leads table
ALTER TABLE leads
ADD COLUMN linkedin_url VARCHAR(255),
ADD COLUMN facebook_url VARCHAR(255),
ADD COLUMN twitter_url VARCHAR(255);

-- Add comment to explain the purpose of these fields
COMMENT ON COLUMN leads.linkedin_url IS 'LinkedIn profile URL of the lead';
COMMENT ON COLUMN leads.facebook_url IS 'Facebook profile URL of the lead';
COMMENT ON COLUMN leads.twitter_url IS 'Twitter profile URL of the lead';

-- Update the lead_score calculation function if it exists
-- This is a placeholder - you'll need to adapt this to your actual function
CREATE OR REPLACE FUNCTION calculate_lead_score(
    p_email VARCHAR,
    p_phone VARCHAR,
    p_company_name VARCHAR,
    p_position VARCHAR,
    p_notes TEXT,
    p_linkedin_url VARCHAR,
    p_facebook_url VARCHAR,
    p_twitter_url VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50; -- Base score
BEGIN
    -- Increase score for more complete information
    IF p_email IS NOT NULL AND p_email <> '' THEN
        v_score := v_score + 10;
    END IF;
    
    IF p_phone IS NOT NULL AND p_phone <> '' THEN
        v_score := v_score + 10;
    END IF;
    
    IF p_company_name IS NOT NULL AND p_company_name <> '' THEN
        v_score := v_score + 10;
    END IF;
    
    IF p_position IS NOT NULL AND p_position <> '' THEN
        v_score := v_score + 5;
    END IF;
    
    IF p_notes IS NOT NULL AND LENGTH(p_notes) > 20 THEN
        v_score := v_score + 5;
    END IF;
    
    -- Increase score for social media profiles
    IF p_linkedin_url IS NOT NULL AND p_linkedin_url <> '' THEN
        v_score := v_score + 7;
    END IF;
    
    IF p_facebook_url IS NOT NULL AND p_facebook_url <> '' THEN
        v_score := v_score + 3;
    END IF;
    
    IF p_twitter_url IS NOT NULL AND p_twitter_url <> '' THEN
        v_score := v_score + 3;
    END IF;
    
    -- Cap score at 100
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql; 