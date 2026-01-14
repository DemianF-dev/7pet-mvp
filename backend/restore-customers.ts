import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreDeletedCustomers() {
    // Busca todos os clientes deletados
    const deleted = await prisma.customer.findMany({
        where: {
            deletedAt: { not: null }
        },
        include: {
            user: {
                select: {
                    seqId: true,
                    firstName: true,
                    lastName: true,
                    id: true
                }
            }
        }
    });

    console.log(`\nEncontrados ${deleted.length} clientes deletados:\n`);

    deleted.forEach(c => {
        const seqId = String(c.user.seqId).padStart(4, '0');
        const source = c.legacyBitrixId ? `Bitrix: ${c.legacyBitrixId}` : 'Manual';
        console.log(`  - CL-${seqId}: ${c.user.firstName} ${c.user.lastName || ''} (${source}) - Deletado em: ${c.deletedAt}`);
    });

    console.log('\n🔄 Restaurando todos os clientes deletados...\n');

    // Restaura todos os clientes
    const customerResult = await prisma.customer.updateMany({
        where: {
            deletedAt: { not: null }
        },
        data: {
            deletedAt: null
        }
    });

    // Restaura os usuários correspondentes
    const userIds = deleted.map(c => c.user.id);
    const userResult = await prisma.user.updateMany({
        where: {
            id: { in: userIds },
            deletedAt: { not: null }
        },
        data: {
            deletedAt: null,
            active: true
        }
    });

    console.log(`✅ ${customerResult.count} clientes restaurados`);
    console.log(`✅ ${userResult.count} usuários restaurados`);

    await prisma.$disconnect();
}

restoreDeletedCustomers();
