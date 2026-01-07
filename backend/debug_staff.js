const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: {
                division: { not: 'CLIENTE' },
                deletedAt: null
            },
            select: {
                id: true,
                name: true,
                role: true,
                division: true,
                isEligible: true
            }
        });

        console.log('--- Staff Users ---');
        users.forEach(u => {
            console.log(`${u.name} (Role: ${u.role}, Division: ${u.division}, Eligible: ${u.isEligible})`);
        });

        const services = await prisma.service.findMany({
            take: 10,
            select: {
                name: true,
                category: true
            }
        });
        console.log('\n--- Sample Services ---');
        services.forEach(s => {
            console.log(`${s.name} (Category: ${s.category})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
