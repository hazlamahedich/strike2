-- Add new permissions to the system
-- This script adds new permissions that can be assigned to roles

-- First, list existing permissions for reference
SELECT id, name, description, resource, action FROM permissions ORDER BY name;

-- Add new permissions
INSERT INTO permissions (name, description, resource, action, created_at, updated_at)
VALUES 
    ('view_audit_logs', 'Can view audit logs', 'audit_logs', 'read', NOW(), NOW()),
    ('manage_chatbot', 'Can configure and manage the chatbot', 'chatbot', 'manage', NOW(), NOW()),
    ('view_analytics', 'Can view analytics dashboards', 'analytics', 'read', NOW(), NOW()),
    ('export_data', 'Can export data from the system', 'data', 'export', NOW(), NOW()),
    ('manage_integrations', 'Can manage third-party integrations', 'integrations', 'manage', NOW(), NOW()),
    ('manage_templates', 'Can create and edit email templates', 'templates', 'manage', NOW(), NOW()),
    ('view_cost_reports', 'Can view LLM cost reports', 'cost_reports', 'read', NOW(), NOW()),
    ('manage_tickets', 'Can manage support tickets', 'tickets', 'manage', NOW(), NOW())
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description, 
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    updated_at = NOW();

-- Assign new permissions to Admin role
DO $$
DECLARE
    admin_role_id INTEGER;
    new_permissions TEXT[] := ARRAY[
        'view_audit_logs',
        'manage_chatbot',
        'view_analytics',
        'export_data',
        'manage_integrations',
        'manage_templates',
        'view_cost_reports',
        'manage_tickets'
    ];
    v_permission TEXT;
    v_permission_id INTEGER;
BEGIN
    -- Get the Admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found';
    END IF;
    
    -- Assign each new permission to the Admin role
    FOREACH v_permission IN ARRAY new_permissions
    LOOP
        -- Get the permission ID
        SELECT id INTO v_permission_id FROM permissions WHERE name = v_permission;
        
        IF v_permission_id IS NULL THEN
            RAISE WARNING 'Permission % not found, skipping', v_permission;
            CONTINUE;
        END IF;
        
        -- Assign the permission to the Admin role
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (admin_role_id, v_permission_id, NOW(), NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Permission % assigned to Admin role', v_permission;
    END LOOP;
END;
$$; 