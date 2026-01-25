const { PrismaClient } = require('./src/generated/index.js');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Copy the same configuration as in lib/prisma.ts
const prismaClientSingleton = () => {
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
};

const prisma = prismaClientSingleton();

async function checkSpecificUsers() {
    try {
        const emailsToCheck = [
            'marcio@gmail.com',
            'claudio@gmail.com'
        ];

        console.log('🔍 Checking specific user access issues...\n');

        for (const email of emailsToCheck) {
            console.log(`📧 Checking user: ${email}`);
            
            const user = await prisma.user.findUnique({
                where: { email },
                include: { 
                    customer: true,
                    notifications: true
                }
            });

            if (!user) {
                console.log(`❌ USER_NOT_FOUND: ${email} does not exist in database\n`);
                continue;
            }

            console.log(`✅ USER_FOUND:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Name: ${user.name || 'Not set'}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Division: ${user.division}`);
            console.log(`   Staff ID: ${user.staffId || 'N/A'}`);
            console.log(`   Is Eligible: ${user.isEligible}`);
            console.log(`   Password Hash: ${user.passwordHash ? 'YES' : 'NO'}`);
            console.log(`   Plain Password: ${user.plainPassword || 'N/A'}`);
            
            if (user.customer) {
                console.log(`   Customer Profile:`);
                console.log(`     - Customer ID: ${user.customer.id}`);
                console.log(`     - Is Blocked: ${user.customer.isBlocked}`);
                console.log(`     - Type: ${user.customer.type}`);
                console.log(`     - Phone: ${user.customer.phone || 'N/A'}`);
                console.log(`     - Address: ${user.customer.address || 'N/A'}`);
            } else {
                console.log(`   ⚠️  NO_CUSTOMER_PROFILE: User exists but has no customer record`);
            }

            // Test password scenarios
            if (user.passwordHash === 'GOOGLE_AUTH') {
                console.log(`   🔐 AUTH_METHOD: Google OAuth only`);
            } else if (user.passwordHash === 'TEMPORARY') {
                console.log(`   ⚠️  PASSWORD_ISSUE: Temporary password hash detected`);
            } else if (!user.passwordHash) {
                console.log(`   ❌ PASSWORD_ISSUE: No password hash set`);
            }

            console.log(`   📅 Created: ${user.createdAt}`);
            console.log(`   📅 Updated: ${user.updatedAt}`);
            console.log('');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
        await prisma.$disconnect();
    }
}

checkSpecificUsers();