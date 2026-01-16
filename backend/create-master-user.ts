import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createMasterUser() {
    try {
        // Check if master user exists
        const existing = await prisma.user.findFirst({
            where: { email: 'admin@7pet.com' }
        });

        if (existing) {
            console.log('✅ Master user already exists:', existing.email);
            return;
        }

        // Create master user
        const passwordHash = await bcrypt.hash('admin123', 10);

        const user = await prisma.user.create({
            data: {
                email: 'admin@7pet.com',
                passwordHash,
                plainPassword: 'admin123',
                name: 'Administrador',
                firstName: 'Admin',
                lastName: 'Master',
                division: 'MASTER',
                role: 'ADMIN',
                phone: '(11) 99999-9999',
                active: true,
                showTutorial: false,
                color: '#FF0000'
            }
        });

        console.log('✅ Master user created successfully!');
        console.log('📧 Email:', user.email);
        console.log('🔑 Password: admin123');
        console.log('👤 User ID:', user.id);

    } catch (error) {
        console.error('❌ Error creating master user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMasterUser();
