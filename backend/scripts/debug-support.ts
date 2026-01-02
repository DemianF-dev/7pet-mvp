
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START DEBUG DATABASE ---');
    try {
        console.log('1. Connecting to DB...');
        await prisma.$connect();
        console.log('   OK');

        console.log('2. Finding Master User...');
        const master = await prisma.user.findUnique({
            where: { email: 'oidemianf@gmail.com' }
        });
        if (!master) {
            console.error('   ERROR: Master user not found');
            return;
        }
        console.log('   OK. ID:', master.id);

        console.log('3. Testing BugReport creation...');
        try {
            const bug = await prisma.bugReport.create({
                data: {
                    userId: master.id,
                    name: 'Debug Script',
                    description: 'This is a test bug report from debug script',
                    status: 'SOLICITADO'
                }
            });
            console.log('   OK. Created ID:', bug.id);

            console.log('4. Testing BugReport list...');
            const list = await prisma.bugReport.findMany();
            console.log('   OK. Total bugs found:', list.length);

            console.log('5. Cleaning up test bug...');
            await prisma.bugReport.delete({ where: { id: bug.id } });
            console.log('   OK.');

        } catch (err: any) {
            console.error('   FAIL: Error interacting with BugReport table.');
            console.error('   Details:', err.message);
            if (err.message.includes('does not exist')) {
                console.error('   CRITICAL: The table likely does not exist in the DB.');
            }
        }

    } catch (e: any) {
        console.error('FATAL ERROR:', e);
    } finally {
        await prisma.$disconnect();
        console.log('--- END DEBUG DATABASE ---');
    }
}

main();
