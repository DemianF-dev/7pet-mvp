import request from 'supertest';
import app from '../index';
import { prismaMock } from '../lib/prismaMock';
import bcrypt from 'bcryptjs';

describe('Auth Endpoints', () => {

    describe('POST /auth/register', () => {
        it('should register a new client user', async () => {
            const userData = {
                name: 'Test Client',
                firstName: 'Test',
                lastName: 'Client',
                email: 'client@test.com',
                password: 'password123',
                role: 'CLIENTE',
                phone: '11999999999'
            };

            // Mock existing user check -> null (no user)
            prismaMock.user.findUnique.mockResolvedValue(null);

            // Mock user creation
            prismaMock.user.create.mockResolvedValue({
                id: 'user-id-123',
                email: userData.email,
                name: userData.name,
                role: userData.role,
                phone: userData.phone,
                passwordHash: 'hashed-password',
                createdAt: new Date(),
                updatedAt: new Date(),
                notes: null,
                permissions: '[]',
                staffId: null,
                firstName: userData.firstName,
                lastName: userData.lastName,
                admissionDate: null,
                birthday: null,
                document: null,
                address: null,
                color: null,
                deletedAt: null,
                extraAddresses: [],
                extraEmails: [],
                extraPhones: [],
                googleId: null,
                seqId: 1,
                showTutorial: true
            } as any);

            // Mock Customer creation
            prismaMock.customer.create.mockResolvedValue({
                id: 'customer-id-123',
                userId: 'user-id-123',
                name: userData.name,
                phone: userData.phone,
                createdAt: new Date(),
                updatedAt: new Date(),
                type: 'NORMAL',
                isBlocked: false,
                internalNotes: null,
                address: null,
                secondaryGuardianName: null,
                secondaryGuardianPhone: null,
                secondaryGuardianEmail: null,
                secondaryGuardianAddress: null,
                deletedAt: null,
                noShowCount: 0,
                requiresPrepayment: false,
                recurringFrequency: null,
                discountPercentage: 0,
                balance: 0,
                additionalGuardians: [],
                communicationOther: {},
                communicationPrefs: [],
                discoverySource: null,
                recurrenceDiscount: null,
                recurrenceFrequency: null
            } as any);

            const res = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('token');
            expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: userData.email
                })
            }));
        });

        it('should reject registration if email already exists', async () => {
            // Mock existing user found
            prismaMock.user.findUnique.mockResolvedValue({
                id: 'existing-id',
                email: 'client@test.com'
            } as any);

            const res = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Duplicate',
                    firstName: 'Dup',
                    lastName: 'licate',
                    email: 'client@test.com',
                    password: 'password123', // Correct length
                    phone: '123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'O usuário já existe');
        });
    });

    describe('POST /auth/login', () => {
        it('should login with correct credentials', async () => {
            const password = 'password123';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                id: 'user-id-123',
                email: 'login@test.com',
                passwordHash: hashedPassword,
                role: 'CLIENTE',
                name: 'Login User'
            };

            // authService.login uses findFirst
            prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@test.com',
                    password: password
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toEqual(mockUser.email);
        });

        it('should reject login with wrong password', async () => {
            const password = 'password123';
            const hashedPassword = await bcrypt.hash(password, 10);

            const mockUser = {
                id: 'user-id-123',
                email: 'login@test.com',
                passwordHash: hashedPassword,
                role: 'CLIENTE'
            };

            prismaMock.user.findFirst.mockResolvedValue(mockUser as any);

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'WRONG_PASSWORD'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('error', 'Credenciais inválidas');
        });
    });
});
