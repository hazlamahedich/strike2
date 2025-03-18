-- Sync Passwords SQL Script
-- This script updates the password hash in public.users to match auth.users

-- Get the current password hash from auth.users
DO $$
DECLARE
  auth_password TEXT;
BEGIN
  -- Get the password hash from auth.users
  SELECT encrypted_password INTO auth_password
  FROM auth.users
  WHERE email = 'admin@example.com';
  
  -- Update the password hash in public.users
  UPDATE public.users
  SET hashed_password = auth_password
  WHERE email = 'admin@example.com';
  
  -- Output a success message
  RAISE NOTICE 'Password hash in public.users has been updated to match auth.users';
  RAISE NOTICE 'Both tables now have the same password hash for admin@example.com';
END $$; 