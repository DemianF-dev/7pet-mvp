import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Script to promote users to their proper roles and initialize notification settings
 * 
 * Actions:
 * 1. Promote oidemian@gmail.com to MASTER
 * 2. Create or update gb.simoes@outlook.com as ADMIN
 * 3. Initialize default notification settings
 */

async function promoteUsers() {
    try {
        console.log('🔧 Starting user promotion and notification setup...\n');

        // 1. Promote oidemian@gmail.com to MASTER
        const masterUser = await prisma.user.findUnique({
            where: { email: 'oidemian@gmail.com' }
        });

        if (!masterUser) {
            console.log('⚠️ Master user (oidemian@gmail.com) not found. Creating...');
            const tempPassword = 'Master@7Pet2026';
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            await prisma.user.create({
                data: {
                    email: 'oidemian@gmail.com',
                    passwordHash: hashedPassword,
                    name: 'Oidemian',
                    firstName: 'Oidemian',
                    lastName: 'Master',
                    role: 'MASTER',
                    division: 'GESTAO',
                    active: true,
                    phone: '5511999999999' // Dummy phone
                }
            });
            console.log(`✅ Created MASTER user: oidemian@gmail.com`);
            console.log(`   Temporary password: ${tempPassword}`);
        } else {
            await prisma.user.update({
                where: { id: masterUser.id },
                data: { role: 'MASTER', division: 'GESTAO' }
            });
            console.log('✅ Promoted oidemian@gmail.com to MASTER');
        }

        // 2. Create or update gb.simoes@outlook.com as ADMIN
        const adminEmail = 'gb.simoes@outlook.com';
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            // Update existing user to ADMIN
            await prisma.user.update({
                where: { id: existingAdmin.id },
                data: {
                    role: 'ADMIN',
                    division: 'GESTAO',
                    active: true
                }
            });
            console.log(`✅ Updated ${adminEmail} to ADMIN role`);
        } else {
            // Create new ADMIN user with a temporary password
            const tempPassword = 'Admin@7Pet2026'; // User should change this on first login
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const newAdmin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    name: 'Gabriel Simões',
                    firstName: 'Gabriel',
                    lastName: 'Simões',
                    role: 'ADMIN',
                    division: 'GESTAO',
                    active: true,
                    showTutorial: false
                }
            });
            console.log(`✅ Created new ADMIN user: ${adminEmail}`);
            console.log(`   Temporary password: ${tempPassword}`);
            console.log('   ⚠️  User should change password on first login!');
        }

        // 3. Initialize default notification settings
        const notificationTypes = [
            'APPOINTMENT_REMINDER',
            'QUOTE_UPDATE',
            'CHAT_MESSAGE',
            'DAILY_REVIEW'
        ];

        for (const type of notificationTypes) {
            await prisma.notificationSettings.upsert({
                where: { notificationType: type },
                create: {
                    notificationType: type,
                    enabled: true,
                    frequency: 'IMMEDIATE',
                    allowedRoles: JSON.stringify(['MASTER', 'ADMIN', 'GESTAO', 'OPERACIONAL', 'SPA', 'COMERCIAL', 'CLIENTE']),
                    minInterval: 0,
                    updatedBy: masterUser.id
                },
                update: {
                    // Don't override existing settings
                }
            });
        }
        console.log('✅ Initialized default notification settings\n');

        // Summary
        console.log('📊 Summary:');
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: 'oidemian@gmail.com' },
                    { email: adminEmail }
                ]
            },
            select: { email: true, role: true, division: true }
        });

        users.forEach(u => {
            console.log(`   - ${u.email}: ${u.role} (${u.division})`);
        });

        console.log('\n✅ Setup complete!');
    } catch (error) {
        console.error('❌ Error during setup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

promoteUsers();
