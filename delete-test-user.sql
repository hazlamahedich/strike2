-- Delete Test User SQL Script
-- This script deletes the user with email hazlamahedich@gmail.com from all tables

-- Store the user ID for reference
DO $$
DECLARE
  v_user_id UUID := 'e38328a5-cf03-4b09-8c37-f1bd27e804d4';  -- User ID for hazlamahedich@gmail.com
BEGIN
  -- Delete from profiles first (due to foreign key constraints)
  DELETE FROM public.profiles
  WHERE user_id = v_user_id;
  
  -- Delete from public.users
  DELETE FROM public.users
  WHERE id = v_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users
  WHERE id = v_user_id;
  
  -- Output a success message
  RAISE NOTICE 'User hazlamahedich@gmail.com has been deleted from all tables.';
  RAISE NOTICE 'You can now use this email for testing new user registration.';
END $$; 