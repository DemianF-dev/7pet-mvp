
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fixing invalid statuses...');
        // Update 'SOLICITACAO' to 'SOLICITADO'
        const result = await prisma.$executeRawUnsafe("UPDATE Quote SET status = 'SOLICITADO' WHERE status = 'SOLICITACAO'");
        console.log(`Updated ${result} records.`);

        // Verify
        const check = await prisma.$queryRawUnsafe("SELECT id, status FROM Quote WHERE status = 'SOLICITACAO'");
        console.log('Remaining invalid records:', check);

    } catch (error) {
        console.error('Error executing raw query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
