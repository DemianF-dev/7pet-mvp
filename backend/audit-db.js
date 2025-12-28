const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE AUDIT ---');
    try {
        const userCount = await prisma.user.count();
        const customerCount = await prisma.customer.count();
        const petCount = await prisma.pet.count();
        const serviceCount = await prisma.service.count();
        const appointmentCount = await prisma.appointment.count();

        console.log(`Users: ${userCount}`);
        console.log(`Customers: ${customerCount}`);
        console.log(`Pets: ${petCount}`);
        console.log(`Services: ${serviceCount}`);
        console.log(`Appointments: ${appointmentCount}`);

        if (serviceCount === 0) {
            console.log('WARNING: No services found! Users cannot book appointments.');
        }

        const latestUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        console.log('Latest Users:', JSON.stringify(latestUsers, null, 2));

    } catch (error) {
        console.error('DATABASE ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
