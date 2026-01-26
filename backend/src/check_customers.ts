
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const total = await prisma.customer.count();
        const active = await prisma.customer.count({ where: { deletedAt: null } });

        console.log('--- DB CHECK ---');
        console.log('Total:', total);
        console.log('Active:', active);

        const sample = await prisma.customer.findFirst({
            where: { deletedAt: null },
            include: { user: true }
        });
        console.log('Sample:', sample ? sample.name : 'None');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
