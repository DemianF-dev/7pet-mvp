-- Check admin user status
SELECT 
  id,
  email,
  name,
  active,
  role,
  division,
  permissions,
  "createdAt",
  "updatedAt"
FROM "User" 
WHERE email = 'oidemianf@gmail.com';
