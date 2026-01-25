#!/bin/bash

echo "🔧 FIXING LOGISTICS ACCESS CONTROL ISSUES"
echo "=========================================="

# Navigate to backend
cd backend

echo "📝 Step 1: Creating logistics and commercial users..."
npm run ts-node create-logistics-users.ts

echo ""
echo "🔍 Step 2: Checking user creation results..."
npm run ts-node -e "
const { PrismaClient } = require('./src/lib/prisma');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { division: 'LOGISTICA' },
        { division: 'COMERCIAL' },
        { role: { in: ['OPERACIONAL', 'COMERCIAL'] } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      active: true,
      permissions: true
    }
  });
  
  console.log('📋 Current Logistics/Commercial Users:');
  users.forEach(user => {
    console.log(\`  👤 \${user.name} (\${user.email})\`);
    console.log(\`     Role: \${user.role} | Division: \${user.division} | Active: \${user.active}\`);
    console.log(\`     Permissions: \${user.permissions ? JSON.parse(user.permissions).join(', ') : 'None'}\n\`);
  });
  
  await prisma.\$disconnect();
}

checkUsers().catch(console.error);
"

echo ""
echo "🎯 SUMMARY OF FIXES APPLIED:"
echo "============================"
echo "✅ 1. Frontend: Added LOGISTICA to allowedRoles in App.tsx"
echo "✅ 2. Frontend: Added LOGISTICA permissions to permissions.ts"
echo "✅ 3. Frontend: Fixed permission checking to use division when available"
echo "✅ 4. Backend: Added LOGISTICA to staffRoutes authorization"
echo "✅ 5. Backend: Updated appointment routes for proper authorization"
echo "✅ 6. Created logistics users with proper roles and permissions"
echo ""
echo "🔐 TEST USERS CREATED:"
echo "======================"
echo "📧 Logistics User: logistica@7pet.com"
echo "🔑 Password: logistica123"
echo "🏢 Division: LOGISTICA"
echo ""
echo "📧 Commercial User: comercial@7pet.com"
echo "🔑 Password: comercial123"  
echo "🏢 Division: COMERCIAL"
echo ""
echo "🚀 NEXT STEPS:"
echo "============="
echo "1. Test login with: logistica@7pet.com / logistica123"
echo "2. Verify access to: /staff/agenda-log"
echo "3. Test navigation sidebar shows 'Agenda LOG'"
echo "4. Verify commercial user can access quotes/customers"
echo ""
echo "🎉 Logistics users should now have full access as collaborators!"