-- Update Public Users Password SQL Script
-- This script directly updates the password hash in public.users

-- Update the password hash in public.users to match auth.users
UPDATE public.users
SET hashed_password = '$2a$10$Nt0RHXCsnIEjsStZKS.WeOjVMOQhTg0ZD7GNPXDhCH1MsPTbRkQdK'  -- bcrypt hash for 'admin123'
WHERE email = 'admin@example.com';

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Password hash in public.users has been updated to match auth.users';
  RAISE NOTICE 'Both tables now have the same password hash for admin@example.com';
  RAISE NOTICE 'Password is now set to: admin123';
END $$; 