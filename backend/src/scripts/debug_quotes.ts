
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Listing all quotes:');
    const quotes = await prisma.quote.findMany({
        include: { customer: true }
    });
    console.log(JSON.stringify(quotes, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
