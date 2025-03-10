-- Update missing names and roles in the NextAuth.js User table
UPDATE "User" 
SET name = 'Test User'
WHERE id = 'bbabad6b-b69d-451c-86b0-29e0e2e2015b';

UPDATE "User"
SET name = 'Admin User',
    role = 'admin'
WHERE id = '1504c604-d686-49ed-b943-37d335a93d36';

-- Verify the updates
SELECT id, name, email, role FROM "User"; 