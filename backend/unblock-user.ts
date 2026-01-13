
import prisma from './src/lib/prisma';

async function main() {
    const email = 'sil@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { customer: true }
    });

    if (!user || !user.customer) {
        console.log('USER_OR_CUSTOMER_NOT_FOUND');
        return;
    }

    await prisma.customer.update({
        where: { id: user.customer.id },
        data: { isBlocked: false }
    });

    console.log('USER_UNBLOCKED:' + email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
