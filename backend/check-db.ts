import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/lib/prisma';

async function checkDatabase() {
    try {
        // Count all tables
        const users = await prisma.user.count();
        const customers = await prisma.customer.count();
        const pets = await prisma.pet.count();
        const quotes = await prisma.quote.count();
        const appointments = await prisma.appointment.count();
        const services = await prisma.service.count();
        const invoices = await prisma.invoice.count();

        console.log('=== DATABASE STATUS ===');
        console.log('Users:', users);
        console.log('Customers:', customers);
        console.log('Pets:', pets);
        console.log('Quotes:', quotes);
        console.log('Appointments:', appointments);
        console.log('Services:', services);
        console.log('Invoices:', invoices);

        if (users > 0) {
            const allUsers = await prisma.user.findMany({
                select: { email: true, name: true, division: true, role: true }
            });
            console.log('\n=== ALL USERS ===');
            console.log(JSON.stringify(allUsers, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
