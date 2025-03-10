-- Fix RBAC Policies
-- This script updates the Row Level Security (RLS) policies for the RBAC tables
-- to be more permissive, allowing all authenticated users to perform CRUD operations.

-- Enable RLS on all RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS roles_policy ON roles;
DROP POLICY IF EXISTS permissions_policy ON permissions;
DROP POLICY IF EXISTS user_roles_policy ON user_roles;
DROP POLICY IF EXISTS role_permissions_policy ON role_permissions;

-- Create policy for roles table - Allow all authenticated users to perform all operations
CREATE POLICY roles_policy ON roles
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for permissions table - Allow all authenticated users to perform all operations
CREATE POLICY permissions_policy ON permissions
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for user_roles table - Allow all authenticated users to perform all operations
CREATE POLICY user_roles_policy ON user_roles
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for role_permissions table - Allow all authenticated users to perform all operations
CREATE POLICY role_permissions_policy ON role_permissions
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grant access to the authenticated role
GRANT ALL ON roles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON role_permissions TO authenticated;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'RBAC policies updated successfully to be more permissive';
END $$; 