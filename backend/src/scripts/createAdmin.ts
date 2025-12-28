import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'oidemianf@gmail.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'ADMIN',
            name: 'Demian Fernando Simoes'
        },
        create: {
            email,
            passwordHash: hashedPassword,
            name: 'Demian Fernando Simoes',
            role: 'ADMIN'
        }
    });

    console.log('Usuário Admin criado/atualizado com sucesso!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
