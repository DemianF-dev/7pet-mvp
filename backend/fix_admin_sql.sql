-- Fix admin user status - ensure active=true and proper permissions
UPDATE "User"
SET 
  active = true,
  role = 'MASTER',
  division = 'MASTER',
  permissions = '["ALL"]',
  "updatedAt" = NOW()
WHERE email = 'oidemianf@gmail.com';

-- Verify the fix
SELECT 
  id,
  email,
  name,
  active,
  role,
  division,
  permissions,
  "updatedAt"
FROM "User" 
WHERE email = 'oidemianf@gmail.com';
