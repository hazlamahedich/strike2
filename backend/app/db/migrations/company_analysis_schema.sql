-- Create company_analyses table
CREATE TABLE IF NOT EXISTS company_analyses (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    website_url TEXT,
    content_length INTEGER,
    subpages_analyzed INTEGER,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id)
);

-- Create index on lead_id
CREATE INDEX IF NOT EXISTS idx_company_analyses_lead_id ON company_analyses(lead_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_company_analyses_status ON company_analyses(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_company_analyses_updated_at ON company_analyses;
CREATE TRIGGER update_company_analyses_updated_at
BEFORE UPDATE ON company_analyses
FOR EACH ROW
EXECUTE FUNCTION update_company_analyses_updated_at(); 