
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START MANUAL MIGRATION ---');
    try {
        console.log('1. Connecting to DB...');
        await prisma.$connect();

        console.log('2. Creating BugReport Table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "BugReport" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "imageUrl" TEXT,
                "status" TEXT NOT NULL DEFAULT 'SOLICITADO',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "resolvedAt" TIMESTAMP(3),

                CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('   Table created (if not exists).');

        console.log('3. Adding Foreign Key...');
        // We use try-catch here in case constraint already exists
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "BugReport" 
                ADD CONSTRAINT "BugReport_userId_fkey" 
                FOREIGN KEY ("userId") REFERENCES "User"("id") 
                ON DELETE RESTRICT ON UPDATE CASCADE;
            `);
            console.log('   FK Constraint added.');
        } catch (e: any) {
            console.log('   FK Constraint might already exist or failed:', e.message);
        }

        console.log('Migration completed.');

    } catch (e: any) {
        console.error('FATAL ERROR:', e);
    } finally {
        await prisma.$disconnect();
        console.log('--- END MANUAL MIGRATION ---');
    }
}

main();
