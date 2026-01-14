import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustomers() {
    const all = await prisma.customer.findMany({
        include: {
            user: {
                select: {
                    seqId: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

    console.log('TOTAL DE CLIENTES (incluindo deletados):', all.length);

    const active = all.filter(c => !c.deletedAt);
    const deleted = all.filter(c => c.deletedAt);

    console.log('ATIVOS:', active.length);
    console.log('DELETADOS:', deleted.length);

    console.log('\n=== CLIENTES ATIVOS ===');
    active.forEach(c => {
        const seqId = String(c.user.seqId).padStart(4, '0');
        const source = c.legacyBitrixId ? `Bitrix: ${c.legacyBitrixId}` : 'Manual';
        console.log(`  - CL-${seqId}: ${c.user.firstName} ${c.user.lastName || ''} (${source})`);
    });

    if (deleted.length > 0) {
        console.log('\n=== CLIENTES DELETADOS ===');
        deleted.forEach(c => {
            const seqId = String(c.user.seqId).padStart(4, '0');
            console.log(`  - CL-${seqId}: ${c.user.firstName} ${c.user.lastName || ''} (Deletado em: ${c.deletedAt})`);
        });
    }

    await prisma.$disconnect();
}

checkCustomers();
