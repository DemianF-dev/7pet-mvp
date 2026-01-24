import { PrismaClient } from './src/generated';

const prisma = new PrismaClient();

async function main() {
    const email = 'oidemianf@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { staffProfile: true }
    });

    if (!user) {
        console.log('USER_NOT_FOUND');
        console.log('Searching for any user to see what is in the DB...');
        const anyUsers = await prisma.user.findMany({ take: 5 });
        console.log('Sample Users:', JSON.stringify(anyUsers, null, 2));
        return;
    }

    console.log('USER_DATA:' + JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.passwordHash,
        staff: user.staffProfile
    }, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
