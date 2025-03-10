-- Migrate existing users from Supabase Auth to NextAuth.js tables

-- This script assumes:
-- 1. You have already created the NextAuth.js tables using the previous script
-- 2. You have existing users in the Supabase auth.users table

-- Insert users from auth.users to the new User table
INSERT INTO "User" ("id", "name", "email", "emailVerified", "password", "image", "role", "createdAt", "updatedAt")
SELECT 
  id, 
  raw_user_meta_data->>'name', 
  email, 
  email_confirmed_at,
  -- We need to set a temporary password since we can't access the original hashed passwords
  -- Users will need to reset their passwords
  '$2b$10$TEMPORARY_PASSWORD_HASH_USERS_WILL_NEED_TO_RESET',
  raw_user_meta_data->>'avatar_url',
  COALESCE(raw_user_meta_data->>'role', 'user'),
  created_at,
  updated_at
FROM auth.users
-- Skip users that already exist in the User table
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE "User".email = auth.users.email
);

-- Create profiles for the migrated users
INSERT INTO "Profile" ("id", "userId", "bio", "phone", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(), -- Generate a new UUID for the profile
  "User".id,
  NULL, -- No bio information in standard Supabase auth
  auth.users.phone,
  NOW(),
  NOW()
FROM "User"
JOIN auth.users ON "User".email = auth.users.email
-- Skip users that already have a profile
WHERE NOT EXISTS (
  SELECT 1 FROM "Profile" WHERE "Profile"."userId" = "User".id
);

-- Note: After running this migration, users will need to reset their passwords
-- since we can't migrate the original password hashes from Supabase Auth. 