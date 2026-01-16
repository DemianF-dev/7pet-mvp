import prisma from './src/lib/prisma';

async function checkSchema() {
    try {
        const result = await prisma.$queryRawUnsafe(
            `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'RolePermission'`
        );
        console.log('RolePermission columns:', result);
    } catch (e: any) {
        console.log('Error:', e.message);
    }
    await prisma.$disconnect();
}

checkSchema();
