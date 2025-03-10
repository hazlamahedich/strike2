# Admin Login Fix Guide

This guide provides a permanent solution to the admin login issue where you're getting "Invalid login credentials" errors when trying to log in with the admin account.

## Understanding the Issue

The problem occurs because there's a mismatch between the password stored in `auth.users` and the one stored in `public.users`. The authentication system checks against the `auth.users` table, but the trigger that syncs data between these tables is setting a different password in `public.users`.

## Solution Overview

We'll implement a two-part solution:

1. Fix the admin password in the `auth.users` table
2. Update the trigger to prevent future password mismatches

## Step 1: Fix the Admin Password

We've created a script that will help you reset the admin password:

```bash
# Install dependencies if you haven't already
npm install @supabase/supabase-js

# Run the password fix script
node fix-admin-password.js
```

This script will:
- Try to authenticate with common default passwords
- If successful, update the password to your new chosen password
- If unsuccessful, initiate a password reset flow

## Step 2: Fix the Trigger

The root cause of this issue is the `sync_auth_user_to_public` trigger that's setting a hardcoded password hash in the `public.users` table. We need to update this trigger to not set a password at all, since authentication should only use the `auth.users` table.

To fix this, you'll need to run the SQL script we've provided:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `fix-sync-trigger.sql`
4. Run the script

Alternatively, if you have the Supabase CLI installed:

```bash
supabase db execute -f fix-sync-trigger.sql
```

## Verifying the Fix

After completing both steps:

1. Try logging in with your new admin password
2. You should be able to log in successfully
3. Check that new user registrations also work correctly

## What Changed?

1. **Admin Password**: We've reset the admin password in the `auth.users` table.

2. **Trigger Function**: We've updated the `sync_auth_user_to_public` function to:
   - No longer set a default password hash in `public.users`
   - Still sync all other user data between tables
   - Handle errors gracefully

This ensures that:
- Authentication is handled solely through the `auth.users` table
- User data is still properly synced to `public.users` for application use
- Future user registrations won't have this password mismatch issue

## Troubleshooting

If you still encounter issues:

1. **Check Supabase Logs**: Look for any errors related to authentication
2. **Verify Trigger**: Make sure the trigger was successfully updated
3. **Clear Browser Data**: Try clearing your browser cookies and local storage
4. **Check for Duplicate Triggers**: Make sure there aren't multiple triggers with the same name

## Need More Help?

If you continue to experience issues, you can:

1. Use the temporary login helper (`admin-login-helper.js`) as a workaround
2. Contact Supabase support for assistance with authentication issues
3. Consider rebuilding the authentication system with a simpler approach 