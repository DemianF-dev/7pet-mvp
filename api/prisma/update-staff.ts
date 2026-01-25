
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Atualizando staff...');

    // 1. Marlene - Atendimento
    const marlene = await prisma.user.update({
        where: { email: 'marlene@gmail.com' },
        data: {
            division: 'ATENDIMENTO',
            role: 'GESTAO',
            isSupportAgent: true,
            active: true
        }
    }).catch(e => console.log('⚠️ Marlene não encontrada ou já atualizada.'));

    if (marlene) console.log('✅ Marlene atualizada para ATENDIMENTO.');


    // 2. Gabriela - Financeiro
    const gabi = await prisma.user.update({
        where: { email: 'gb.simoes@outlook.com' },
        data: {
            division: 'FINANCEIRO',
            role: 'GESTAO',
            isSupportAgent: true,
            active: true
        }
    }).catch(e => console.log('⚠️ Gabi Simões não encontrada ou já atualizada.'));

    if (gabi) console.log('✅ Gabi Simões atualizada para FINANCEIRO.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
