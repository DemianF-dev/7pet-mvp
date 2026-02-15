import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Listing columns in Appointment table...');
        const columns: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Appointment'
    `;
        console.log('Columns:', columns.map((c: any) => c.column_name).sort());
    } catch (err) {
        console.error('Failed!', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
