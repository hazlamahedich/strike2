-- Fix Profile Trigger SQL Script
-- This script updates the create_profile_for_user trigger function to properly sync with auth.users

-- First, let's check if the trigger exists
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'create_profile_trigger'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE 'Updating existing create_profile_trigger...';
  ELSE
    RAISE NOTICE 'Creating new create_profile_trigger...';
  END IF;
END $$;

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

-- Add a comment to explain what this trigger does
COMMENT ON FUNCTION public.create_profile_for_user() IS 
'Creates or updates a profile for a user in the public.users table.
This function tries to get metadata from auth.users to ensure consistency.';

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Profile trigger has been updated successfully!';
  RAISE NOTICE 'This ensures that profiles are properly created and synced with auth.users.';
END $$; 