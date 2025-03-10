-- Create a custom role with specific permissions
-- This script creates a new role and assigns it specific permissions

DO $$
DECLARE
    -- Role details
    v_role_name TEXT := 'Campaign Manager';
    v_role_description TEXT := 'Can manage campaigns but has limited access to other features';
    
    -- Permissions to assign (comma-separated list of permission names)
    v_permissions TEXT[] := ARRAY[
        'view_campaigns',
        'create_campaigns',
        'edit_campaigns',
        'delete_campaigns',
        'view_leads'
    ];
    
    v_role_id INTEGER;
    v_permission_id INTEGER;
    v_permission TEXT;
BEGIN
    -- Create the new role
    INSERT INTO roles (name, description, created_at, updated_at)
    VALUES (v_role_name, v_role_description, NOW(), NOW())
    ON CONFLICT (name) DO UPDATE 
    SET description = v_role_description, updated_at = NOW()
    RETURNING id INTO v_role_id;
    
    RAISE NOTICE 'Role % created or updated with ID %', v_role_name, v_role_id;
    
    -- Assign permissions to the role
    FOREACH v_permission IN ARRAY v_permissions
    LOOP
        -- Get the permission ID
        SELECT id INTO v_permission_id FROM permissions WHERE name = v_permission;
        
        IF v_permission_id IS NULL THEN
            RAISE WARNING 'Permission % not found, skipping', v_permission;
            CONTINUE;
        END IF;
        
        -- Assign the permission to the role
        INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
        VALUES (v_role_id, v_permission_id, NOW(), NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Permission % assigned to role %', v_permission, v_role_name;
    END LOOP;
    
    -- Display the role and its permissions
    RAISE NOTICE 'Role % created with % permissions', v_role_name, array_length(v_permissions, 1);
END;
$$; 