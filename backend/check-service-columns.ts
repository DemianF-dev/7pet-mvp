import prisma from './src/lib/prisma';

async function checkServiceSchema() {
    try {
        const result = await prisma.$queryRawUnsafe(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Service' AND column_name IN ('bathCategory', 'groomingType', 'type')`
        );
        console.log('Service columns found:', result);
    } catch (e: any) {
        console.log('Error:', e.message);
    }
    await prisma.$disconnect();
}

checkServiceSchema();
