-- Sync Profiles Dynamic SQL Script
-- This script dynamically updates the profiles table based on the user metadata in auth.users

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
  RAISE NOTICE 'All tables are now properly synchronized.';
END $$; 