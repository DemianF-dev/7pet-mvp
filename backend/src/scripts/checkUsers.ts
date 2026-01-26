import { PrismaClient } from './generated';
import prisma from './lib/prisma';

/**
 * Script para testar se há usuários no banco
 */
async function checkUsers() {
    try {
        console.log('🔍 Verificando usuários no banco de dados...');
        
        // Contar todos os usuários
        const totalUsers = await prisma.user.count();
        console.log(`📊 Total de usuários no banco: ${totalUsers}`);
        
        // Contar usuários ativos
        const activeUsers = await prisma.user.count({
            where: { active: true }
        });
        console.log(`✅ Usuários ativos: ${activeUsers}`);
        
        // Buscar amostra de usuários ativos
        if (activeUsers > 0) {
            const sampleUsers = await prisma.user.findMany({
                where: { active: true },
                take: 5,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    division: true
                }
            });
            
            console.log('👥 Amostra de usuários ativos:');
            sampleUsers.forEach((user, index) => {
                console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.division}`);
            });
        } else {
            console.log('❌ Nenhum usuário ativo encontrado!');
            
            // Tentar criar um usuário de teste
            console.log('🔧 Tentando criar usuário de teste...');
            const testUser = await prisma.user.create({
                data: {
                    email: 'admin@7pet.com.br',
                    name: 'Admin Teste',
                    role: 'ADMIN',
                    division: 'MASTER',
                    active: true,
                    color: '#3B82F6',
                    passwordHash: 'temp-hash'
                }
            });
            console.log('✅ Usuário de teste criado:', testUser);
        }
        
    } catch (error: any) {
        console.error('❌ Erro ao verificar usuários:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkUsers();
}

export { checkUsers };