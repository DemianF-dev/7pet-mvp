import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function updateMasterUser() {
    try {
        // Deletar o usuário admin temporário
        await prisma.user.deleteMany({
            where: { email: 'admin@7pet.com' }
        });
        console.log('🗑️ Usuário temporário removido');

        // Verificar se já existe o usuário correto
        const existing = await prisma.user.findFirst({
            where: { email: 'oidemianf@gmail.com' }
        });

        if (existing) {
            // Atualizar usuário existente
            const updated = await prisma.user.update({
                where: { id: existing.id },
                data: {
                    division: 'MASTER',
                    role: 'ADMIN',
                    active: true,
                    showTutorial: false
                }
            });
            console.log('✅ Usuário MASTER atualizado:', updated.email);
            return;
        }

        // Criar novo usuário MASTER
        const passwordHash = await bcrypt.hash('123456', 10);

        const user = await prisma.user.create({
            data: {
                email: 'oidemianf@gmail.com',
                passwordHash,
                plainPassword: '123456',
                name: 'Demian Fernando',
                firstName: 'Demian',
                lastName: 'Fernando',
                division: 'MASTER',
                role: 'ADMIN',
                phone: '',
                active: true,
                showTutorial: false,
                color: '#6366F1'
            }
        });

        console.log('✅ Usuário MASTER criado com sucesso!');
        console.log('👤 Nome:', user.name);
        console.log('📧 Email:', user.email);
        console.log('🔑 Senha: 123456');
        console.log('🏷️ Division: MASTER');
        console.log('🆔 User ID:', user.id);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateMasterUser();
