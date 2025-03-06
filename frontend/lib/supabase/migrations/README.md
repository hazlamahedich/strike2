# Supabase Database Fixes

This directory contains SQL migrations to fix common issues with Supabase Auth and database setup.

## Common Issues

1. **Missing auth schema**: The auth schema might not be properly set up.
2. **Missing profiles table**: The profiles table might not exist or have the wrong structure.
3. **Missing triggers**: Triggers to handle user creation, updates, and deletions might be missing.
4. **Incorrect permissions**: The necessary permissions might not be granted to the appropriate roles.
5. **Type mismatches**: The profiles table might have incorrect column types.
6. **Trigger function in wrong schema**: The trigger functions should be in the auth schema, not public.

## How to Fix

### Option 1: Run the SQL Migration

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Paste and run the contents of `fix_auth_tables.sql`

This script will:
- Create the auth schema if it doesn't exist
- Create the profiles table with the correct structure (id as SERIAL, user_id as UUID)
- Set up Row Level Security (RLS) policies
- Create trigger functions in the auth schema (important!)
- Set up triggers for user creation, updates, and deletions
- Grant the necessary permissions
- Create a test table for anonymous permissions testing

### Option 2: Manual Setup

If you prefer to set up the database manually, follow these steps:

1. Create the profiles table:
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_url VARCHAR,
    preferences JSONB DEFAULT '{"theme": "light", "language": "en"}',
    notification_settings JSONB DEFAULT '{"push": true, "email": true"}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

2. Add Row Level Security (RLS) policies:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);
```

3. Create a trigger for new users (in the auth schema):
```sql
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, avatar_url)
    VALUES (new.id, 'https://randomuser.me/api/portraits/lego/1.jpg');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user();
```

4. Create a test table for anonymous access:
```sql
CREATE TABLE IF NOT EXISTS public.test (
    id SERIAL PRIMARY KEY,
    content TEXT
);

ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON public.test FOR SELECT USING (true);
INSERT INTO public.test (content) VALUES ('This is a test record');
```

## Verifying the Fix

1. Visit the `/auth/test` page in your application to see if all tests pass
2. Check that the database connection test passes
3. Check that the auth schema test passes
4. Check that the profiles table structure test passes
5. Check that the anonymous permissions test passes
6. Try registering a new user to see if the profile is created correctly

## Troubleshooting

If you're still experiencing issues after applying the fixes:

1. **Check Supabase Project Settings**:
   - Verify that your project URL and API keys are correct
   - Check if email confirmation is required and matches your application flow
   - Ensure there are no rate limiting issues

2. **Check Database Permissions**:
   - Ensure that the `anon`, `authenticated`, and `service_role` roles have the necessary permissions
   - Check if there are any custom roles that might be interfering

3. **Check Network Issues**:
   - Verify that your application can connect to Supabase
   - Check for CORS issues if you're using a web application

4. **Check Rate Limiting**:
   - Supabase has rate limits that might be affecting your application
   - Check the Supabase dashboard for any rate limiting warnings

5. **Trigger Function Location**:
   - Make sure the trigger functions are in the auth schema, not the public schema
   - The "Database error saving new user" error often occurs when the trigger functions are in the wrong schema

## Need More Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues) 