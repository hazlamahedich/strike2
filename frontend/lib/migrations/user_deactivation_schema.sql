-- Add deactivation-related columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scheduled_archive_date TIMESTAMP WITH TIME ZONE;

-- Create user_role_history table to track removed role assignments
CREATE TABLE IF NOT EXISTS public.user_role_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role_id INTEGER NOT NULL REFERENCES public.roles(id),
  removed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  removed_by UUID REFERENCES auth.users(id),
  removal_reason TEXT,
  restored_at TIMESTAMP WITH TIME ZONE,
  restored_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_role_history
ALTER TABLE public.user_role_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_role_history"
ON public.user_role_history
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    JOIN public.user_roles ON auth.users.id = public.user_roles.user_id
    JOIN public.roles ON public.user_roles.role_id = public.roles.id
    WHERE auth.uid() = auth.users.id AND public.roles.name = 'Admin'
  )
);

-- Create function to archive users after 60 days of deactivation
CREATE OR REPLACE FUNCTION public.archive_deactivated_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive users by moving them to archived_users table
  INSERT INTO public.archived_users (
    id, email, name, is_active, role, team_id, 
    created_at, updated_at, deactivated_at, deactivated_by,
    archived_at
  )
  SELECT 
    id, email, name, is_active, role, team_id, 
    created_at, updated_at, deactivated_at, deactivated_by,
    NOW() as archived_at
  FROM public.users
  WHERE 
    scheduled_archive_date IS NOT NULL AND
    scheduled_archive_date <= NOW();
    
  -- Delete the archived users from the main users table
  DELETE FROM public.users
  WHERE 
    scheduled_archive_date IS NOT NULL AND
    scheduled_archive_date <= NOW();
END;
$$;

-- Create archived_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.archived_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT FALSE,
  role VARCHAR(50),
  team_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivated_by UUID,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for archived_users
ALTER TABLE public.archived_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view archived_users"
ON public.archived_users
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    JOIN public.user_roles ON auth.users.id = public.user_roles.user_id
    JOIN public.roles ON public.user_roles.role_id = public.roles.id
    WHERE auth.uid() = auth.users.id AND public.roles.name = 'Admin'
  )
);

-- Create a cron job to run the archive function daily
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you'll need to set up an external scheduler
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    SELECT cron.schedule('0 0 * * *', 'SELECT public.archive_deactivated_users()');
  END IF;
END $$; 