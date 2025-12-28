
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const quotes = await prisma.quote.findMany({
            include: {
                customer: {
                    include: { user: true }
                }
            }
        });

        console.log(`Total Quotes in DB: ${quotes.length}`);
        quotes.forEach(q => {
            console.log(`Quote ID: ${q.id} | Status: ${q.status} | Customer: ${q.customer?.name} (User Email: ${q.customer?.user?.email})`);
        });

        const customers = await prisma.customer.findMany({ include: { user: true, quotes: true } });
        console.log(`\nTotal Customers: ${customers.length}`);
        customers.forEach(c => {
            console.log(`Customer: ${c.name} (Email: ${c.user.email}) | Quotes Count: ${c.quotes.length}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
