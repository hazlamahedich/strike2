-- Update Admin Password SQL Script
-- This script attempts to update the admin password directly in the auth.users table

-- Update the admin user's password to 'admin123'
-- This uses a pre-generated bcrypt hash
UPDATE auth.users
SET encrypted_password = '$2a$10$Nt0RHXCsnIEjsStZKS.WeOjVMOQhTg0ZD7GNPXDhCH1MsPTbRkQdK'  -- bcrypt hash for 'admin123'
WHERE email = 'admin@example.com';

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Admin password has been updated to: admin123';
  RAISE NOTICE 'You should now be able to log in with:';
  RAISE NOTICE 'Email: admin@example.com';
  RAISE NOTICE 'Password: admin123';
END $$; 