require('dotenv').config();
const { PrismaClient } = require('./src/generated');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DB DUMP SERVICES ---');
        const services = await prisma.service.findMany({
            take: 20,
            select: { id: true, name: true, deletedAt: true }
        });
        console.log('Total services found:', services.length);
        services.forEach(s => {
            console.log(` - [${s.deletedAt ? 'DELETED' : 'ACTIVE'}] ${s.name} (${s.id})`);
        });

        const products = await prisma.product.findMany({
            take: 20,
            select: { id: true, name: true, deletedAt: true }
        });
        console.log('Total products found:', products.length);
        products.forEach(p => {
            console.log(` - [${p.deletedAt ? 'DELETED' : 'ACTIVE'}] ${p.name} (${p.id})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
