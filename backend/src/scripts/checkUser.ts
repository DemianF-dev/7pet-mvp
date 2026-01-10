
import prisma from '../lib/prisma';

async function checkUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'oidemian@gmail.com' },
        select: { id: true, email: true, role: true, division: true }
    });
    console.log('User check:', user);
}

checkUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
