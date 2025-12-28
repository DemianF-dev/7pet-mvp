import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'Demian@Master';
    const password = 's#Dfs@master*85';
    const name = 'Demian Master';

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log('Usuário Master já existe. Atualizando senha e cargo...');
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: existingUser.id },
            data: {
                passwordHash,
                role: 'MASTER' as any // Cast to any because the client might not be updated yet
            }
        });
        console.log('Usuário Master atualizado com sucesso!');
    } else {
        console.log('Criando Usuário Master...');
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: 'MASTER' as any
            }
        });
        console.log('Usuário Master criado com sucesso!');
    }
}

main()
    .catch((e) => {
        console.error('Erro ao criar usuário master:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
