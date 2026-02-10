import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import prisma from '../src/lib/prisma'; // Use shared instance

const TEST_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Transport Refinements Integration', () => {
    let token: string;
    let userId: string;
    let customerId: string;
    let petId: string;
    let quoteId: string;

    beforeAll(async () => {
        // 1. Create Staff User
        const staffUser = await prisma.user.create({
            data: {
                name: 'Transport Tester',
                email: `transport-tester-${Date.now()}@example.com`,
                passwordHash: 'hashed-password',
                role: 'ADMIN',
                active: true,
                division: 'Veterinária'
            }
        });
        userId = staffUser.id;
        token = jwt.sign({ userId: staffUser.id, role: staffUser.role }, TEST_SECRET, { expiresIn: '1h' });

        // 2 Create User for Customer (since Customer likely requires userId)
        const customerUser = await prisma.user.create({
            data: {
                name: 'Transport Customer User',
                email: `transport-customer-${Date.now()}@example.com`,
                passwordHash: 'hashed-password',
                role: 'CLIENTE',
                active: true
            }
        });

        // 3. Create Customer
        const customer = await prisma.customer.create({
            data: {
                userId: customerUser.id,
                name: 'Transport Customer',
                phone: '11988887777',

            }
        });
        customerId = customer.id;

        // 4. Create Pet
        const pet = await prisma.pet.create({
            data: {
                name: 'Transport Pet',
                species: 'Gato',
                breed: 'Siamês',
                customerId: customer.id
            }
        });
        petId = pet.id;
    });

    afterAll(async () => {
        if (quoteId) await prisma.quote.deleteMany({ where: { id: quoteId } });
        await prisma.routePreset.deleteMany({ where: { customerId } });
        await prisma.invoice.deleteMany({ where: { customerId } });
        await prisma.appointment.deleteMany({ where: { customerId } });
        await prisma.pet.delete({ where: { id: petId } });
        await prisma.customer.delete({ where: { id: customerId } });
        // Ensure no customers still reference our users, then delete users
        const extraUser = await prisma.user.findFirst({ where: { email: { contains: 'transport-customer' } } });
        const userIds = [userId, extraUser?.id].filter(Boolean) as string[];
        if (userIds.length > 0) {
            const customers = await prisma.customer.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
            const customerIds = customers.map(c => c.id);
            if (customerIds.length > 0) {
                await prisma.routePreset.deleteMany({ where: { customerId: { in: customerIds } } });
                await prisma.invoice.deleteMany({ where: { customerId: { in: customerIds } } });
                await prisma.appointment.deleteMany({ where: { customerId: { in: customerIds } } });
                await prisma.pet.deleteMany({ where: { customerId: { in: customerIds } } });
                await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
            }
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
        await prisma.$disconnect();
    });

    it('should save Route Preset with routeJson', async () => {
        const stops = [{ address: 'Escola', order: 1, type: 'STOP' }];
        const response = await request(app)
            .post('/quotes/transport/presets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerId,
                petId,
                name: 'Rota Escola',
                type: 'ROUND_TRIP',
                origin: 'Casa',
                destination: '7Pet',
                stops
            });

        expect(response.status).toBe(201);
        expect(response.body.routeJson).toBeDefined();
        expect(response.body.routeJson.stops).toHaveLength(1);
        expect(response.body.version).toBe(1);
    });

    it('should create a TRANSPORT_ONLY quote', async () => {
        const response = await request(app)
            .post('/quotes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerId,
                petId,
                type: 'TRANSPORTE',
                transportType: 'ROUND_TRIP',
                items: []
            });

        expect(response.status).toBe(201);
        quoteId = response.body.id;
    });

    it('should implement Idempotency in Scheduling (Prevent Duplicates)', async () => {
        // 1. Define Occurrences
        const occurrences = [
            {
                levaAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                levaDriverId: userId, // Using user as driver for simplicity (if schema allows relation not checked strictly) - actually schema links to User usually
                trazAt: new Date(Date.now() + 86400000 + 3600000).toISOString(),
                trazDriverId: userId
            }
        ];

        // Ensure user is also a performer? Usually Staff is fine.
        // If performer relation is to 'User', we are good.

        // 2. First Schedule Call
        const res1 = await request(app)
            .post(`/quotes/${quoteId}/schedule`)
            .set('Authorization', `Bearer ${token}`)
            .send({ occurrences });

        expect(res1.status).toBe(200);

        // Verify Appointments Created
        const appointments1 = await prisma.appointment.findMany({
            where: { quoteId, category: 'LOGISTICA' }
        });
        expect(appointments1.length).toBeGreaterThanOrEqual(2); // Leva + Traz

        // 3. Second Schedule Call (Duplicate)
        const res2 = await request(app)
            .post(`/quotes/${quoteId}/schedule`)
            .set('Authorization', `Bearer ${token}`)
            .send({ occurrences });

        expect(res2.status).toBe(200); // Should succeed (idempotent)

        // Verify Appointments Count did NOT increase
        const appointments2 = await prisma.appointment.findMany({
            where: { quoteId, category: 'LOGISTICA' }
        });
        expect(appointments2.length).toBe(appointments1.length);
    });
});
