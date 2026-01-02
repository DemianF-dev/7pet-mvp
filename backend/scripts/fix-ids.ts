const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixIds() {
    console.log('Starting ID fix...');

    // 0. Reset all staffIds to null first to avoid unique constraint errors during sequential updates
    await prisma.user.updateMany({
        data: { staffId: null }
    });

    // 1. Fix Staff
    const staff = await prisma.user.findMany({
        where: { role: { not: 'CLIENTE' } },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${staff.length} staff members.`);

    let staffCounter = 2;
    for (const u of staff) {
        let newId;
        if (u.email.toLowerCase() === 'demian@master' || u.name === 'Demian Master' || u.email.toLowerCase() === '7pet.adm@gmail.com') {
            newId = 0;
            console.log(`Assigned 0000 to ${u.email}`);
        } else if (u.email.toLowerCase() === 'oidemianf@gmail.com') {
            newId = 1;
            console.log(`Assigned 0001 to ${u.email}`);
        } else {
            newId = staffCounter++;
            console.log(`Assigned ${newId} to ${u.email}`);
        }

        await prisma.user.update({
            where: { id: u.id },
            data: { staffId: newId }
        });
    }

    // 2. Fix Clients
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENTE' },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${clients.length} clients.`);

    let clientCounter = 1001;
    for (const u of clients) {
        console.log(`Assigned ${clientCounter} to ${u.email}`);
        await prisma.user.update({
            where: { id: u.id },
            data: { staffId: clientCounter++ }
        });
    }

    console.log('ID fix completed successfully.');
}

fixIds().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(() => prisma.$disconnect());
