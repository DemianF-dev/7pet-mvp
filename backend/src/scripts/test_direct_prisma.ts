import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Prisma Direct Connect (NO ADAPTER) ---');
    try {
        console.log('Querying User count...');
        const count = await prisma.user.count();
        console.log('User count:', count);
    } catch (error) {
        console.error('DIRECT CONNECT FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
