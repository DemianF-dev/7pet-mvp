
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fixing invalid statuses...');
        // ✅ SEGURO: Usando Prisma updateMany ao invés de raw SQL
        const result = await prisma.quote.updateMany({
            where: { status: 'SOLICITACAO' as any },
            data: { status: 'SOLICITADO' }
        });
        console.log(`Updated ${result.count} records.`);

        // ✅ SEGURO: Verificação usando Prisma query builder
        const check = await prisma.quote.findMany({
            where: { status: 'SOLICITACAO' as any },
            select: {
                id: true,
                status: true
            }
        });
        console.log('Remaining invalid records:', check);

    } catch (error) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
