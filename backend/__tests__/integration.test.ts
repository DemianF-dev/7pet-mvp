import request from 'supertest';
import app from '../src/index';

describe('Health & Auth Endpoints', () => {
    describe('GET /health', () => {
        it('should return 200 and ok status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('serverTime');
        });
    });

    describe('GET /ping', () => {
        it('should return 200 and pong message', async () => {
            const response = await request(app).get('/ping');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('message', 'pong');
        });
    });

    describe('GET /auth/diag', () => {
        it('should result in 401 without token', async () => {
            const response = await request(app).get('/dev/diag'); // Changed to /dev/diag as per index.ts (though index.ts said /diag but exported app.use('/dev', devRoutes)?) 
            // Wait, index.ts line 230 has app.get('/diag', ...)
            const response2 = await request(app).get('/diag');
            expect(response2.status).toBe(401);
        });
    });

    describe('POST /auth/login (fail case)', () => {
        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /heartbeat', () => {
        it('should return 200 and live status', async () => {
            const response = await request(app).get('/heartbeat');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'live');
        });
    });

    afterAll(async () => {
        const prisma = (await import('../src/lib/prisma')).default;
        await prisma.$disconnect();
    });
});
