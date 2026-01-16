
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        const columns: any = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'Customer'");
        const columnNames = columns.map((c: any) => c.column_name).sort();
        console.log('CUSTOMER_COLUMNS:', JSON.stringify(columnNames));
    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
