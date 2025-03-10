-- Remove a role from a user
-- This script removes a specific role from a user

DO $$
DECLARE
    v_email TEXT := 'test@example.com';  -- Replace with the user's email
    v_role TEXT := 'Manager';            -- Replace with the role name to remove
    
    v_user_id UUID;
    v_role_id INTEGER;
    v_deleted BOOLEAN;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', v_email;
    END IF;
    
    -- Get the role ID
    SELECT id INTO v_role_id FROM roles WHERE name = v_role;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role with name % not found', v_role;
    END IF;
    
    -- Delete the role assignment
    WITH deleted AS (
        DELETE FROM user_roles 
        WHERE user_id = v_user_id AND role_id = v_role_id
        RETURNING *
    )
    SELECT EXISTS(SELECT 1 FROM deleted) INTO v_deleted;
    
    IF v_deleted THEN
        RAISE NOTICE 'Role % removed from user with email %', v_role, v_email;
    ELSE
        RAISE NOTICE 'User with email % did not have role %', v_email, v_role;
    END IF;
END;
$$; 