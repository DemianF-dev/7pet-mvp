
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Query on Quote table...');
        // ✅ SEGURO: Usando Prisma findFirst ao invés de raw SQL
        const result = await prisma.quote.findFirst();
        console.log('Result:', result);

        console.log('Testing Query on Customer table...');
        // ✅ SEGURO: Usando Prisma findFirst ao invés de raw SQL
        const customers = await prisma.customer.findFirst();
        console.log('Customers:', customers);

    } catch (error: any) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
