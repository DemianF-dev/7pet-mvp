
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- CUSTOMERS ---');
        const customers = await prisma.customer.findMany({ select: { id: true, name: true, userId: true } });
        console.log(JSON.stringify(customers, null, 2));

        console.log('\n--- QUOTES ---');
        const quotes = await prisma.quote.findMany({
            select: { id: true, customerId: true, status: true, totalAmount: true }
        });
        console.log(JSON.stringify(quotes, null, 2));

        console.log('\n--- USERS ---');
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true }
        });
        console.log(JSON.stringify(users, null, 2));

    } catch (error: any) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
