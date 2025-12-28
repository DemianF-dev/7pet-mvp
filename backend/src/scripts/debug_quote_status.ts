
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Checking Quote Statuses ---');
        const result = await prisma.$queryRawUnsafe('SELECT id, status FROM Quote');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
