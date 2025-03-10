-- Manage permissions for a role
-- This script allows adding or removing permissions from a role

-- First, list all roles and permissions for reference
-- List all roles
SELECT id, name, description FROM roles ORDER BY name;

-- List all permissions
SELECT id, name, description, resource, action FROM permissions ORDER BY name;

-- Add a permission to a role
DO $$
DECLARE
    -- Replace these values with the actual role and permission
    v_role_name TEXT := 'Manager';                -- Replace with the role name
    v_permission_name TEXT := 'view_campaigns';   -- Replace with the permission name
    
    v_role_id INTEGER;
    v_permission_id INTEGER;
    v_operation TEXT := 'add';                    -- 'add' or 'remove'
BEGIN
    -- Get the role ID
    SELECT id INTO v_role_id FROM roles WHERE name = v_role_name;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role with name % not found', v_role_name;
    END IF;
    
    -- Get the permission ID
    SELECT id INTO v_permission_id FROM permissions WHERE name = v_permission_name;
    
    IF v_permission_id IS NULL THEN
        RAISE EXCEPTION 'Permission with name % not found', v_permission_name;
    END IF;
    
    -- Add or remove the permission
    IF v_operation = 'add' THEN
        -- Add the permission to the role
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (v_role_id, v_permission_id, NOW(), NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Permission % added to role %', v_permission_name, v_role_name;
    ELSIF v_operation = 'remove' THEN
        -- Remove the permission from the role
        DELETE FROM role_permissions 
        WHERE role_id = v_role_id AND permission_id = v_permission_id;
        
        IF FOUND THEN
            RAISE NOTICE 'Permission % removed from role %', v_permission_name, v_role_name;
        ELSE
            RAISE NOTICE 'Role % did not have permission %', v_role_name, v_permission_name;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid operation: %. Must be "add" or "remove"', v_operation;
    END IF;
END;
$$; 