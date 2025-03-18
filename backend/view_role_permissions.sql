-- View all permissions assigned to each role
-- This script displays all roles and their associated permissions

-- List all roles with their permissions
SELECT 
    r.id AS role_id,
    r.name AS role_name,
    r.description AS role_description,
    p.id AS permission_id,
    p.name AS permission_name,
    p.description AS permission_description,
    p.resource,
    p.action
FROM 
    roles r
LEFT JOIN 
    role_permissions rp ON r.id = rp.role_id
LEFT JOIN 
    permissions p ON rp.permission_id = p.id
ORDER BY 
    r.name, p.name;

-- Count of permissions by role
SELECT 
    r.name AS role_name,
    COUNT(p.id) AS permission_count
FROM 
    roles r
LEFT JOIN 
    role_permissions rp ON r.id = rp.role_id
LEFT JOIN 
    permissions p ON rp.permission_id = p.id
GROUP BY 
    r.name
ORDER BY 
    permission_count DESC; 