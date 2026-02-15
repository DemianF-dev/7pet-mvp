import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing minimal findMany...');
        const appts = await prisma.appointment.findMany({
            select: { id: true },
            take: 1
        });
        console.log('Minimal Success!', appts);

        console.log('Testing findMany with include pet...');
        const apptsWithPet = await prisma.appointment.findMany({
            include: { pet: true },
            take: 1
        });
        console.log('Include Pet Success!', apptsWithPet);
    } catch (err: any) {
        console.error('Failed!', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
