const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { email: 'oidemianf@gmail.com' },
        data: {
            role: 'MASTER',
            division: 'MASTER',
            permissions: '["ALL"]'
        }
    });
    console.log('Successfully updated user:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
