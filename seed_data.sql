-- Clear existing data
TRUNCATE TABLE task_notes, tasks, campaign_leads, campaigns, leads, profiles, users, teams CASCADE;

-- Reset sequences
ALTER SEQUENCE teams_id_seq RESTART WITH 1;
ALTER SEQUENCE leads_id_seq RESTART WITH 1;
ALTER SEQUENCE campaigns_id_seq RESTART WITH 1;
ALTER SEQUENCE campaign_leads_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE task_notes_id_seq RESTART WITH 1;
ALTER SEQUENCE profiles_id_seq RESTART WITH 1;

-- Temporarily disable the trigger that's causing the issue
ALTER TABLE tasks DISABLE TRIGGER log_task_activity;

DO $$
DECLARE
    team_id INT;
    admin_id UUID;
    sales_id UUID;
    marketing_id UUID;
    lead1_id INT;
    lead2_id INT;
    lead3_id INT;
    lead4_id INT;
    campaign1_id INT;
    campaign2_id INT;
    task1_id INT;
    task2_id INT;
    task3_id INT;
BEGIN
    -- Insert team
    INSERT INTO teams (name, settings, created_at, updated_at) 
    VALUES ('Demo Team', '{"company_info": {"name": "Acme Corp", "industry": "Technology"}}', NOW(), NOW())
    RETURNING id INTO team_id;
    
    -- Insert users with explicit return of admin_id
    INSERT INTO users (id, email, name, hashed_password, is_active, role, team_id, created_at, updated_at) 
    VALUES 
        (gen_random_uuid(), 'admin@example.com', 'Admin User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'admin', team_id, NOW(), NOW()),
        (gen_random_uuid(), 'sales@example.com', 'Sales User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'member', team_id, NOW(), NOW()),
        (gen_random_uuid(), 'marketing@example.com', 'Marketing User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, 'member', team_id, NOW(), NOW());
    
    -- Get user IDs with LIMIT 1 to ensure only one row is returned
    SELECT id INTO admin_id FROM users WHERE email = 'admin@example.com' LIMIT 1;
    SELECT id INTO sales_id FROM users WHERE email = 'sales@example.com' LIMIT 1;
    SELECT id INTO marketing_id FROM users WHERE email = 'marketing@example.com' LIMIT 1;
    
    -- Create profiles for users
    INSERT INTO profiles (user_id, avatar_url, preferences, notification_settings, created_at, updated_at)
    VALUES 
        (admin_id, 'https://randomuser.me/api/portraits/men/1.jpg', '{"theme": "light", "language": "en"}', '{"email": true, "push": true}', NOW(), NOW()),
        (sales_id, 'https://randomuser.me/api/portraits/women/2.jpg', '{"theme": "dark", "language": "en"}', '{"email": true, "push": false}', NOW(), NOW()),
        (marketing_id, 'https://randomuser.me/api/portraits/women/3.jpg', '{"theme": "light", "language": "es"}', '{"email": false, "push": true}', NOW(), NOW());
    
    -- Insert leads
    INSERT INTO leads (first_name, last_name, email, phone, company, title, source, status, owner_id, team_id, lead_score, custom_fields, created_at, updated_at)
    VALUES
        ('John', 'Doe', 'john.doe@example.com', '555-123-4567', 'ABC Corp', 'CEO', 'Website', 'New', sales_id, team_id, 85.5, '{"industry": "Technology", "budget": "100000"}', NOW(), NOW()),
        ('Jane', 'Smith', 'jane.smith@example.com', '555-987-6543', 'XYZ Inc', 'CTO', 'Referral', 'Qualified', marketing_id, team_id, 92.0, '{"industry": "Healthcare", "budget": "250000"}', NOW(), NOW()),
        ('Robert', 'Johnson', 'robert@example.com', '555-555-5555', 'Johnson LLC', 'Director', 'LinkedIn', 'Contacted', sales_id, team_id, 67.8, '{"industry": "Finance", "budget": "75000"}', NOW(), NOW()),
        ('Susan', 'Williams', 'susan@example.com', '555-444-3333', 'Williams Co', 'VP', 'Trade Show', 'Negotiation', admin_id, team_id, 78.2, '{"industry": "Retail", "budget": "150000"}', NOW(), NOW());
    
    -- Get lead IDs with LIMIT 1
    SELECT id INTO lead1_id FROM leads WHERE email = 'john.doe@example.com' LIMIT 1;
    SELECT id INTO lead2_id FROM leads WHERE email = 'jane.smith@example.com' LIMIT 1;
    SELECT id INTO lead3_id FROM leads WHERE email = 'robert@example.com' LIMIT 1;
    SELECT id INTO lead4_id FROM leads WHERE email = 'susan@example.com' LIMIT 1;
    
    -- Insert campaigns
    INSERT INTO campaigns (name, description, status, type, start_date, end_date, created_by, team_id, settings, created_at, updated_at)
    VALUES
        ('Summer Email Campaign', 'Promotional campaign for summer products', 'Active', 'Email', NOW(), NOW() + INTERVAL '30 days', marketing_id, team_id, '{"goal": "lead_generation", "tags": ["summer", "promotion", "email"]}', NOW(), NOW()),
        ('LinkedIn Outreach', 'B2B outreach via LinkedIn', 'Planning', 'Social', NOW() + INTERVAL '5 days', NOW() + INTERVAL '60 days', sales_id, team_id, '{"goal": "sales_conversion", "tags": ["linkedin", "b2b", "outreach"]}', NOW(), NOW());
    
    -- Get campaign IDs with LIMIT 1
    SELECT id INTO campaign1_id FROM campaigns WHERE name = 'Summer Email Campaign' LIMIT 1;
    SELECT id INTO campaign2_id FROM campaigns WHERE name = 'LinkedIn Outreach' LIMIT 1;
    
    -- Link leads to campaigns
    INSERT INTO campaign_leads (campaign_id, lead_id, status, added_at, added_by, metadata)
    VALUES
        (campaign1_id, lead1_id, 'Sent', NOW() - INTERVAL '5 days', marketing_id, '{"response": "Opened", "notes": "Responded positively to initial email"}'),
        (campaign1_id, lead2_id, 'Scheduled', NOW() - INTERVAL '3 days', marketing_id, '{"response": "Clicked", "notes": "Clicked multiple links"}'),
        (campaign2_id, lead3_id, 'Pending', NOW(), sales_id, '{"response": "None", "notes": "New addition to campaign"}'),
        (campaign2_id, lead4_id, 'Sent', NOW() - INTERVAL '1 day', sales_id, '{"response": "None", "notes": "No response yet"}');
    
    -- Insert tasks with leads
    INSERT INTO tasks (title, description, due_date, priority, status, assigned_to, lead_id, created_by, created_at, updated_at)
    VALUES
        ('Follow up with John', 'Send follow-up email about proposal', NOW() + INTERVAL '2 days', 'HIGH', 'TODO', sales_id, lead1_id, admin_id, NOW(), NOW()),
        ('Schedule demo with Jane', 'Technical demo of new features', NOW() + INTERVAL '5 days', 'MEDIUM', 'TODO', marketing_id, lead2_id, marketing_id, NOW(), NOW());
    
    -- Get task IDs with LIMIT 1
    SELECT id INTO task1_id FROM tasks WHERE title = 'Follow up with John' LIMIT 1;
    SELECT id INTO task2_id FROM tasks WHERE title = 'Schedule demo with Jane' LIMIT 1;
    
    -- Insert task notes
    INSERT INTO task_notes (task_id, body, created_by, created_at, updated_at)
    VALUES
        (task1_id, 'John seemed interested in our premium plan', sales_id, NOW(), NOW()),
        (task2_id, 'Jane requested technical details before the demo', marketing_id, NOW(), NOW());
        
    -- Now manually insert a task without a lead_id, but we need to do it separately to avoid the trigger
    -- We'll add it after we re-enable the trigger
END $$;

-- Re-enable the trigger for normal operation
ALTER TABLE tasks ENABLE TRIGGER log_task_activity;

-- Now we can manually insert activities for our general task
INSERT INTO tasks (title, description, due_date, priority, status, assigned_to, lead_id, created_by, created_at, updated_at)
VALUES ('Quarterly planning', 'Prepare Q3 sales strategy document', NOW() + INTERVAL '10 days', 'LOW', 'TODO', 
  (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1), 
  (SELECT id FROM leads LIMIT 1), -- Assign to any lead to satisfy the constraint
  (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1), 
  NOW(), NOW()); 