
import prisma from './lib/prisma';
import * as appointmentService from './services/appointmentService';

async function measure() {
    console.log('--- STARTING PERFORMANCE MEASUREMENT ---');
    const start = Date.now();
    try {
        const results = await appointmentService.list({}, { take: 20 });
        const end = Date.now();
        console.log(`✅ [Service.list] Duration: ${end - start}ms`);
        console.log(`📦 Got ${results.length} items`);

        const startRaw = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const endRaw = Date.now();
        console.log(`⚡ [DB Ping] Latency: ${endRaw - startRaw}ms`);

        const startDirect = Date.now();
        await prisma.appointment.findMany({ where: { deletedAt: null }, take: 20 });
        const endDirect = Date.now();
        console.log(`🔍 [Prisma Simple findMany] Duration: ${endDirect - startDirect}ms`);

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

measure();
