
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Polyfill fetch for older Node versions if needed, but Node 18+ has it.
// If it fails, we might need 'node-fetch' but let's try native first.
const fetch = global.fetch || require('node-fetch');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

console.log('DEBUG: DATABASE_URL exists?', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log('DEBUG: DATABASE_URL starts with', process.env.DATABASE_URL.substring(0, 15) + '...');
} else {
    console.error('DEBUG: DATABASE_URL is MISSING');
}

async function main() {
    console.log('🚀 Starting Schedule Wizard Endpoint Test (JS)...');

    // 1. Find a Master User to Authenticate
    const masterUser = await prisma.user.findFirst({
        where: { role: 'MASTER' }
    });

    if (!masterUser) {
        console.error('❌ No MASTER user found. Cannot authenticate.');
        process.exit(1);
    }

    console.log(`✅ Found Master User: ${masterUser.email}`);

    // 2. Generate Token
    const token = jwt.sign(
        { id: masterUser.id, role: masterUser.role, division: masterUser.division, email: masterUser.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 3. Find a Driver for Transport
    const driver = await prisma.user.findFirst({
        where: { division: 'LOGISTICA' }
    });
    // Use master as fallback driver
    const driverId = driver ? driver.id : masterUser.id;

    // 4. Create a Test Quote (SPA_TRANSPORTE)
    const customer = await prisma.user.findFirst({ where: { role: 'CLIENTE' }, include: { pets: true } });
    if (!customer || !customer.pets || customer.pets.length === 0) {
        console.error('❌ No Customer with Pets found. Cannot create quote.');
        process.exit(1);
    }
    const pet = customer.pets[0];

    const quote = await prisma.quote.create({
        data: {
            customerId: customer.id,
            petId: pet.id,
            type: 'SPA_TRANSPORTE',
            status: 'APROVADO',
            version: 1,
            totalAmount: 100,
            services: { create: [] },
            json: {},
            history: { create: [] }
        }
    });

    console.log(`✅ Created Test Quote: ${quote.id}`);

    // 5. Prepare Payload
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const occurrences = [
        {
            spaAt: tomorrow.toISOString(),
            levaAt: new Date(tomorrow.getTime() - 3600000).toISOString(),
            trazAt: new Date(tomorrow.getTime() + 7200000).toISOString(),
            levaDriverId: driverId,
            trazDriverId: driverId
        }
    ];

    // 6. Call Endpoint
    console.log('📡 Calling POST /quotes/:id/schedule...');
    try {
        const response = await fetch(`${API_URL}/quotes/${quote.id}/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ occurrences })
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log('✅ Endpoint Success!', data);

            // Check output
            if (data.count > 0 && data.appointments) {
                console.log(`🔎 Created ${data.count} appointments/legs.`);
            }

            // Cleanup
            console.log('🧹 Cleaning up...');
            await prisma.appointment.deleteMany({ where: { quoteId: quote.id } });
            await prisma.quote.delete({ where: { id: quote.id } });
            console.log('✅ Cleanup Done.');

        } else {
            console.error('❌ Endpoint Failed:', response.status, data);
        }

    } catch (err) {
        console.error('❌ Request Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
