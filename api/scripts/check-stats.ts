
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres.zpcwgsjsktqjncnpgaon:s%23Dfs%407185%2A@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
        },
    },
});

async function main() {
    try {
        const total = await prisma.user.count();
        const staff = await prisma.user.count({ where: { role: { not: 'CLIENTE' } } });
        const clients = await prisma.user.count({ where: { role: 'CLIENTE' } });
        const deleted = await prisma.user.count({ where: { deletedAt: { not: null } } });

        console.log('--- STATS ---');
        console.log('Total:', total);
        console.log('Staff:', staff);
        console.log('Clients:', clients);
        console.log('Deleted:', deleted);

        const users = await prisma.user.findMany({
            take: 20,
            select: { email: true, role: true, division: true }
        });
        console.log('--- USERS (20) ---');
        users.forEach(u => console.log(`- ${u.email} [${u.role}] (${u.division})`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
