-- Assign a role to a user by email
-- This script accepts a user email and role name as parameters and assigns the role to that user

DO $$
DECLARE
    target_email TEXT := 'test@example.com';  -- This is an existing user in your database
    role_name TEXT := 'Manager';              -- Replace with the role name to assign
    target_user_id UUID;
    target_role_id INTEGER;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', target_email;
    END IF;
    
    -- Get the role ID from the name
    SELECT id INTO target_role_id FROM roles WHERE name = role_name;
    
    IF target_role_id IS NULL THEN
        RAISE EXCEPTION 'Role with name % not found', role_name;
    END IF;
    
    -- Assign role to the user
    INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
    VALUES (target_user_id, target_role_id, NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned to user % with email %', role_name, target_user_id, target_email;
END;
$$; 