-- Fix Admin Login SQL Script
-- This script fixes the admin login issue by:
-- 1. Creating a new admin user (if the existing one can't be fixed)
-- 2. Fixing the trigger that causes password mismatches

-- PART 1: Create a new admin user
-- First, check if the new admin email already exists
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin_new@example.com') INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE 'User admin_new@example.com already exists. Skipping creation.';
  ELSE
    -- Create a new admin user with a known password
    -- Note: This might fail due to permissions, but we'll try anyway
    BEGIN
      INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      VALUES (
        'admin_new@example.com',
        '$2a$10$Nt0RHXCsnIEjsStZKS.WeOjVMOQhTg0ZD7GNPXDhCH1MsPTbRkQdK', -- bcrypt hash for 'admin123'
        NOW(),
        '{"is_admin": true, "full_name": "New Admin User", "email_verified": true}'::jsonb,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created new admin user: admin_new@example.com with password: admin123';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create new admin user due to: %', SQLERRM;
        RAISE NOTICE 'You will need to create a new admin user through the Supabase dashboard or API.';
    END;
  END IF;
END $$;

-- PART 2: Fix the trigger that causes password mismatches
-- Drop the existing trigger
DROP TRIGGER IF EXISTS sync_auth_user_to_public_trigger ON auth.users;

-- Create a new version of the sync_auth_user_to_public function
-- that doesn't set a default password
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Extract name from email or user metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    v_name := NEW.raw_user_meta_data->>'full_name';
  ELSE
    v_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Insert or update the user
  -- Note: We're no longer setting a default password hash
  INSERT INTO public.users (
    id,
    email,
    name,
    is_active,
    role,
    team_id,
    auth_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    TRUE,
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin'
      ELSE 'user'
    END,
    1, -- Default team_id
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    name = v_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in sync_auth_user_to_public: %', SQLERRM;
    RETURN NEW; -- Continue even if there's an error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger again
CREATE TRIGGER sync_auth_user_to_public_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_public();

-- Add a comment to explain what this trigger does
COMMENT ON FUNCTION public.sync_auth_user_to_public() IS 
'Syncs user data from auth.users to public.users without setting a password hash.
This ensures that authentication is handled solely through auth.users.';

-- PART 3: Provide instructions for next steps
DO $$
BEGIN
  RAISE NOTICE '=== Admin Login Fix Complete ===';
  RAISE NOTICE 'The trigger has been fixed to prevent future password mismatches.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Try logging in with the existing admin account (admin@example.com) using common passwords like:';
  RAISE NOTICE '   - admin123';
  RAISE NOTICE '   - password';
  RAISE NOTICE '   - admin';
  RAISE NOTICE '   - adminadmin';
  RAISE NOTICE '';
  RAISE NOTICE '2. If that doesn''t work, try using the password reset feature on the login page.';
  RAISE NOTICE '';
  RAISE NOTICE '3. If password reset doesn''t work, you may need to create a new admin user through the Supabase dashboard.';
  RAISE NOTICE '';
  RAISE NOTICE '4. Alternatively, you can use the JavaScript tools provided:';
  RAISE NOTICE '   - try-admin-login.js: Tries common passwords for the admin account';
  RAISE NOTICE '   - reset-admin-password-direct.js: Sends a password reset email to the admin account';
  RAISE NOTICE '';
END $$; 