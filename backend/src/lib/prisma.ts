import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

// For local dev, you might want more logs:
// log: ['query', 'info', 'warn', 'error'],

export default prisma;

// Cleanup on exit
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
