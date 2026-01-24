import dotenv from 'dotenv';
dotenv.config();
import prisma from './src/lib/prisma';

async function main() {
    console.log('--- START DEBUG SEARCH ---');
    try {
        const query = 'Banho';
        console.log(`Checking database connectivity...`);
        const count = await prisma.service.count();
        console.log(`Total Services in DB: ${count}`);

        const activeCount = await prisma.service.count({ where: { deletedAt: null } });
        console.log(`Total Active Services: ${activeCount}`);

        console.log(`Searching for "${query}" (Insensitive)...`);
        const services = await prisma.service.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ],
                deletedAt: null
            }
        });
        console.log(`Matches found: ${services.length}`);
        services.forEach(s => console.log(` - Service: ${s.name} (ID: ${s.id})`));

        console.log('Top 10 Active Services:');
        const samples = await prisma.service.findMany({
            where: { deletedAt: null },
            take: 10,
            select: { name: true }
        });
        samples.forEach(s => console.log(` - ${s.name}`));

    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- END DEBUG SEARCH ---');
}

main();
