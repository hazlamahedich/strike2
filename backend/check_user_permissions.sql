-- Check a user's permissions
-- This script displays all permissions a user has based on their roles

-- First, list all users for reference
SELECT id, email FROM auth.users ORDER BY email;

-- Check permissions for a specific user
DO $$
DECLARE
    v_email TEXT := 'test@example.com';  -- Replace with the user's email
    v_user_id UUID;
    v_has_permissions BOOLEAN;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', v_email;
    END IF;
    
    -- Check if the user has any permissions
    SELECT EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = v_user_id
    ) INTO v_has_permissions;
    
    IF NOT v_has_permissions THEN
        RAISE NOTICE 'User % has no permissions assigned', v_email;
    ELSE
        RAISE NOTICE 'User % has the following permissions:', v_email;
    END IF;
END;
$$;

-- Display all permissions for a specific user
SELECT 
    u.email,
    r.name AS role_name,
    p.name AS permission_name,
    p.description AS permission_description,
    p.resource,
    p.action
FROM 
    auth.users u
JOIN 
    user_roles ur ON u.id = ur.user_id
JOIN 
    roles r ON ur.role_id = r.id
JOIN 
    role_permissions rp ON r.id = rp.role_id
JOIN 
    permissions p ON rp.permission_id = p.id
WHERE 
    u.email = 'test@example.com'  -- Replace with the user's email
ORDER BY 
    r.name, p.name;

-- Test the has_permission function for a specific user and permission
SELECT 
    has_permission('test@example.com', 'view_campaigns') AS can_view_campaigns,
    has_permission('test@example.com', 'edit_campaigns') AS can_edit_campaigns,
    has_permission('test@example.com', 'delete_campaigns') AS can_delete_campaigns,
    has_permission('test@example.com', 'manage_users') AS can_manage_users; 