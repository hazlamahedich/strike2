-- Fix Auth Tables Migration
-- This script fixes common issues with Supabase Auth tables
-- Run this in the Supabase SQL Editor

-- 1. Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Create profiles table if it doesn't exist
-- Note: In this database, profiles.id is an integer with a separate user_id column that references auth.users.id
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_url VARCHAR,
    preferences JSONB DEFAULT '{"theme": "light", "language": "en"}',
    notification_settings JSONB DEFAULT '{"push": true, "email": true}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon can insert profiles" ON public.profiles;

-- 5. Create policies without IF NOT EXISTS (not supported in PostgreSQL for policies)
CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Add a policy for the service role to manage all profiles
CREATE POLICY "Service role can manage all profiles" 
    ON public.profiles 
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Add a temporary policy for anonymous users to insert profiles (for testing only)
-- In production, you would remove this policy
CREATE POLICY "Anon can insert profiles" 
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (true);

-- 6. Create function to handle new users in the auth schema
DROP FUNCTION IF EXISTS auth.handle_new_user CASCADE;
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    profile_id INTEGER;
BEGIN
    INSERT INTO public.profiles (user_id, avatar_url)
    VALUES (new.id, 'https://randomuser.me/api/portraits/lego/1.jpg')
    RETURNING id INTO profile_id;
    
    RAISE NOTICE 'Created profile with ID % for user %', profile_id, new.id;
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user();

-- 8. Create function to handle user updates in the auth schema
DROP FUNCTION IF EXISTS auth.handle_user_update CASCADE;
CREATE OR REPLACE FUNCTION auth.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET updated_at = now()
    WHERE user_id = new.id;
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in handle_user_update trigger: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.handle_user_update();

-- 10. Create function to handle user deletions in the auth schema
DROP FUNCTION IF EXISTS auth.handle_user_delete CASCADE;
CREATE OR REPLACE FUNCTION auth.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.profiles
    WHERE user_id = old.id;
    RETURN old;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in handle_user_delete trigger: %', SQLERRM;
        RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for user deletions
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION auth.handle_user_delete();

-- 12. Grant permissions
-- First, revoke all permissions to ensure a clean slate
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Revoke all permissions on auth schema
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA auth FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth FROM PUBLIC;

-- Then grant only the necessary permissions
-- Grant usage on public schema to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SEQUENCE public.profiles_id_seq TO authenticated;

-- Grant limited permissions to anonymous users
GRANT SELECT ON public.test TO anon;
GRANT INSERT ON public.profiles TO anon;
GRANT USAGE ON SEQUENCE public.profiles_id_seq TO anon;

-- Grant permissions to the auth schema - only to service_role
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Grant access to auth.uid() and auth.role() functions to all roles
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

-- Revoke direct access to auth.users from public
REVOKE ALL ON auth.users FROM PUBLIC;
REVOKE ALL ON auth.users FROM anon, authenticated;

-- 13. Create a test table for anonymous permissions test
CREATE TABLE IF NOT EXISTS public.test (
    id SERIAL PRIMARY KEY,
    content TEXT
);

-- 14. Allow anonymous users to read from the test table
ALTER TABLE public.test ENABLE ROW LEVEL SECURITY;

-- 15. Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.test;

-- 16. Create policy for anonymous access
CREATE POLICY "Allow anonymous read access" ON public.test FOR SELECT USING (true);

-- 17. Insert a test record
INSERT INTO public.test (content) VALUES ('This is a test record') ON CONFLICT DO NOTHING;

-- 18. Create a sample profile for testing
DO $$
DECLARE
    test_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Try to get an existing user ID from auth.users
    BEGIN
        SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        existing_user_id := NULL;
    END;
    
    -- Use existing user ID if available, otherwise use a dummy ID
    test_user_id := COALESCE(existing_user_id, '00000000-0000-0000-0000-000000000000');
    
    -- Check if the test profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = test_user_id) AND existing_user_id IS NOT NULL THEN
        -- Insert a test profile
        INSERT INTO public.profiles (user_id, avatar_url)
        VALUES (test_user_id, 'https://randomuser.me/api/portraits/lego/1.jpg');
        
        RAISE NOTICE 'Created test profile for user ID: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test profile already exists or no valid user ID found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating test profile: %', SQLERRM;
END;
$$;

-- 19. Create helper functions for testing
-- Function to get table columns
DROP FUNCTION IF EXISTS public.get_table_columns(text);
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT)
RETURNS TABLE (
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.column_name::TEXT, c.data_type::TEXT, c.is_nullable::TEXT
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = get_table_columns.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get policies
DROP FUNCTION IF EXISTS public.get_policies(text);
CREATE OR REPLACE FUNCTION public.get_policies(table_name TEXT)
RETURNS TABLE (
    policyname TEXT,
    tablename TEXT,
    permissive TEXT,
    roles TEXT,
    cmd TEXT,
    qual TEXT,
    with_check TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.policyname::TEXT, p.tablename::TEXT, p.permissive::TEXT, 
           p.roles::TEXT, p.cmd::TEXT, p.qual::TEXT, p.with_check::TEXT
    FROM pg_policies p
    WHERE p.tablename = table_name
    AND p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get triggers
DROP FUNCTION IF EXISTS public.get_triggers(text);
CREATE OR REPLACE FUNCTION public.get_triggers(schema_name TEXT)
RETURNS TABLE (
    trigger_name TEXT,
    event_manipulation TEXT,
    event_object_table TEXT,
    action_statement TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.trigger_name::TEXT, t.event_manipulation::TEXT, 
           t.event_object_table::TEXT, t.action_statement::TEXT
    FROM information_schema.triggers t
    WHERE t.trigger_schema = schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL queries
-- First drop the function if it exists with any signature
DROP FUNCTION IF EXISTS public.exec_sql(text);
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS SETOF RECORD AS $$
BEGIN
    RETURN QUERY EXECUTE sql_query;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error executing SQL: %', SQLERRM;
        RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Fix permissions for the helper functions
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_policies(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_triggers(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- 21. Create a test user for authentication testing
DO $$
BEGIN
    -- Only create test user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@example.com') THEN
        -- This is a direct insert into auth.users which should only be done by the service_role
        -- In a real application, users would be created through the auth API
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'test@example.com',
            crypt('password123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Test User", "role": "user"}'
        );
        
        RAISE NOTICE 'Created test user: test@example.com';
    ELSE
        RAISE NOTICE 'Test user already exists: test@example.com';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating test user: %', SQLERRM;
END;
$$;

-- 22. Fix auth.users permissions
-- Ensure the auth.users table is not accessible to anon or authenticated roles
REVOKE ALL ON auth.users FROM anon, authenticated;

-- 23. Create a view for testing auth schema access
CREATE OR REPLACE VIEW public.auth_schema_test AS
SELECT 'auth schema exists' AS status;

-- Grant access to the view
GRANT SELECT ON public.auth_schema_test TO anon, authenticated, service_role;

-- 24. Create a function to check if a user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_authenticated() TO anon, authenticated, service_role; 