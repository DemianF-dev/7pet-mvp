
import prisma from './lib/prisma';

async function measure() {
    console.log('--- STARTING SUPER OPTIMIZED PERFORMANCE MEASUREMENT (JOIN STRATEGY) ---');
    const start = Date.now();
    try {
        const results = await (prisma.appointment as any).findMany({
            relationLoadStrategy: 'join', // Using Prisma 6 Join strategy
            where: { deletedAt: null },
            take: 20,
            include: {
                pet: {
                    select: { name: true, species: true, breed: true }
                },
                customer: {
                    select: { name: true, phone: true, type: true, user: { select: { email: true } } }
                },
                services: {
                    select: { id: true, name: true, basePrice: true, duration: true }
                },
                transport: true,
                performer: {
                    select: { id: true, name: true, color: true }
                },
                quote: {
                    select: {
                        appointments: {
                            where: { deletedAt: null },
                            select: { id: true, category: true, transport: { select: { type: true } } }
                        }
                    }
                }
            }
        });
        const end = Date.now();
        console.log(`🚀 [Super Optimized Query - JOIN] Duration: ${end - start}ms`);
        console.log(`📦 Got ${results.length} items`);

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

measure();
