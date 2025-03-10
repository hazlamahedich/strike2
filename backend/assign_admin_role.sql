-- Assign Admin role to a user by email
-- This script accepts a user email as a parameter and assigns the Admin role to that user

DO $$
DECLARE
    admin_role_id INTEGER;
    target_email TEXT := 'hazlamahedich@gmail.com';  -- This is an existing user in your database
    target_user_id UUID;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', target_email;
    END IF;
    
    -- Get the Admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found';
    END IF;
    
    -- Assign Admin role to the user
    INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
    VALUES (target_user_id, admin_role_id, NOW(), NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user % with email %', target_user_id, target_email;
END;
$$; 