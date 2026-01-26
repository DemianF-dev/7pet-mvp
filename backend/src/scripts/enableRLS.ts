
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Enabling Row Level Security (RLS) on all tables...');

    const tables = [
        'User',
        'Customer',
        'Pet',
        'Service',
        'Appointment',
        'TransportDetails',
        'Quote',
        'QuoteItem',
        'Invoice',
        'PaymentRecord',
        'StatusHistory',
        'Notification',
        '_AppointmentToService' // Prisma implicit many-to-many
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log(`✅ RLS enabled for table: "${table}"`);
        } catch (error: any) {
            console.error(`❌ Failed to enable RLS for table: "${table}"`, error);
        }
    }

    // Optional: Creates a "catch-all" permissive policy for the postgres/service_role user if needed?
    // No, postgres user typically has BYPASSRLS.
    // However, if we want to be super safe and ensure the backend can always access, we could add a policy for specific roles.
    // But typically "postgres" or "supabase_admin" bypasses it.

    console.log('\n🏁 RLS Enablement Complete.');
    console.log('NOTE: Since no policies were added, these tables are now inaccessible to the public via Supabase API (Anon Key).');
    console.log('Your backend (Prisma) should continue to work if it connects as a privileged user (postgres/service_role).');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
