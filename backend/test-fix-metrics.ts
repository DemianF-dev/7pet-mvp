
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing groupBy in staffController logic...');
        const totalClientsServedData = await prisma.appointment.groupBy({
            by: ['customerId'],
            where: {
                status: 'FINALIZADO' as any,
                deletedAt: null
            }
        });
        console.log('Success! Total clients served count:', totalClientsServedData.length);

        const totalPetsServedData = await prisma.appointment.groupBy({
            by: ['petId'],
            where: {
                status: 'FINALIZADO' as any,
                deletedAt: null
            }
        });
        console.log('Success! Total pets served count:', totalPetsServedData.length);

    } catch (e) {
        console.error('Test FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
