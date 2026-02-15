import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const cols: any = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Appointment'
    `;
        console.log('--- APPOINTMENT COLUMNS IN DB ---');
        cols.forEach((c: any) => console.log(`- ${c.column_name} (${c.data_type})`));
    } catch (err: any) {
        console.error('Failed!', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
