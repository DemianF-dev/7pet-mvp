
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const quotes = await prisma.quote.findMany({
            select: { id: true, status: true, deletedAt: true, customerId: true }
        });
        console.log('--- Quotes DeletedAt Check ---');
        console.log(JSON.stringify(quotes, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
