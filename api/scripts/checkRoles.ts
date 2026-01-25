
import prisma from '../lib/prisma';

async function checkRoles() {
    console.log('🔍 Checking RolePermission entries...');
    const roles = await prisma.rolePermission.findMany();
    console.log(roles);
}

checkRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
