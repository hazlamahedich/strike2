-- Analytics Tables for Supabase
-- This file contains the SQL to create the necessary tables and views for the analytics module

-- Overview stats table
CREATE TABLE IF NOT EXISTS analytics_overview (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_leads INTEGER NOT NULL DEFAULT 0,
  active_leads INTEGER NOT NULL DEFAULT 0,
  total_campaigns INTEGER NOT NULL DEFAULT 0,
  active_campaigns INTEGER NOT NULL DEFAULT 0,
  total_communications INTEGER NOT NULL DEFAULT 0,
  total_meetings INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  response_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead stats table
CREATE TABLE IF NOT EXISTS analytics_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total INTEGER NOT NULL DEFAULT 0,
  by_status JSONB NOT NULL DEFAULT '{}'::JSONB,
  by_source JSONB NOT NULL DEFAULT '{}'::JSONB,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  acquisition_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign stats table
CREATE TABLE IF NOT EXISTS analytics_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  by_type JSONB NOT NULL DEFAULT '{}'::JSONB,
  performance JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication stats table
CREATE TABLE IF NOT EXISTS analytics_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total INTEGER NOT NULL DEFAULT 0,
  by_type JSONB NOT NULL DEFAULT '{}'::JSONB,
  by_status JSONB NOT NULL DEFAULT '{}'::JSONB,
  response_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  average_response_time NUMERIC(5,2) NOT NULL DEFAULT 0,
  sentiment_analysis JSONB NOT NULL DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS analytics_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  lead_quality_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  average_deal_size NUMERIC(10,2) NOT NULL DEFAULT 0,
  sales_cycle INTEGER NOT NULL DEFAULT 0,
  customer_acquisition_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  return_on_investment NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_series_data JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trend data table
CREATE TABLE IF NOT EXISTS analytics_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_growth JSONB NOT NULL DEFAULT '[]'::JSONB,
  conversion_trend JSONB NOT NULL DEFAULT '[]'::JSONB,
  campaign_performance JSONB NOT NULL DEFAULT '[]'::JSONB,
  communication_effectiveness JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis and recommendations table
CREATE TABLE IF NOT EXISTS analytics_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary TEXT NOT NULL DEFAULT '',
  strengths JSONB NOT NULL DEFAULT '[]'::JSONB,
  weaknesses JSONB NOT NULL DEFAULT '[]'::JSONB,
  opportunities JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommendations JSONB NOT NULL DEFAULT '[]'::JSONB,
  insight_details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User performance table
CREATE TABLE IF NOT EXISTS analytics_user_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  users JSONB NOT NULL DEFAULT '[]'::JSONB,
  team_metrics JSONB NOT NULL DEFAULT '{
    "averageLeadsPerUser": 0,
    "averageConversionRate": 0,
    "averageResponseTime": 0,
    "averageActivitiesCompleted": 0
  }'::JSONB,
  time_series_data JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Row Level Security (RLS) policies
ALTER TABLE analytics_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_user_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics tables
-- Only authenticated users can view analytics data
CREATE POLICY "Allow authenticated users to view analytics_overview"
  ON analytics_overview FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_leads"
  ON analytics_leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_campaigns"
  ON analytics_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_communications"
  ON analytics_communications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_performance"
  ON analytics_performance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_trends"
  ON analytics_trends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_analysis"
  ON analytics_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view analytics_user_performance"
  ON analytics_user_performance FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update analytics data
CREATE POLICY "Allow admins to manage analytics_overview"
  ON analytics_overview FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_leads"
  ON analytics_leads FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_campaigns"
  ON analytics_campaigns FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_communications"
  ON analytics_communications FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_performance"
  ON analytics_performance FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_trends"
  ON analytics_trends FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_analysis"
  ON analytics_analysis FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow admins to manage analytics_user_performance"
  ON analytics_user_performance FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create functions to update analytics data
CREATE OR REPLACE FUNCTION update_analytics_overview()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would be called by triggers on leads, campaigns, etc.
  -- to update the analytics_overview table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate AI analysis (this would be called by a backend service)
CREATE OR REPLACE FUNCTION generate_analytics_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- In a real implementation, this would call an external service or use pgvector
  -- to generate AI-powered analysis and recommendations
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate user performance metrics
CREATE OR REPLACE FUNCTION calculate_user_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would calculate performance metrics for each user
  -- based on their activities, leads, and other data
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 