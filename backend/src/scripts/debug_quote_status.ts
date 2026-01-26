
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Checking Quote Statuses ---');
        // ✅ SEGURO: Usando Prisma query builder ao invés de raw SQL
        const result = await prisma.quote.findMany({
            select: {
                id: true,
                status: true
            }
        });
        console.log(JSON.stringify(result, null, 2));

    } catch (error: any) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
