import prisma from '../src/lib/prisma';

async function fix() {
    console.log('Restoring roles...');
    try {
        await prisma.user.update({ where: { email: 'oidemianf@gmail.com' }, data: { role: 'MASTER' } });
        console.log('Restored oidemianf@gmail.com to MASTER');
    } catch (e) { console.log('User oidemianf not found'); }

    try {
        await prisma.user.updateMany({
            where: { email: { in: ['gb.simoes@outlook.com', 'gabriel.simoes@outlook.com'] } },
            data: { role: 'ADMIN' }
        });
        console.log('Restored Simoes to ADMIN');
    } catch (e) { console.log('Simoes not found'); }

    console.log('Seeding RolePermissions...');
    const defaults = [
        { role: 'OPERACIONAL', label: 'Operacional', permissions: JSON.stringify(['dashboard', 'kanban', 'transport']) },
        { role: 'SPA', label: 'SPA', permissions: JSON.stringify(['dashboard', 'kanban', 'services']) },
        { role: 'GESTAO', label: 'Gestão', permissions: JSON.stringify(['dashboard', 'kanban', 'transport', 'quotes', 'customers', 'reports']) },
        { role: 'ADMIN', label: 'Admin', permissions: JSON.stringify(['dashboard', 'kanban', 'transport', 'quotes', 'customers', 'services', 'billing', 'management', 'reports', 'users']) }
    ];

    for (const d of defaults) {
        await prisma.rolePermission.upsert({
            where: { role: d.role },
            update: d,
            create: d
        });
        console.log(`Upserted role: ${d.role}`);
    }
    console.log('Done.');
}

fix()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
