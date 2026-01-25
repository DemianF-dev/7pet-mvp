import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createLogisticsUsers() {
    try {
        // Create logistics user collaborator
        const logisticsPassword = await bcrypt.hash('logistica123', 10);
        
        const logisticsUser = await prisma.user.upsert({
            where: { email: 'logistica@7pet.com' },
            update: {},
            create: {
                email: 'logistica@7pet.com',
                passwordHash: logisticsPassword,
                plainPassword: 'logistica123',
                name: 'Colaborador Logística',
                firstName: 'Logística',
                lastName: 'Colaborador',
                role: 'OPERACIONAL',
                division: 'LOGISTICA',
                phone: '(11) 98888-8888',
                active: true,
                showTutorial: false,
                color: '#FED7AA',
                permissions: JSON.stringify([
                    'dashboard', 'agenda-log', 'transport', 'kanban', 'chat', 'feed',
                    'support', 'notifications', 'profile', 'my-hr', 'settings', 'pos'
                ])
            }
        });

        console.log('✅ Logistics user created/updated successfully!');
        console.log('📧 Email:', logisticsUser.email);
        console.log('🔑 Password: logistica123');
        console.log('👤 Role:', logisticsUser.role);
        console.log('🏢 Division:', logisticsUser.division);
        console.log('🔐 Permissions:', JSON.parse(logisticsUser.permissions || '[]'));

        // Create commercial user collaborator
        const commercialPassword = await bcrypt.hash('comercial123', 10);
        
        const commercialUser = await prisma.user.upsert({
            where: { email: 'comercial@7pet.com' },
            update: {},
            create: {
                email: 'comercial@7pet.com',
                passwordHash: commercialPassword,
                plainPassword: 'comercial123',
                name: 'Colaborador Comercial',
                firstName: 'Comercial',
                lastName: 'Colaborador',
                role: 'COMERCIAL',
                division: 'COMERCIAL',
                phone: '(11) 97777-7777',
                active: true,
                showTutorial: false,
                color: '#BFDBFE',
                permissions: JSON.stringify([
                    'dashboard', 'kanban', 'customers', 'quotes', 'services', 'chat', 'feed',
                    'support', 'notifications', 'profile', 'my-hr', 'settings', 'pos'
                ])
            }
        });

        console.log('\n✅ Commercial user created/updated successfully!');
        console.log('📧 Email:', commercialUser.email);
        console.log('🔑 Password: comercial123');
        console.log('👤 Role:', commercialUser.role);
        console.log('🏢 Division:', commercialUser.division);
        console.log('🔐 Permissions:', JSON.parse(commercialUser.permissions || '[]'));

        // Summary
        console.log('\n🎯 ACCESS FIX SUMMARY:');
        console.log('1. ✅ LOGISTICA users can now access /staff/agenda-log');
        console.log('2. ✅ COMERCIAL users can now access quotes and customers');
        console.log('3. ✅ Permission system now supports division-based access');
        console.log('4. ✅ Route protection updated to include LOGISTICA division');
        console.log('5. ✅ Backend authorization middleware includes LOGISTICA');

    } catch (error) {
        console.error('❌ Error creating logistics users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createLogisticsUsers();