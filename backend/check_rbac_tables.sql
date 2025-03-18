-- Script to check if RBAC tables exist and are properly configured

-- Check if roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
) AS roles_table_exists;

-- Check if permissions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'permissions'
) AS permissions_table_exists;

-- Check if user_roles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
) AS user_roles_table_exists;

-- Check if role_permissions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'role_permissions'
) AS role_permissions_table_exists;

-- Check if there are any roles in the roles table
SELECT COUNT(*) AS roles_count FROM roles;

-- Check if there are any permissions in the permissions table
SELECT COUNT(*) AS permissions_count FROM permissions;

-- Check if there are any user_roles in the user_roles table
SELECT COUNT(*) AS user_roles_count FROM user_roles;

-- Check if there are any role_permissions in the role_permissions table
SELECT COUNT(*) AS role_permissions_count FROM role_permissions;

-- Check the structure of the roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'roles';

-- Check the structure of the permissions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'permissions';

-- Check the structure of the user_roles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_roles';

-- Check the structure of the role_permissions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'role_permissions';

-- Check RLS policies for roles table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'roles';

-- Check RLS policies for permissions table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'permissions';

-- Check RLS policies for user_roles table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- Check RLS policies for role_permissions table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'role_permissions'; 