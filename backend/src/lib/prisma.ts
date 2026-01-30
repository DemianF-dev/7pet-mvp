import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Helper to create client safely
const createSafeClient = () => {
    try {
        let connectionString = process.env.DATABASE_URL;

        // Supabase Transaction Mode Fix: Ensure pgbouncer=true is present
        if (connectionString && !connectionString.includes('pgbouncer=true') && !connectionString.includes('?')) {
            connectionString += '?pgbouncer=true';
        } else if (connectionString && !connectionString.includes('pgbouncer=true')) {
            connectionString += '&pgbouncer=true';
        }

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
    } catch (error: any) {
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
