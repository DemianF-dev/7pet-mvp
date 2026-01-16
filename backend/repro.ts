
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function repro() {
    try {
        console.log('Starting Repro...');
        const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!user) { console.log('No admin user found'); return; }

        const customerData = {
            name: 'Repro Test',
            email: 'repro_' + Date.now() + '@test.com',
            phone: '123456789',
            address: 'Test Street, 123',
            type: 'AVULSO'
        };

        const petData = { name: 'Repro Pet', species: 'Canino' };
        const quoteData = { type: 'SPA', items: [{ description: 'Test', quantity: 1, price: 50 }] };

        await prisma.$transaction(async (tx: any) => {
            console.log('In transaction...');

            // 1. registerManual simulation
            let dbUser = await tx.user.findUnique({ where: { email: customerData.email }, include: { customer: true } });
            if (!dbUser) {
                console.log('Creating user...');
                dbUser = await tx.user.create({
                    data: {
                        email: customerData.email,
                        passwordHash: "TEMPORARY",
                        role: 'CLIENTE',
                        division: 'CLIENTE',
                        name: customerData.name,
                        phone: customerData.phone,
                        address: customerData.address,
                        customer: {
                            create: {
                                name: customerData.name,
                                phone: customerData.phone,
                                address: customerData.address,
                                type: customerData.type || 'AVULSO'
                            }
                        }
                    },
                    include: { customer: true }
                });
            }

            console.log('User created/found:', dbUser.id);
            const customerId = dbUser.customer.id;

            // Pet
            const dbPet = await tx.pet.create({
                data: {
                    customerId,
                    name: petData.name,
                    species: petData.species
                }
            });
            console.log('Pet created:', dbPet.id);

            // Quote
            const quote = await tx.quote.create({
                data: {
                    customerId,
                    petId: dbPet.id,
                    type: 'SPA',
                    status: 'SOLICITADO',
                    totalAmount: 50,
                    statusHistory: {
                        create: {
                            oldStatus: 'NONE',
                            newStatus: 'SOLICITADO',
                            changedBy: user.id,
                            reason: 'Test'
                        }
                    },
                    items: {
                        create: [{ description: 'Test', quantity: 1, price: 50 }]
                    }
                }
            });
            console.log('Quote created:', quote.id);
        });

        console.log('FINISHED SUCCESS');
    } catch (error: any) {
        console.error('REPRO FAILED:', error);
        if (error.code) console.error('Error Code:', error.code);
        if (error.meta) console.error('Error Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

repro();
