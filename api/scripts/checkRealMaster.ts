
import prisma from '../lib/prisma';

async function checkRealMaster() {
    const user = await prisma.user.findUnique({
        where: { email: 'oidemianf@gmail.com' },
        select: { id: true, email: true, role: true, division: true }
    });
    console.log('Real Master check:', user);
}

checkRealMaster()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
