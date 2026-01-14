import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findBitrixCustomers() {
    // Busca clientes com legacyBitrixId
    const bitrixCustomers = await prisma.customer.findMany({
        where: {
            legacyBitrixId: { not: null }
        },
        include: {
            user: {
                select: {
                    id: true,
                    seqId: true,
                    firstName: true,
                    lastName: true,
                    deletedAt: true
                }
            },
            appointments: {
                select: { id: true }
            },
            quotes: {
                select: { id: true }
            },
            pets: {
                select: { id: true }
            }
        }
    });

    console.log(`\nEncontrados ${bitrixCustomers.length} clientes do Bitrix:\n`);

    bitrixCustomers.forEach(c => {
        const seqId = String(c.user.seqId).padStart(4, '0');
        console.log(`\n📋 CL-${seqId}: ${c.user.firstName || 'Sem Nome'} ${c.user.lastName || ''}`);
        console.log(`   Bitrix ID: ${c.legacyBitrixId}`);
        console.log(`   Customer ID: ${c.id}`);
        console.log(`   User ID: ${c.user.id}`);
        console.log(`   Deletado: ${c.deletedAt ? 'SIM' : 'NÃO'}`);
        console.log(`   Agendamentos: ${c.appointments.length}`);
        console.log(`   Orçamentos: ${c.quotes.length}`);
        console.log(`   Pets: ${c.pets.length}`);
    });

    await prisma.$disconnect();
}

findBitrixCustomers();
