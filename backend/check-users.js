const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                plainPassword: true
            }
        });

        console.log('📋 Primeiros 5 usuários no banco:\n');
        users.forEach((user, idx) => {
            console.log(`${idx + 1}. ${user.name || 'Sem nome'}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👔 Role: ${user.role}`);
            console.log(`   🔑 Plain Password: ${user.plainPassword || 'Não disponível'}`);
            console.log('');
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        await prisma.$disconnect();
    }
}

checkUsers();
