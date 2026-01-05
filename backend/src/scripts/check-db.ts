
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
        console.log('--- DB CONNECTION TEST ---');
        console.log('Connecting to database...');

        // Test simple query
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                division: true,
                deletedAt: true,
                role: true,
                plainPassword: true
            }

        });
        console.log(`✅ Total users found: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.email} | Division: ${u.division} | Role: ${u.role} | Deleted: ${u.deletedAt}`);
        });


    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
