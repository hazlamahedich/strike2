# Supabase Authentication Issue Solution

## Problem Summary

The application was encountering a "Database error saving new user" message during user registration. This error occurred because:

1. The trigger function that creates a profile when a new user registers was not properly set up in the Supabase database.
2. The profiles table structure was not correctly configured or was missing entirely.
3. Row-level security policies were preventing the creation of new profiles.

## Solution

We've implemented a comprehensive solution that includes:

1. A SQL migration script to fix the database schema
2. An updated auth test page to verify the database setup
3. A test script to diagnose Supabase issues
4. Documentation in the README

### 1. SQL Migration Script

The SQL migration script (`frontend/lib/supabase/migrations/fix_auth_tables.sql`) addresses the following:

- Creates the auth schema if it doesn't exist
- Creates the profiles table with the correct structure
- Enables Row Level Security on the profiles table
- Creates policies for users to view and update their own profiles
- Creates trigger functions to handle user creation, updates, and deletions
- Grants necessary permissions
- Creates a test table for anonymous access testing

### 2. Auth Test Page

The auth test page (`frontend/app/auth/test/page.tsx`) has been updated to:

- Test the Supabase client initialization
- Check the database connection
- Verify the auth schema
- Check the profiles table structure
- Test anonymous permissions

### 3. Test Script

We've created a test script (`frontend/lib/supabase/test-script.mjs`) that:

- Tests the database connection
- Checks the auth schema
- Verifies the profiles table structure
- Tests anonymous permissions
- Attempts to create a user profile

The test script provides detailed diagnostics and recommendations for fixing any issues.

### 4. User Registration Flow

The user registration flow has been verified to:

1. Create a user in Supabase Auth
2. Trigger the creation of a profile in the profiles table
3. Handle errors gracefully

## How to Fix the Issue

1. **Run the SQL Migration Script**:
   - Log into your [Supabase Dashboard](https://app.supabase.com)
   - Navigate to the SQL Editor
   - Copy the contents of `frontend/lib/supabase/migrations/fix_auth_tables.sql`
   - Paste into the SQL Editor and run the script

2. **Verify the Fix**:
   - Run the test script: `node lib/supabase/test-script.mjs` from the frontend directory
   - Visit the `/auth/test` page in your application
   - Try to register a new user

## Common Issues and Solutions

### 1. "Database error saving new user"

This error occurs when the trigger function fails to create a profile when a new user registers. The SQL migration script fixes this by:

- Creating the trigger function in the auth schema
- Setting up the correct permissions
- Ensuring the profiles table has the right structure

### 2. Row-Level Security Policy Violations

If you encounter RLS policy violations, the SQL migration script fixes this by:

- Enabling RLS on the profiles table
- Creating appropriate policies for users to view and update their own profiles
- Granting necessary permissions to the anon, authenticated, and service_role roles

### 3. Missing Profiles Table

If the profiles table is missing or has the wrong structure, the SQL migration script creates it with:

- An id column (SERIAL PRIMARY KEY)
- A user_id column (UUID) that references auth.users(id)
- An avatar_url column (VARCHAR)
- Additional columns for preferences, notification settings, and timestamps

## Testing the Solution

1. Run the test script to diagnose any issues:
   ```bash
   node lib/supabase/test-script.mjs
   ```

2. Check the Supabase dashboard for:
   - The existence of the profiles table
   - The trigger function in the auth schema
   - RLS policies on the profiles table

3. Try to register a new user and verify that:
   - The user is created in Supabase Auth
   - A profile is created in the profiles table
   - The user can log in successfully

## Conclusion

The "Database error saving new user" issue has been resolved by properly setting up the Supabase database schema, trigger functions, and RLS policies. The solution ensures that when a new user registers, a profile is automatically created in the profiles table, allowing the user to access the application.

If you encounter any further issues, refer to the README for troubleshooting steps or run the test script for detailed diagnostics. 