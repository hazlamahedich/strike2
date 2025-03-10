# Admin Login Fix - SQL Solution

This directory contains SQL scripts to fix the admin login issue in the Strike app.

## Problem

The admin user is unable to log in due to a password mismatch between the `auth.users` and `public.users` tables in the Supabase database.

## Solution

We've provided several SQL scripts to address different aspects of the issue:

1. **fix-admin-login.sql**: A comprehensive solution that attempts to:
   - Create a new admin user (if the existing one can't be fixed)
   - Fix the trigger that causes password mismatches

2. **fix-trigger-only.sql**: A focused solution that only fixes the trigger
   - This prevents future password mismatches
   - Doesn't attempt to fix existing users

3. **update-admin-password.sql**: A direct approach to update the admin password
   - Sets the admin password to 'admin123'
   - Simplest solution if you have sufficient database permissions

## How to Use These Scripts

### Option 1: Using the Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to the SQL Editor in the left sidebar
4. Create a new query
5. Copy and paste the contents of one of the SQL scripts
6. Run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
# Run the comprehensive fix
supabase db execute -f fix-admin-login.sql

# OR run just the trigger fix
supabase db execute -f fix-trigger-only.sql

# OR run just the password update
supabase db execute -f update-admin-password.sql
```

## Recommended Approach

1. Start with **fix-trigger-only.sql** to prevent future issues
2. Then try **update-admin-password.sql** to fix the existing admin user
3. If that doesn't work, use **fix-admin-login.sql** for a more comprehensive approach

## After Running the Scripts

After running the scripts, you should be able to log in with:
- Email: admin@example.com
- Password: admin123

If you still can't log in, you may need to:
1. Use the password reset feature on the login page
2. Create a new admin user through the Supabase dashboard
3. Use the JavaScript tools provided in the js-tools directory

## Need More Help?

If you continue to experience issues, you can:
1. Check the Supabase logs for any errors
2. Create a new admin user through the Supabase dashboard
3. Contact Supabase support for assistance with authentication issues 