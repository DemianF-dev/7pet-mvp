require('dotenv').config();
const { PrismaClient } = require('./src/generated');
const prisma = new PrismaClient();

async function main() {
    const email = 'oidemianf@gmail.com';
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('--- USER NOT FOUND ---');
            const total = await prisma.user.count();
            console.log('Total users in DB:', total);
            const sample = await prisma.user.findMany({ take: 3, select: { email: true, role: true } });
            console.log('Sample users:', JSON.stringify(sample, null, 2));
        } else {
            console.log('--- USER FOUND ---');
            console.log(JSON.stringify({
                id: user.id,
                email: user.email,
                role: user.role,
                division: user.division,
                active: user.active,
                hasPasswordHash: !!user.passwordHash,
                plainPassword: user.plainPassword ? '*****' : 'null',
                name: user.name
            }, null, 2));

            // SECURITY: Checking the password login logic
            // In many cases, we might have plainPassword for testing
            if (user.plainPassword) {
                console.log('Plain password field is present.');
            }
        }
    } catch (error) {
        console.error('Database Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
