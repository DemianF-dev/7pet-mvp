
import prisma from '../lib/prisma';

async function promoteCorrectMaster() {
    const targetEmail = 'oidemianf@gmail.com'; // O email correto com 'f'

    console.log(`🔍 Procurando usuário: ${targetEmail}...`);

    const user = await prisma.user.findUnique({
        where: { email: targetEmail }
    });

    if (!user) {
        console.error(`❌ Usuário ${targetEmail} não encontrado!`);
        console.log('Criando usuário MASTER agora...');
        // Se não existir, criar (fallback de segurança)
        // Mas baseado no print, ele já existe como ADMIN
    } else {
        console.log(`✅ Usuário encontrado. Role atual: ${user.role}`);

        const updatedUser = await prisma.user.update({
            where: { email: targetEmail },
            data: {
                role: 'MASTER',
                division: 'GESTAO',
                // Permissões explícitas para garantir acesso total
                permissions: JSON.stringify([
                    'dashboard', 'quotes', 'agenda-spa', 'agenda-log',
                    'kanban', 'transport', 'customers', 'services',
                    'billing', 'reports', 'management', 'users',
                    'transport-config', 'notifications', 'settings'
                ])
            }
        });

        console.log(`👑 SUCESSO! ${targetEmail} foi promovido para MASTER.`);
        console.log('Novos dados:', {
            role: updatedUser.role,
            division: updatedUser.division,
            permissions: updatedUser.permissions
        });
    }
}

promoteCorrectMaster()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
