import prisma from './src/lib/prisma';

async function checkAdminStatus() {
    try {
        console.log('🔍 Checking admin user status...\n');
        
        const adminEmail = 'oidemianf@gmail.com';
        
        // Find the admin user
        const user = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { customer: true }
        });

        if (!user) {
            console.log('❌ Admin user not found!');
            console.log('📧 Email searched:', adminEmail);
            return;
        }

        console.log('✅ Admin user found:');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.name || 'Not set');
        console.log('🆔 ID:', user.id);
        console.log('🔥 Active:', user.active);
        console.log('👔 Role:', user.role || 'Not set');
        console.log('🏷️ Division:', user.division);
        console.log('🔐 Permissions:', user.permissions || 'Not set');
        console.log('🚫 Customer Blocked:', user.customer?.isBlocked || false);
        
        // Check if active is true
        if (user.active === true) {
            console.log('\n✅ SUCCESS: Admin user has active=true');
        } else {
            console.log('\n❌ PROBLEM: Admin user has active=false or null');
            console.log('🔧 Run fix script to set active=true');
        }

        // Check if role is properly set
        if (user.role === 'MASTER' || user.role === 'ADMIN') {
            console.log('✅ Role is properly set:', user.role);
        } else {
            console.log('❌ Role issue:', user.role || 'NULL');
        }

    } catch (error: any) {
        console.error('❌ Error checking admin status:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminStatus();
