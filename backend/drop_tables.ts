
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        console.log("Dropping tables...");
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "PayAdjustment" CASCADE;');
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "PayStatement" CASCADE;');
        await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "PayPeriod" CASCADE;');
        console.log("Dropped tables successfully.");
    } catch (e) {
        console.error("Error dropping tables:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
