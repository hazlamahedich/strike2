-- RBAC Tables

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create user_roles table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create role_permissions table (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;

-- Create triggers for each table
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RBAC Functions

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
    user_id UUID,
    permission_name VARCHAR,
    resource VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1
        AND p.name = $2
        AND p.resource = $3
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(
    user_id UUID
)
RETURNS TABLE (
    permission_name VARCHAR,
    resource VARCHAR,
    action VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Enable RLS on the tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS roles_select_policy ON roles;
DROP POLICY IF EXISTS roles_insert_policy ON roles;
DROP POLICY IF EXISTS roles_update_policy ON roles;
DROP POLICY IF EXISTS roles_delete_policy ON roles;

DROP POLICY IF EXISTS permissions_select_policy ON permissions;
DROP POLICY IF EXISTS permissions_insert_policy ON permissions;
DROP POLICY IF EXISTS permissions_update_policy ON permissions;
DROP POLICY IF EXISTS permissions_delete_policy ON permissions;

DROP POLICY IF EXISTS user_roles_select_policy ON user_roles;
DROP POLICY IF EXISTS user_roles_insert_policy ON user_roles;
DROP POLICY IF EXISTS user_roles_update_policy ON user_roles;
DROP POLICY IF EXISTS user_roles_delete_policy ON user_roles;

DROP POLICY IF EXISTS role_permissions_select_policy ON role_permissions;
DROP POLICY IF EXISTS role_permissions_insert_policy ON role_permissions;
DROP POLICY IF EXISTS role_permissions_update_policy ON role_permissions;
DROP POLICY IF EXISTS role_permissions_delete_policy ON role_permissions;

-- Create policies for roles table
CREATE POLICY roles_select_policy ON roles
    FOR SELECT
    USING (true);  -- Everyone can view roles

CREATE POLICY roles_insert_policy ON roles
    FOR INSERT
    WITH CHECK (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY roles_update_policy ON roles
    FOR UPDATE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY roles_delete_policy ON roles
    FOR DELETE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

-- Create policies for permissions table
CREATE POLICY permissions_select_policy ON permissions
    FOR SELECT
    USING (true);  -- Everyone can view permissions

CREATE POLICY permissions_insert_policy ON permissions
    FOR INSERT
    WITH CHECK (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY permissions_update_policy ON permissions
    FOR UPDATE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY permissions_delete_policy ON permissions
    FOR DELETE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

-- Create policies for user_roles table
CREATE POLICY user_roles_select_policy ON user_roles
    FOR SELECT
    USING (true);  -- Everyone can view user roles

CREATE POLICY user_roles_insert_policy ON user_roles
    FOR INSERT
    WITH CHECK (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY user_roles_update_policy ON user_roles
    FOR UPDATE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY user_roles_delete_policy ON user_roles
    FOR DELETE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

-- Create policies for role_permissions table
CREATE POLICY role_permissions_select_policy ON role_permissions
    FOR SELECT
    USING (true);  -- Everyone can view role permissions

CREATE POLICY role_permissions_insert_policy ON role_permissions
    FOR INSERT
    WITH CHECK (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY role_permissions_update_policy ON role_permissions
    FOR UPDATE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

CREATE POLICY role_permissions_delete_policy ON role_permissions
    FOR DELETE
    USING (has_permission(auth.uid(), 'manage_roles', 'roles'));

-- Seed Initial Roles and Permissions

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system access with all permissions'),
('Manager', 'Can manage campaigns, leads, and view analytics'),
('Agent', 'Can interact with leads and campaigns'),
('Viewer', 'Read-only access to specific data')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
-- Campaign permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('create_campaign', 'campaigns', 'create', 'Can create campaigns'),
('view_campaign', 'campaigns', 'read', 'Can view campaigns'),
('edit_campaign', 'campaigns', 'update', 'Can edit campaigns'),
('delete_campaign', 'campaigns', 'delete', 'Can delete campaigns')
ON CONFLICT (resource, action) DO NOTHING;

-- Lead permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('create_lead', 'leads', 'create', 'Can create leads'),
('view_lead', 'leads', 'read', 'Can view leads'),
('edit_lead', 'leads', 'update', 'Can edit leads'),
('delete_lead', 'leads', 'delete', 'Can delete leads')
ON CONFLICT (resource, action) DO NOTHING;

-- Analytics permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('view_analytics', 'analytics', 'read', 'Can view analytics')
ON CONFLICT (resource, action) DO NOTHING;

-- User management permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('manage_users', 'users', 'manage', 'Can manage users'),
('view_users', 'users', 'read', 'Can view users')
ON CONFLICT (resource, action) DO NOTHING;

-- Role management permissions
INSERT INTO permissions (name, resource, action, description) VALUES
('manage_roles', 'roles', 'manage', 'Can manage roles and permissions'),
('view_roles', 'roles', 'read', 'Can view roles and permissions')
ON CONFLICT (resource, action) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
    admin_role_id INTEGER;
    manager_role_id INTEGER;
    agent_role_id INTEGER;
    viewer_role_id INTEGER;
    perm_id INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager';
    SELECT id INTO agent_role_id FROM roles WHERE name = 'Agent';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'Viewer';
    
    -- Assign all permissions to Admin role
    FOR perm_id IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;
    
    -- Assign Manager permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions
    WHERE name IN (
        'create_campaign', 'view_campaign', 'edit_campaign',
        'create_lead', 'view_lead', 'edit_lead',
        'view_analytics', 'view_users', 'view_roles'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Assign Agent permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT agent_role_id, id FROM permissions
    WHERE name IN (
        'view_campaign', 'create_lead', 'view_lead', 'edit_lead'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    
    -- Assign Viewer permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM permissions
    WHERE name IN (
        'view_campaign', 'view_lead'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END;
$$; 