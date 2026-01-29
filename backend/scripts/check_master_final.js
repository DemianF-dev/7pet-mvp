
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres"
        }
    }
});

async function checkMaster() {
    try {
        const master = await prisma.user.findFirst({
            where: { role: 'MASTER' }
        });
        if (master) {
            console.log('MASTER user exists:', master.email);
        } else {
            console.log('NO MASTER user found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkMaster();
