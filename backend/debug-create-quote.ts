
import { PrismaClient } from '@prisma/client';
import { quoteController } from './src/controllers/quoteController';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

async function debugCreateQuote() {
    try {
        console.log('Fetching a valid customer...');
        const customer = await prisma.customer.findFirst();
        if (!customer) {
            console.error('No customer found!');
            return;
        }
        console.log(`Found customer: ${customer.name} (${customer.id})`);

        const user = await prisma.user.findFirst({
            where: { customerId: customer.id }
        });

        if (!user) {
            console.error('No user found for customer!');
            return;
        }
        console.log(`Found user: ${user.name} (${user.id})`);

        const req = {
            body: {
                type: 'SPA',
                items: [],
                saveAsDraft: true,
                petQuantity: 1,
                hasKnots: false,
                hasParasites: false,
                wantsMedicatedBath: false,
                hairLength: 'curto'
            },
            user: {
                id: user.id,
                role: 'CLIENTE',
                customer: { id: customer.id }
            }
        } as unknown as Request;

        const res = {
            status: (code: number) => {
                console.log(`Response Status: ${code}`);
                return res;
            },
            json: (data: any) => {
                console.log('Response JSON:', JSON.stringify(data, null, 2));
                return res;
            }
        } as unknown as Response;

        console.log('Calling quoteController.create...');
        await quoteController.create(req, res);

    } catch (error) {
        console.error('Debug script error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCreateQuote();
