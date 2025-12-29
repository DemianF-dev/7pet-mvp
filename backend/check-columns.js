const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking columns in Customer table...');
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Customer';
        `;
        console.log('Columns found:', JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
