import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Note: Prisma 6+ no longer supports prisma.$use middleware
// Soft delete logic should be handled manually in queries or via extensions

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
