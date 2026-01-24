require('dotenv').config();
const { PrismaClient } = require('./src/generated');
const prisma = new PrismaClient();

async function main() {
    console.log('--- START DEBUG SEARCH ---');
    try {
        const productsCount = await prisma.product.count({ where: { deletedAt: null } });
        const servicesCount = await prisma.service.count({ where: { deletedAt: null } });

        console.log(`Products in DB: ${productsCount}`);
        console.log(`Services in DB: ${servicesCount}`);

        const query = 'Banho';
        const foundServices = await prisma.service.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ],
                deletedAt: null
            }
        });

        console.log(`Matches for "${query}": ${foundServices.length}`);
        foundServices.forEach(s => console.log(` - Service: ${s.name} (ID: ${s.id})`));

        if (foundServices.length === 0) {
            console.log('No services found. Checking all services regardless of deletedAt...');
            const allServices = await prisma.service.findMany({ take: 5 });
            console.log('Sample services:');
            allServices.forEach(s => console.log(` - Name: ${s.name}, deletedAt: ${s.deletedAt}`));
        }
    } catch (e) {
        console.error('Error during search:', e);
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- END DEBUG SEARCH ---');
}

main();
