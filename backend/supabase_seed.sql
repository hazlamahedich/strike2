-- Supabase Seed Data for AI-Powered CRM
-- This script populates the database with initial data

-- Insert default team
INSERT INTO teams (id, name, settings) VALUES 
(1, 'Default Team', '{"color": "#4f46e5", "logo": "default_logo.png"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert admin user (password is 'admin123' - change in production!)
INSERT INTO users (id, email, name, hashed_password, is_active, role, team_id) VALUES 
(1, 'admin@example.com', 'Admin User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'admin', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert manager user (password is 'manager123' - change in production!)
INSERT INTO users (id, email, name, hashed_password, is_active, role, team_id) VALUES 
(2, 'manager@example.com', 'Manager User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'manager', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sales rep user (password is 'sales123' - change in production!)
INSERT INTO users (id, email, name, hashed_password, is_active, role, team_id) VALUES 
(3, 'sales@example.com', 'Sales Rep', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'sales_rep', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO profiles (user_id, avatar_url, preferences, notification_settings) VALUES
(1, 'https://ui-avatars.com/api/?name=Admin+User&background=4f46e5&color=fff', 
   '{"theme": "light", "dashboard_layout": "default"}'::jsonb, 
   '{"email": true, "push": true, "sms": false}'::jsonb),
(2, 'https://ui-avatars.com/api/?name=Manager+User&background=4f46e5&color=fff', 
   '{"theme": "light", "dashboard_layout": "default"}'::jsonb, 
   '{"email": true, "push": true, "sms": false}'::jsonb),
(3, 'https://ui-avatars.com/api/?name=Sales+Rep&background=4f46e5&color=fff', 
   '{"theme": "light", "dashboard_layout": "default"}'::jsonb, 
   '{"email": true, "push": true, "sms": false}'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- Insert default pipeline stages
INSERT INTO pipeline_stages (id, name, order_index, team_id) VALUES
(1, 'new', 1, 1),
(2, 'contacted', 2, 1),
(3, 'qualified', 3, 1),
(4, 'proposal', 4, 1),
(5, 'negotiation', 5, 1),
(6, 'won', 6, 1),
(7, 'lost', 7, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample leads
INSERT INTO leads (id, first_name, last_name, email, phone, company, title, source, status, owner_id, team_id, lead_score, custom_fields) VALUES
(1, 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'Acme Inc', 'CEO', 'website', 'new', 3, 1, 65.0, '{"industry": "Technology", "size": "Medium", "budget": "100000"}'::jsonb),
(2, 'Jane', 'Smith', 'jane.smith@example.com', '+1987654321', 'XYZ Corp', 'CTO', 'referral', 'contacted', 3, 1, 80.0, '{"industry": "Healthcare", "size": "Large", "budget": "250000"}'::jsonb),
(3, 'Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455', 'ABC Ltd', 'COO', 'linkedin', 'qualified', 3, 1, 75.0, '{"industry": "Finance", "size": "Small", "budget": "50000"}'::jsonb),
(4, 'Alice', 'Williams', 'alice.williams@example.com', '+1555666777', 'Tech Solutions', 'CIO', 'cold_call', 'proposal', 3, 1, 90.0, '{"industry": "Technology", "size": "Large", "budget": "500000"}'::jsonb),
(5, 'Charlie', 'Brown', 'charlie.brown@example.com', '+1888999000', 'Brown Enterprises', 'CEO', 'email_campaign', 'negotiation', 3, 1, 95.0, '{"industry": "Retail", "size": "Medium", "budget": "150000"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert lead scores
INSERT INTO lead_scores (lead_id, score, score_type, factors, calculated_at) VALUES
(1, 65.0, 'engagement', '{"email_opens": 5, "website_visits": 3, "response_rate": 0.6}'::jsonb, NOW() - INTERVAL '2 days'),
(2, 80.0, 'engagement', '{"email_opens": 10, "website_visits": 8, "response_rate": 0.8}'::jsonb, NOW() - INTERVAL '1 day'),
(3, 75.0, 'engagement', '{"email_opens": 7, "website_visits": 5, "response_rate": 0.7}'::jsonb, NOW() - INTERVAL '3 days'),
(4, 90.0, 'engagement', '{"email_opens": 15, "website_visits": 12, "response_rate": 0.9}'::jsonb, NOW() - INTERVAL '12 hours'),
(5, 95.0, 'engagement', '{"email_opens": 20, "website_visits": 15, "response_rate": 0.95}'::jsonb, NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (id, title, description, due_date, priority, status, assigned_to, lead_id, created_by) VALUES
(1, 'Initial Contact', 'Reach out to introduce our services', NOW() + INTERVAL '1 day', 'high', 'pending', 3, 1, 2),
(2, 'Follow-up Call', 'Schedule a follow-up call to discuss requirements', NOW() + INTERVAL '3 days', 'medium', 'pending', 3, 2, 2),
(3, 'Send Proposal', 'Prepare and send the proposal document', NOW() + INTERVAL '5 days', 'high', 'pending', 3, 3, 2),
(4, 'Negotiation Meeting', 'Schedule a meeting to negotiate terms', NOW() + INTERVAL '7 days', 'high', 'pending', 3, 4, 2),
(5, 'Contract Finalization', 'Finalize and send the contract for signature', NOW() + INTERVAL '10 days', 'high', 'pending', 3, 5, 2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample notes
INSERT INTO notes (id, lead_id, body, created_by) VALUES
(1, 1, 'Initial contact made. John seemed interested in our premium plan.', 3),
(2, 2, 'Jane requested more information about our enterprise solutions.', 3),
(3, 3, 'Bob mentioned they are comparing our services with 2 other vendors.', 3),
(4, 4, 'Alice is ready to move forward with our proposal after some minor adjustments.', 3),
(5, 5, 'Charlie is negotiating on price. Offered a 10% discount for a 2-year commitment.', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample emails
INSERT INTO emails (id, lead_id, subject, body, sent_from, sent_to, sent_at, status, sentiment_score) VALUES
(1, 1, 'Introduction to Our Services', 'Dear John, I wanted to introduce our company and services...', 'sales@example.com', 'john.doe@example.com', NOW() - INTERVAL '5 days', 'sent', 0.8),
(2, 2, 'Follow-up on Our Conversation', 'Dear Jane, Thank you for your time on the phone today...', 'sales@example.com', 'jane.smith@example.com', NOW() - INTERVAL '3 days', 'sent', 0.9),
(3, 3, 'Proposal for Your Review', 'Dear Bob, Please find attached our proposal for your review...', 'sales@example.com', 'bob.johnson@example.com', NOW() - INTERVAL '2 days', 'sent', 0.7),
(4, 4, 'Updated Proposal', 'Dear Alice, As discussed, I have updated our proposal...', 'sales@example.com', 'alice.williams@example.com', NOW() - INTERVAL '1 day', 'sent', 0.85),
(5, 5, 'Contract Details', 'Dear Charlie, I am pleased to send you the contract details...', 'sales@example.com', 'charlie.brown@example.com', NOW() - INTERVAL '12 hours', 'sent', 0.95)
ON CONFLICT (id) DO NOTHING;

-- Insert sample calls
INSERT INTO calls (id, lead_id, direction, duration, notes, caller, recipient, call_time) VALUES
(1, 1, 'outbound', 300, 'Discussed our services and John showed interest in the premium plan.', 'Sales Rep', 'John Doe', NOW() - INTERVAL '4 days'),
(2, 2, 'outbound', 450, 'Jane had questions about integration with their existing systems.', 'Sales Rep', 'Jane Smith', NOW() - INTERVAL '2 days'),
(3, 3, 'inbound', 600, 'Bob called to discuss pricing options and volume discounts.', 'Bob Johnson', 'Sales Rep', NOW() - INTERVAL '1 day'),
(4, 4, 'outbound', 480, 'Discussed the proposal details and addressed Alice\'s concerns.', 'Sales Rep', 'Alice Williams', NOW() - INTERVAL '10 hours'),
(5, 5, 'outbound', 720, 'Negotiated contract terms and discussed implementation timeline.', 'Sales Rep', 'Charlie Brown', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample meetings
INSERT INTO meetings (id, lead_id, title, description, start_time, end_time, location, status, created_by) VALUES
(1, 1, 'Initial Consultation', 'Discuss requirements and present our solutions', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Zoom', 'scheduled', 3),
(2, 2, 'Technical Discussion', 'Deep dive into technical requirements and integration options', NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '2 hours', 'Google Meet', 'scheduled', 3),
(3, 3, 'Proposal Review', 'Review the proposal and address any questions', NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '1 hour', 'Microsoft Teams', 'scheduled', 3),
(4, 4, 'Final Negotiation', 'Finalize the deal terms and pricing', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '2 hours', 'In-person (Client Office)', 'scheduled', 3),
(5, 5, 'Contract Signing', 'Review and sign the contract', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '1 hour', 'Zoom', 'scheduled', 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample campaigns
INSERT INTO campaigns (id, name, description, status, type, start_date, end_date, created_by, team_id) VALUES
(1, 'Spring Promotion', 'Special offers for the spring season', 'active', 'email', NOW(), NOW() + INTERVAL '30 days', 2, 1),
(2, 'Product Launch', 'Campaign for our new product launch', 'draft', 'multi-channel', NOW() + INTERVAL '15 days', NOW() + INTERVAL '45 days', 2, 1),
(3, 'Webinar Series', 'Educational webinar series for prospects', 'active', 'event', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 2, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert campaign leads
INSERT INTO campaign_leads (campaign_id, lead_id, status, added_at) VALUES
(1, 1, 'active', NOW() - INTERVAL '5 days'),
(1, 2, 'active', NOW() - INTERVAL '5 days'),
(1, 3, 'active', NOW() - INTERVAL '5 days'),
(3, 3, 'active', NOW() - INTERVAL '10 days'),
(3, 4, 'active', NOW() - INTERVAL '10 days'),
(3, 5, 'active', NOW() - INTERVAL '10 days')
ON CONFLICT (campaign_id, lead_id) DO NOTHING;

-- Insert activities (will be mostly handled by triggers, but adding some initial ones)
INSERT INTO activities (lead_id, user_id, activity_type, activity_id, metadata, created_at) VALUES
(1, 3, 'email', 1, '{"action": "sent", "timestamp": "' || (NOW() - INTERVAL '5 days')::text || '"}', NOW() - INTERVAL '5 days'),
(2, 3, 'email', 2, '{"action": "sent", "timestamp": "' || (NOW() - INTERVAL '3 days')::text || '"}', NOW() - INTERVAL '3 days'),
(3, 3, 'email', 3, '{"action": "sent", "timestamp": "' || (NOW() - INTERVAL '2 days')::text || '"}', NOW() - INTERVAL '2 days'),
(4, 3, 'email', 4, '{"action": "sent", "timestamp": "' || (NOW() - INTERVAL '1 day')::text || '"}', NOW() - INTERVAL '1 day'),
(5, 3, 'email', 5, '{"action": "sent", "timestamp": "' || (NOW() - INTERVAL '12 hours')::text || '"}', NOW() - INTERVAL '12 hours'),
(1, 3, 'call', 1, '{"action": "completed", "timestamp": "' || (NOW() - INTERVAL '4 days')::text || '"}', NOW() - INTERVAL '4 days'),
(2, 3, 'call', 2, '{"action": "completed", "timestamp": "' || (NOW() - INTERVAL '2 days')::text || '"}', NOW() - INTERVAL '2 days'),
(3, 3, 'call', 3, '{"action": "completed", "timestamp": "' || (NOW() - INTERVAL '1 day')::text || '"}', NOW() - INTERVAL '1 day'),
(4, 3, 'call', 4, '{"action": "completed", "timestamp": "' || (NOW() - INTERVAL '10 hours')::text || '"}', NOW() - INTERVAL '10 hours'),
(5, 3, 'call', 5, '{"action": "completed", "timestamp": "' || (NOW() - INTERVAL '5 hours')::text || '"}', NOW() - INTERVAL '5 hours'),
(1, 3, 'note', 1, '{"action": "created", "timestamp": "' || NOW()::text || '"}', NOW()),
(2, 3, 'note', 2, '{"action": "created", "timestamp": "' || NOW()::text || '"}', NOW()),
(3, 3, 'note', 3, '{"action": "created", "timestamp": "' || NOW()::text || '"}', NOW()),
(4, 3, 'note', 4, '{"action": "created", "timestamp": "' || NOW()::text || '"}', NOW()),
(5, 3, 'note', 5, '{"action": "created", "timestamp": "' || NOW()::text || '"}', NOW()); 