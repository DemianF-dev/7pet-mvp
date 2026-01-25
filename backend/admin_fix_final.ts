import prisma from './src/lib/prisma';

async function fixAdminStatus() {
    try {
        console.log('🔧 Fixing admin user status...\n');
        
        const adminEmail = 'oidemianf@gmail.com';
        
        // Find the admin user first
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!existingUser) {
            console.log('❌ Admin user not found! Creating new admin user...');
            
            // Create the admin user
            const newUser = await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Demian Fernando',
                    firstName: 'Demian',
                    lastName: 'Fernando',
                    role: 'MASTER',
                    division: 'MASTER',
                    active: true,
                    permissions: '["ALL"]',
                    showTutorial: false,
                    isEligible: true,
                    color: '#6366F1'
                }
            });
            
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email:', newUser.email);
            console.log('🆔 ID:', newUser.id);
            console.log('🔥 Active:', newUser.active);
            console.log('👔 Role:', newUser.role);
            console.log('🏷️ Division:', newUser.division);
            
        } else {
            console.log('👤 Found existing admin user, updating...');
            
            // Update the existing user to ensure all fields are correct
            const updatedUser = await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    active: true,
                    role: 'MASTER',
                    division: 'MASTER',
                    permissions: '["ALL"]',
                    showTutorial: false,
                    isEligible: true,
                    updatedAt: new Date()
                }
            });
            
            console.log('✅ Admin user updated successfully!');
            console.log('📧 Email:', updatedUser.email);
            console.log('🆔 ID:', updatedUser.id);
            console.log('🔥 Active:', updatedUser.active);
            console.log('👔 Role:', updatedUser.role);
            console.log('🏷️ Division:', updatedUser.division);
        }

        console.log('\n🎉 Admin user is now properly configured!');
        console.log('🔥 Active: true');
        console.log('👔 Role: MASTER');
        console.log('🏷️ Division: MASTER');
        console.log('🔐 Permissions: ["ALL"]');

    } catch (error: any) {
        console.error('❌ Error fixing admin status:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminStatus();
