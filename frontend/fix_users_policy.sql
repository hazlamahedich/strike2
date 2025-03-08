-- Fix the infinite recursion in users RLS policy
DROP POLICY IF EXISTS "users_policy" ON "public"."users";

CREATE POLICY "users_policy" ON "public"."users"
USING (
  (auth.uid() IN (SELECT id FROM users WHERE role = 'admin')) OR
  (auth.uid() IN (SELECT id FROM users WHERE role = 'manager' AND team_id = (SELECT team_id FROM users WHERE id = auth.uid()))) OR
  (auth.uid() = id)
);
