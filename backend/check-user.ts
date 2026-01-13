
import prisma from './src/lib/prisma';

async function main() {
    const email = 'sil@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    if (!user) {
        console.log('USER_NOT_FOUND');
        return;
    }

    console.log('USER_DATA:' + JSON.stringify({
        email: user.email,
        role: user.role,
        isBlocked: user.customer?.isBlocked
    }));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
