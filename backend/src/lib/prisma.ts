import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Helper to create client safely
const createSafeClient = () => {
    try {
        let connectionString = process.env.DATABASE_URL;

        // Supabase Connection String Repair (Self-Healing)
        if (connectionString) {
            // 1. Fix missing pgbouncer=true
            if (!connectionString.includes('pgbouncer=true')) {
                connectionString += connectionString.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
            }

            // 2. Fix missing project ref in username for Supabase Poolers
            // Format: postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com...
            const poolerRegex = /postgresql?:\/\/postgres:([^@]+)@([^:]+\.pooler\.supabase\.com)/;
            const match = connectionString.match(poolerRegex);
            if (match) {
                const projectRef = 'zpcwgsjsktqjncnpgaon'; // Hardcoded fallback for THIS specific project
                connectionString = connectionString.replace('postgres:', `postgres.${projectRef}:`);
                console.log('🔧 Auto-repaired Supabase Pooler connection string: added project ref to username.');
            }
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
