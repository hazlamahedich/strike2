-- Interactive script to assign a role to a user
-- This script will prompt for the user's email and the role name

-- First, list available users and roles for reference
-- List all users
SELECT id, email FROM auth.users ORDER BY email;

-- List all roles
SELECT id, name FROM roles ORDER BY name;

-- Now assign the role (you'll need to replace these values with the actual email and role)
DO $$
DECLARE
    -- Replace these values with the actual email and role name
    v_email TEXT := 'test@example.com';  -- Replace with the user's email
    v_role TEXT := 'Manager';            -- Replace with the role name
    
    v_user_id UUID;
    v_role_id INTEGER;
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
    
    -- Assign the role
    INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
    VALUES (v_user_id, v_role_id, NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned to user % with email %', v_role, v_user_id, v_email;
END;
$$; 