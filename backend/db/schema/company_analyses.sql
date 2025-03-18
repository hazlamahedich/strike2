-- Create the company_analyses table
CREATE TABLE IF NOT EXISTS company_analyses (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  analysis JSONB,
  model_provider TEXT,
  model_name TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the company_analyses_status table for tracking analysis progress
CREATE TABLE IF NOT EXISTS company_analyses_status (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_company_analyses_lead_id ON company_analyses(lead_id);
CREATE INDEX IF NOT EXISTS idx_company_analyses_status ON company_analyses(status);
CREATE INDEX IF NOT EXISTS idx_company_analyses_status_lead_id ON company_analyses_status(lead_id);
CREATE INDEX IF NOT EXISTS idx_company_analyses_status_status ON company_analyses_status(status);

-- Add foreign key constraints if leads table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_company_analyses_lead_id'
    ) THEN
      ALTER TABLE company_analyses
      ADD CONSTRAINT fk_company_analyses_lead_id
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_company_analyses_status_lead_id'
    ) THEN
      ALTER TABLE company_analyses_status
      ADD CONSTRAINT fk_company_analyses_status_lead_id
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add columns to leads table if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'company_industry'
    ) THEN
      ALTER TABLE leads ADD COLUMN company_industry TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'company_size'
    ) THEN
      ALTER TABLE leads ADD COLUMN company_size TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'last_analysis_at'
    ) THEN
      ALTER TABLE leads ADD COLUMN last_analysis_at TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$; 