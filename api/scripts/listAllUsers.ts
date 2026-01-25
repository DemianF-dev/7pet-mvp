
import prisma from '../lib/prisma';

async function listAllUsers() {
    console.log('🔍 Listing all users...');
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            deletedAt: true,
            staffId: true,
            googleId: true
        }
    });
    console.table(users);
}

listAllUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
