-- Create a view named UserRole that points to the user_roles table
-- This fixes the issue where some parts of the application are trying to access "UserRole" instead of "user_roles"

-- First, check if the view already exists and drop it if it does
DROP VIEW IF EXISTS public."UserRole";

-- Create the view
CREATE VIEW public."UserRole" AS
SELECT * FROM public.user_roles;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public."UserRole" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."UserRole" TO service_role;

-- Output confirmation
SELECT 'UserRole view created successfully' AS result; 