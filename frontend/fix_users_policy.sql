-- Fix the infinite recursion in users RLS policy
DROP POLICY IF EXISTS "users_policy" ON "public"."users";

CREATE POLICY "users_policy" ON "public"."users"
USING (
  -- Admin users can see all users
  (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_app_meta_data->>'role' = 'admin')) OR
  -- Managers can see users in their team
  (EXISTS (SELECT 1 FROM auth.users WHERE auth.uid() = id AND raw_app_meta_data->>'role' = 'manager') AND 
   EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.team_id = users.team_id)) OR
  -- Users can see themselves
  (auth.uid() = id)
);
