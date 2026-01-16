
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        const columns: any = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'Customer'");
        console.log('CUSTOMER_COLUMNS:');
        for (const col of columns) {
            console.log('-', col.column_name);
        }
    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
