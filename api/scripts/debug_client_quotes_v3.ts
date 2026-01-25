
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import http from 'http';

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
        } else {
            console.log('Creating a dummy quote for testing...');
            await prisma.quote.create({
                data: {
                    customerId: user.customer.id,
                    status: 'SOLICITADO',
                    totalAmount: 100,
                    items: {
                        create: { description: 'Test Item', quantity: 1, price: 100 }
                    },
                    statusHistory: {
                        create: { oldStatus: 'NONE', newStatus: 'SOLICITADO', changedBy: user.id }
                    }
                }
            });
            console.log('Dummy quote created.');
        }

        // 3. Generate Token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        // 4. Call API using native http
        console.log('\nCalling GET http://localhost:3001/quotes ...');

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/quotes',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log(`API Status: ${res.statusCode}`);
                console.log('API Response Body:');
                console.log(data);
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
        });

        req.end();

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // await prisma.$disconnect(); // Keep open for async http callback? No, wait.
        // We should wait for http to finish. But for simple script, let's just wait a bit or not disconnect immediately.
        setTimeout(() => prisma.$disconnect(), 3000);
    }
}

main();
