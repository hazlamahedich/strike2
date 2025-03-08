-- Campaign Analytics Tables for Supabase

-- Campaign Performance Table
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sends INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  open_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  click_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  unsubscribes INTEGER NOT NULL DEFAULT 0,
  bounces INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- Campaign Timeline Events Table
CREATE TABLE IF NOT EXISTS campaign_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Lead Stats View
CREATE OR REPLACE VIEW campaign_lead_stats AS
SELECT
  c.id AS campaign_id,
  COUNT(cl.lead_id) AS total,
  COUNT(CASE WHEN cl.status = 'active' THEN 1 END) AS active,
  COUNT(CASE WHEN cl.status = 'engaged' THEN 1 END) AS engaged,
  COUNT(CASE WHEN cl.status = 'converted' THEN 1 END) AS converted,
  COUNT(CASE WHEN cl.status = 'unsubscribed' THEN 1 END) AS unsubscribed,
  jsonb_object_agg(
    COALESCE(l.source, 'Unknown'), 
    COUNT(l.id)
  ) FILTER (WHERE l.source IS NOT NULL) AS by_source,
  jsonb_object_agg(
    COALESCE(l.status, 'Unknown'), 
    COUNT(l.id)
  ) FILTER (WHERE l.status IS NOT NULL) AS by_status
FROM
  campaigns c
LEFT JOIN
  campaign_leads cl ON c.id = cl.campaign_id
LEFT JOIN
  leads l ON cl.lead_id = l.id
GROUP BY
  c.id;

-- Campaign Activity Stats View
CREATE OR REPLACE VIEW campaign_activity_stats AS
WITH recent_activities AS (
  SELECT
    ca.campaign_id,
    ca.id,
    ca.activity_type AS type,
    ca.title,
    ca.status,
    ca.created_at,
    ROW_NUMBER() OVER (PARTITION BY ca.campaign_id ORDER BY ca.created_at DESC) AS rn
  FROM
    campaign_activities ca
)
SELECT
  c.id AS campaign_id,
  COUNT(ca.id) AS total,
  jsonb_object_agg(
    COALESCE(ca.activity_type, 'Unknown'), 
    COUNT(ca.id)
  ) FILTER (WHERE ca.activity_type IS NOT NULL) AS by_type,
  jsonb_object_agg(
    COALESCE(ca.status, 'Unknown'), 
    COUNT(ca.id)
  ) FILTER (WHERE ca.status IS NOT NULL) AS by_status,
  CASE 
    WHEN COUNT(ca.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN ca.status = 'completed' THEN 1 END)::DECIMAL / COUNT(ca.id)) * 100, 1)
    ELSE 0
  END AS completion_rate,
  jsonb_agg(
    jsonb_build_object(
      'id', ra.id,
      'type', ra.type,
      'title', ra.title,
      'status', ra.status,
      'created_at', ra.created_at
    )
  ) FILTER (WHERE ra.rn <= 5) AS recent
FROM
  campaigns c
LEFT JOIN
  campaign_activities ca ON c.id = ca.campaign_id
LEFT JOIN
  recent_activities ra ON c.id = ra.campaign_id
GROUP BY
  c.id;

-- Campaign Overview Stats View
CREATE OR REPLACE VIEW campaign_overview_stats AS
SELECT
  COUNT(*) AS total_campaigns,
  COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_campaigns,
  COUNT(CASE WHEN status = 'paused' THEN 1 END) AS paused_campaigns,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_campaigns,
  COALESCE(SUM(lead_count), 0) AS total_leads,
  COALESCE(
    AVG(
      CASE 
        WHEN metrics->>'open_rate' IS NOT NULL AND metrics->>'open_rate' != '' 
        THEN (metrics->>'open_rate')::DECIMAL 
        ELSE NULL 
      END
    ), 
    0
  ) AS average_open_rate,
  COALESCE(
    AVG(
      CASE 
        WHEN metrics->>'click_rate' IS NOT NULL AND metrics->>'click_rate' != '' 
        THEN (metrics->>'click_rate')::DECIMAL 
        ELSE NULL 
      END
    ), 
    0
  ) AS average_click_rate,
  COALESCE(
    AVG(
      CASE 
        WHEN metrics->>'conversion_rate' IS NOT NULL AND metrics->>'conversion_rate' != '' 
        THEN (metrics->>'conversion_rate')::DECIMAL 
        ELSE NULL 
      END
    ), 
    0
  ) AS average_conversion_rate
FROM
  campaigns;

-- RLS Policies for Campaign Analytics Tables
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_timeline_events ENABLE ROW LEVEL SECURITY;

-- Policy for campaign_performance: Users can read performance data for campaigns they have access to
CREATE POLICY campaign_performance_select_policy ON campaign_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
      AND (
        c.created_by = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = c.team_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'marketer'))
      )
    )
  );

-- Policy for campaign_timeline_events: Users can read timeline events for campaigns they have access to
CREATE POLICY campaign_timeline_events_select_policy ON campaign_timeline_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_id
      AND (
        c.created_by = auth.uid()
        OR auth.uid() IN (SELECT user_id FROM team_members WHERE team_id = c.team_id)
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'marketer'))
      )
    )
  );

-- Function to record campaign events
CREATE OR REPLACE FUNCTION record_campaign_event(
  p_campaign_id UUID,
  p_event_type VARCHAR,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO campaign_timeline_events (
    campaign_id,
    event_type,
    description,
    metadata
  ) VALUES (
    p_campaign_id,
    p_event_type,
    p_description,
    COALESCE(p_metadata, '{}'::JSONB)
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to record campaign status changes
CREATE OR REPLACE FUNCTION campaign_status_change_trigger() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM record_campaign_event(
      NEW.id,
      'campaign_' || LOWER(NEW.status),
      'Campaign status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER campaign_status_change
AFTER UPDATE OF status ON campaigns
FOR EACH ROW
EXECUTE FUNCTION campaign_status_change_trigger(); 