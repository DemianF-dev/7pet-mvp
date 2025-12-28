
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

async function main() {
    try {
        // 1. Find a client with customer record
        const user = await prisma.user.findFirst({
            where: { role: 'CLIENTE', customer: { isNot: null } },
            include: { customer: true }
        });

        if (!user || !user.customer) {
            console.log('No suitable client user found.');
            return;
        }

        console.log(`Testing with User: ${user.email} (ID: ${user.id})`);
        console.log(`Customer ID: ${user.customer.id}`);

        // 2. Check if they have quotes in DB
        const dbQuotes = await prisma.quote.findMany({
            where: { customerId: user.customer.id }
        });
        console.log(`Quotes in DB for this customer: ${dbQuotes.length}`);
        if (dbQuotes.length > 0) {
            console.log('Sample Quote ID:', dbQuotes[0].id);
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Call API
        console.log('\nCalling GET http://localhost:3001/quotes ...');
        const response = await fetch('http://localhost:3001/quotes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const quotes = await response.json();
            console.log(`API returned ${quotes.length} quotes.`);
            console.log(JSON.stringify(quotes, null, 2));
        } else {
            console.log(`API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(text);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
