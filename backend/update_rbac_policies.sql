-- Update RBAC Policies
-- This script updates the Row Level Security (RLS) policies for the RBAC tables
-- to ensure users can access their own roles and permissions.

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

-- Create policy for roles table
-- Allow all authenticated users to view all roles
CREATE POLICY roles_policy ON roles
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (false); -- Only allow read access, not write

-- Create policy for permissions table
-- Allow all authenticated users to view all permissions
CREATE POLICY permissions_policy ON permissions
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (false); -- Only allow read access, not write

-- Create policy for user_roles table
-- Allow users to view their own roles
CREATE POLICY user_roles_policy ON user_roles
    USING (
        auth.uid() IS NOT NULL AND 
        (
            -- User can see their own roles
            user_id = auth.uid() OR
            -- Admin users can see all roles (requires a subquery to check if user has Admin role)
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
            )
        )
    )
    WITH CHECK (
        -- Only admin users can modify user roles
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
        )
    );

-- Create policy for role_permissions table
-- Allow all authenticated users to view all role permissions
CREATE POLICY role_permissions_policy ON role_permissions
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (
        -- Only admin users can modify role permissions
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'Admin'
        )
    );

-- Grant access to the authenticated role
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO authenticated;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE 'RBAC policies updated successfully';
END $$; 