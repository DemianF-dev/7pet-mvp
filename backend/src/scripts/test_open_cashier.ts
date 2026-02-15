import 'dotenv/config';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

async function main() {
    console.log('--- Attempting to Open Cash Session ---');
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    try {
        const openedById = '799a955c-ba5e-492a-afc5-2e2e646a16ec'; // Using ID from logs
        const openingBalance = 100;

        console.log('Checking for active session...');
        const activeSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN' }
        });

        if (activeSession) {
            console.log('Active session found:', activeSession.id);
            return;
        }

        console.log('Creating new session...');
        const session = await prisma.cashSession.create({
            data: {
                id: randomUUID(),
                openedById,
                openingBalance,
                status: 'OPEN'
            }
        });
        console.log('SUCCESS! Session created:', session.id);
    } catch (error) {
        console.error('FAILED TO OPEN SESSION:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
