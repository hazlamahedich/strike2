-- RBAC System Maintenance
-- This script provides utilities for maintaining the RBAC system

-- 1. Clean up orphaned role_permissions (where the role or permission no longer exists)
DELETE FROM role_permissions
WHERE role_id NOT IN (SELECT id FROM roles)
   OR permission_id NOT IN (SELECT id FROM permissions);

-- 2. Clean up orphaned user_roles (where the user or role no longer exists)
DELETE FROM user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users)
   OR role_id NOT IN (SELECT id FROM roles);

-- 3. Find users without any role
SELECT 
    u.id, 
    u.email,
    u.created_at
FROM 
    auth.users u
LEFT JOIN 
    user_roles ur ON u.id = ur.user_id
WHERE 
    ur.user_id IS NULL
ORDER BY 
    u.created_at DESC;

-- 4. Find unused permissions (not assigned to any role)
SELECT 
    p.id,
    p.name,
    p.description
FROM 
    permissions p
LEFT JOIN 
    role_permissions rp ON p.id = rp.permission_id
WHERE 
    rp.permission_id IS NULL
ORDER BY 
    p.name;

-- 5. Find unused roles (not assigned to any user)
SELECT 
    r.id,
    r.name,
    r.description
FROM 
    roles r
LEFT JOIN 
    user_roles ur ON r.id = ur.role_id
WHERE 
    ur.role_id IS NULL
ORDER BY 
    r.name;

-- 6. Assign default role to users without roles
DO $$
DECLARE
    default_role_id INTEGER;
    v_user_record RECORD;
BEGIN
    -- Get the Viewer role ID (assuming Viewer is the default role)
    SELECT id INTO default_role_id FROM roles WHERE name = 'Viewer';
    
    IF default_role_id IS NULL THEN
        RAISE EXCEPTION 'Default role (Viewer) not found';
    END IF;
    
    -- Find users without roles and assign the default role
    FOR v_user_record IN 
        SELECT 
            u.id, 
            u.email
        FROM 
            auth.users u
        LEFT JOIN 
            user_roles ur ON u.id = ur.user_id
        WHERE 
            ur.user_id IS NULL
    LOOP
        -- Assign default role to the user
        INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
        VALUES (v_user_record.id, default_role_id, NOW(), NOW());
        
        RAISE NOTICE 'Default role assigned to user %', v_user_record.email;
    END LOOP;
END;
$$; 