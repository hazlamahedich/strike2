-- Sync Profiles SQL Script
-- This script updates the profiles table to ensure it's properly synced with the user information

-- Update the profile for the admin user
UPDATE public.profiles
SET 
  preferences = jsonb_build_object(
    'theme', 'system',
    'language', 'en',
    'full_name', 'Admin User'  -- Updated to match the full_name in auth.users
  ),
  avatar_url = 'https://ui-avatars.com/api/?name=Admin+User&background=random',  -- Updated to use the full name
  updated_at = NOW()
WHERE user_id = '1504c604-d686-49ed-b943-37d335a93d36';

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Profile has been updated for the admin user';
  RAISE NOTICE 'The profile now has the correct full name: Admin User';
END $$; 