-- Fix All Tables SQL Script
-- This script fixes all tables and triggers to ensure proper synchronization

-- PART 1: Fix the admin password in auth.users
-- This sets the password to 'admin123'
UPDATE auth.users
SET encrypted_password = '$2a$10$Nt0RHXCsnIEjsStZKS.WeOjVMOQhTg0ZD7GNPXDhCH1MsPTbRkQdK'  -- bcrypt hash for 'admin123'
WHERE email = 'admin@example.com';

-- PART 2: Fix the password in public.users to match auth.users
UPDATE public.users
SET hashed_password = '$2a$10$Nt0RHXCsnIEjsStZKS.WeOjVMOQhTg0ZD7GNPXDhCH1MsPTbRkQdK'  -- bcrypt hash for 'admin123'
WHERE email = 'admin@example.com';

-- PART 3: Fix the sync_auth_user_to_public trigger
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

-- PART 4: Fix the create_profile_for_user trigger
-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS create_profile_trigger ON public.users;

-- Create or replace the function
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_is_admin BOOLEAN;
  v_auth_meta JSONB;
BEGIN
  -- Try to get metadata from auth.users
  BEGIN
    SELECT raw_user_meta_data INTO v_auth_meta
    FROM auth.users
    WHERE id = NEW.id;
    
    v_full_name := v_auth_meta->>'full_name';
    v_is_admin := (v_auth_meta->>'is_admin')::BOOLEAN;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not get metadata from auth.users: %', SQLERRM;
  END;
  
  -- Use defaults if we couldn't get the data
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := split_part(NEW.email, '@', 1);
  END IF;
  
  IF v_is_admin IS NULL THEN
    v_is_admin := NEW.email LIKE '%admin%' OR NEW.role = 'admin';
  END IF;
  
  -- Create a profile for the new user
  INSERT INTO profiles (
    user_id,
    avatar_url,
    preferences,
    notification_settings,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'https://ui-avatars.com/api/?name=' || replace(v_full_name, ' ', '+') || '&background=random',
    jsonb_build_object(
      'theme', 'system',
      'language', 'en',
      'full_name', v_full_name,
      'is_admin', v_is_admin
    ),
    jsonb_build_object(
      'email', true,
      'push', false
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferences = jsonb_build_object(
      'theme', COALESCE((profiles.preferences->>'theme'), 'system'),
      'language', COALESCE((profiles.preferences->>'language'), 'en'),
      'full_name', v_full_name,
      'is_admin', v_is_admin
    ),
    avatar_url = 'https://ui-avatars.com/api/?name=' || replace(v_full_name, ' ', '+') || '&background=random',
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_profile_for_user: %', SQLERRM;
    RETURN NEW; -- Continue even if there's an error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER create_profile_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();

-- PART 5: Update the admin profile
DO $$
DECLARE
  v_user_id UUID := '1504c604-d686-49ed-b943-37d335a93d36';  -- Admin user ID
  v_full_name TEXT;
  v_email TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get user metadata from auth.users
  SELECT 
    raw_user_meta_data->>'full_name',
    email,
    (raw_user_meta_data->>'is_admin')::BOOLEAN
  INTO 
    v_full_name,
    v_email,
    v_is_admin
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Ensure we have a full name
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := 'Admin User';  -- Default if not found
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET 
    preferences = jsonb_build_object(
      'theme', COALESCE((preferences->>'theme'), 'system'),
      'language', COALESCE((preferences->>'language'), 'en'),
      'full_name', v_full_name,
      'is_admin', v_is_admin
    ),
    avatar_url = 'https://ui-avatars.com/api/?name=' || replace(v_full_name, ' ', '+') || '&background=random',
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Output a success message
  RAISE NOTICE 'Profile has been updated for user: %', v_full_name;
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Is Admin: %', v_is_admin;
END $$;

-- PART 6: Output a success message
DO $$
BEGIN
  RAISE NOTICE '=== All Tables Fixed Successfully ===';
  RAISE NOTICE 'The following changes have been made:';
  RAISE NOTICE '1. Admin password has been set to: admin123';
  RAISE NOTICE '2. Password hashes now match in auth.users and public.users';
  RAISE NOTICE '3. The sync_auth_user_to_public trigger has been fixed';
  RAISE NOTICE '4. The create_profile_for_user trigger has been fixed';
  RAISE NOTICE '5. The admin profile has been updated with correct information';
  RAISE NOTICE '';
  RAISE NOTICE 'You should now be able to log in with:';
  RAISE NOTICE 'Email: admin@example.com';
  RAISE NOTICE 'Password: admin123';
END $$; 