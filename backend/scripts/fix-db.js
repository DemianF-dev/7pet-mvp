
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to add columns manually...');
        await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "notes" TEXT;');
        await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "coatType" TEXT;');
        await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "sizeLabel" TEXT;');
        console.log('Columns added successfully!');
    } catch (e) {
        console.error('Error adding columns:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
