import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`Found ${users.length} users.`);

        const masters = users.filter(u => u.role === 'MASTER');
        console.log(`Found ${masters.length} MASTER users.`);

        // Check for any user with strange data
        users.forEach(u => {
            if (!u.email) console.log('User missing email:', u.id);
        });

        console.log('Test completed successfully.');
    } catch (e) {
        console.error('Error querying users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
