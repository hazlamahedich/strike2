-- Fix the sync_auth_user_to_public trigger to not set a default password
-- This will ensure that the password in public.users is not out of sync with auth.users

-- First, let's drop the existing trigger
DROP TRIGGER IF EXISTS sync_auth_user_to_public_trigger ON auth.users;

-- Now, let's create a new version of the sync_auth_user_to_public function
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Extract name from email or user metadata
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
    v_name := NEW.raw_user_meta_data->>'full_name';
  ELSE
    v_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Insert or update the user
  -- Note: We're no longer setting a default password hash
  INSERT INTO public.users (
    id,
    email,
    name,
    is_active,
    role,
    team_id,
    auth_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    TRUE,
    CASE 
      WHEN NEW.email LIKE '%admin%' THEN 'admin'
      ELSE 'user'
    END,
    1, -- Default team_id
    NEW.id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    name = v_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in sync_auth_user_to_public: %', SQLERRM;
    RETURN NEW; -- Continue even if there's an error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger again
CREATE TRIGGER sync_auth_user_to_public_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_public();

-- Add a comment to explain what this trigger does
COMMENT ON FUNCTION public.sync_auth_user_to_public() IS 
'Syncs user data from auth.users to public.users without setting a password hash.
This ensures that authentication is handled solely through auth.users.';

-- Output a success message
DO $$
BEGIN
  RAISE NOTICE 'Sync trigger has been updated successfully!';
END $$; 