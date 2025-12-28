
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Raw Query on Quote table...');
        const result = await prisma.$queryRawUnsafe('SELECT * FROM Quote LIMIT 1');
        console.log('Result:', result);

        console.log('Testing Raw Query on Customer table...');
        const customers = await prisma.$queryRawUnsafe('SELECT * FROM Customer LIMIT 1');
        console.log('Customers:', customers);

    } catch (error) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
