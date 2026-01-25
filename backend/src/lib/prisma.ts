import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Helper to create client safely
const createSafeClient = () => {
    try {
        const connectionString = process.env.DATABASE_URL?.split('?')[0];
        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });
        const adapter = new PrismaPg(pool);

        return new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    } catch (error) {
        console.error("❌ CRITICAL: Failed to initialize Prisma Client", error);

        // Return a Dummy Proxy that doesn't crash app startup but fails on usage
        return new Proxy({}, {
            get: function (target, prop, receiver) {
                if (prop === 'then') return undefined; // Promise safety
                return () => {
                    throw new Error(`Database Client failed to initialize: ${(error as Error).message}`);
                };
            }
        }) as unknown as PrismaClient;
    }
};

type PrismaClientSingleton = ReturnType<typeof createSafeClient>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? createSafeClient();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
