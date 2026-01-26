
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const userCount = await prisma.user.count();
        const customerCount = await prisma.customer.count();
        const quoteCount = await prisma.quote.count();
        console.log(`Users: ${userCount}, Customers: ${customerCount}, Quotes: ${quoteCount}`);

        // Check one user with customer
        const userWithCustomer = await prisma.user.findFirst({
            where: { role: 'CLIENTE', customer: { isNot: null } },
            include: { customer: true }
        });
        console.log('Sample User with Customer:', JSON.stringify(userWithCustomer, null, 2));

    } catch (error: any) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
