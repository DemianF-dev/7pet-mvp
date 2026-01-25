import request from 'supertest';
import app from '../index';
import { prismaMock } from '../lib/prismaMock';
import * as authService from '../services/authService';

jest.mock('../middlewares/authMiddleware', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'staff-1', role: 'ADMIN' };
        next();
    }
}));

describe('Manual Quote Creation', () => {
    it('should create a manual quote with new customer and pet', async () => {
        const payload = {
            customer: {
                name: 'Manual Test',
                email: 'manual@test.com',
                phone: '123456789',
                address: 'Test Street'
            },
            pet: {
                name: 'Manual Pet',
                species: 'Canino'
            },
            quote: {
                type: 'SPA',
                items: [
                    { description: 'Service 1', quantity: 1, price: 100 }
                ]
            }
        };

        // Mock Transaction
        prismaMock.$transaction.mockImplementation(async (callback: any) => {
            return callback(prismaMock);
        });

        // Mock User Find (No existing user)
        prismaMock.user.findUnique.mockResolvedValue(null);

        // Mock User Create
        prismaMock.user.create.mockResolvedValue({
            id: 'user-1',
            email: payload.customer.email,
            seqId: 1001,
            customer: { id: 'cust-1' }
        } as any);

        // Mock User Update (Password)
        prismaMock.user.update.mockResolvedValue({
            id: 'user-1',
            customer: { id: 'cust-1' }
        } as any);

        // Mock Pet Create
        prismaMock.pet.create.mockResolvedValue({
            id: 'pet-1',
            name: payload.pet.name
        } as any);

        // Mock Quote Create
        prismaMock.quote.create.mockResolvedValue({
            id: 'quote-1',
            totalAmount: 100,
            customer: { name: 'Manual Test' },
            pet: { name: 'Manual Pet' },
            items: [{ description: 'Service 1', price: 100, quantity: 1 }]
        } as any);

        const res = await request(app)
            .post('/quotes/manual')
            .send(payload)
            // Need a staff token here, but for unit tests we usually mock the auth middleware or user role
            .set('Authorization', 'Bearer fake-staff-token');

        expect(res.statusCode).toEqual(201);
        expect(res.body.id).toEqual('quote-1');
        expect(prismaMock.quote.create).toHaveBeenCalled();
    });
});
