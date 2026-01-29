
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:s%23Tecnologia%407185*@db.zpcwgsjsktqjncnpgaon.supabase.co:5432/postgres"
        }
    }
});

async function checkUser() {
    const email = 'oidemianf@gmail.com';
    console.log(`Checking user: ${email} in Supabase DB...`);
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { customer: true }
        });
        if (user) {
            console.log('User found:', {
                id: user.id,
                email: user.email,
                role: user.role,
                hasPasswordHash: !!user.passwordHash,
                isBlocked: (user as any).customer?.isBlocked
            });
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
