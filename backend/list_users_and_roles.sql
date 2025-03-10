-- List all users and their roles
-- This script displays all users in the system along with their assigned roles

-- Users with roles
SELECT 
    u.id AS user_id,
    u.email,
    COALESCE(r.name, 'No Role') AS role_name,
    u.created_at AS user_created_at
FROM 
    auth.users u
LEFT JOIN 
    user_roles ur ON u.id = ur.user_id
LEFT JOIN 
    roles r ON ur.role_id = r.id
ORDER BY 
    u.email, r.name;

-- Count of users by role
SELECT 
    COALESCE(r.name, 'No Role') AS role_name,
    COUNT(u.id) AS user_count
FROM 
    auth.users u
LEFT JOIN 
    user_roles ur ON u.id = ur.user_id
LEFT JOIN 
    roles r ON ur.role_id = r.id
GROUP BY 
    COALESCE(r.name, 'No Role')
ORDER BY 
    user_count DESC; 