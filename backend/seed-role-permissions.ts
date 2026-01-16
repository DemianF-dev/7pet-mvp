import prisma from './src/lib/prisma';

const ROLE_PERMISSIONS = [
    {
        role: 'MASTER',
        label: 'Master / Dev',
        permissions: JSON.stringify([
            'dashboard', 'chat', 'feed', 'quotes', 'agenda-spa', 'agenda-log',
            'kanban', 'customers', 'services', 'products', 'billing', 'reports',
            'management', 'transport', 'transport-config', 'users', 'hr-collaborators',
            'hr-pay-periods', 'support', 'my-hr', 'strategy', 'notifications',
            'profile', 'settings', 'client-dashboard', 'client-pets', 'client-chat',
            'client-schedule', 'client-appointments', 'client-quote-request',
            'client-quotes', 'client-payments'
        ])
    },
    {
        role: 'ADMIN',
        label: 'Administrador',
        permissions: JSON.stringify([
            'dashboard', 'chat', 'feed', 'quotes', 'agenda-spa', 'agenda-log',
            'customers', 'services', 'products', 'billing', 'reports', 'management',
            'transport', 'transport-config', 'users', 'hr-collaborators', 'hr-pay-periods',
            'support', 'my-hr', 'strategy', 'notifications', 'profile', 'settings'
        ])
    },
    {
        role: 'GESTAO',
        label: 'Gestão',
        permissions: JSON.stringify([
            'dashboard', 'chat', 'feed', 'quotes', 'agenda-spa', 'agenda-log',
            'customers', 'services', 'products', 'billing', 'reports', 'management',
            'transport', 'transport-config', 'hr-collaborators', 'hr-pay-periods',
            'support', 'my-hr', 'notifications', 'profile', 'settings', 'users'
        ])
    },
    {
        role: 'OPERACIONAL',
        label: 'Operacional',
        permissions: JSON.stringify([
            'dashboard', 'chat', 'feed', 'agenda-spa', 'agenda-log',
            'transport', 'support', 'my-hr', 'notifications', 'profile', 'settings'
        ])
    },
    {
        role: 'SPA',
        label: 'Banho & Tosa',
        permissions: JSON.stringify([
            'agenda-spa', 'chat', 'feed', 'support', 'my-hr',
            'notifications', 'profile', 'settings'
        ])
    },
    {
        role: 'CLIENTE',
        label: 'Cliente',
        permissions: JSON.stringify([
            'client-dashboard', 'client-pets', 'client-chat', 'client-schedule',
            'client-appointments', 'client-quote-request', 'client-quotes', 'client-payments',
            'notifications', 'profile', 'settings'
        ])
    }
];

async function seedRolePermissions() {
    console.log('🔐 Criando/Atualizando permissões de cargos via SQL...\n');

    try {
        for (const rp of ROLE_PERMISSIONS) {
            // Delete existing if any
            await prisma.$executeRawUnsafe(
                `DELETE FROM "RolePermission" WHERE role = $1`,
                rp.role
            );

            // Insert new
            await prisma.$executeRawUnsafe(
                `INSERT INTO "RolePermission" (role, label, permissions, "updatedAt") VALUES ($1, $2, $3, NOW())`,
                rp.role, rp.label, rp.permissions
            );
            console.log(`  ✅ ${rp.role}: configurado`);
        }

        console.log('\n✅ Permissões de cargos configuradas com sucesso!');

    } catch (error: any) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedRolePermissions();
