
import prisma from '../lib/prisma';

async function listUsersJson() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            deletedAt: true,
            active: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

listUsersJson()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
