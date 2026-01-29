
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres"
        }
    }
});

async function run() {
    try {
        const count = await prisma.user.count();
        console.log(`Total users in DB: ${count}`);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
