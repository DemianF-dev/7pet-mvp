
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const quotes = await prisma.quote.findMany({
            include: { customer: true }
        });
        console.log(`Found ${quotes.length} total quotes.`);

        for (const q of quotes) {
            console.log(`[QUOTE] ID=${q.id} Status=${q.status} Customer=${q.customer?.name} (${q.customerId}) DeletedAt=${q.deletedAt}`);
        }

        const customers = await prisma.customer.findMany({ include: { user: true } });
        console.log(`Found ${customers.length} customers.`);
        for (const c of customers) {
            console.log(`[CUSTOMER] Name=${c.name} ID=${c.id} UserID=${c.userId} UserEmail=${c.user?.email}`);
        }

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
