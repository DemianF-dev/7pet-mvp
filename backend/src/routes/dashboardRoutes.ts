import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';

const router = Router();


router.get('/client', authenticate, async (req: any, res) => {
    try {
        console.log(`[DASHBOARD_DEBUG] Accessing client dashboard for User: ${req.user.id} (${req.user.email})`);

        if (!req.user.customer) {
            console.error(`[DASHBOARD_DEBUG] User ${req.user.email} has NO customer record linked!`);
            return res.status(400).json({ error: 'Perfil de cliente incompleto.' });
        }

        const customerId = req.user.customer.id;
        console.log(`[DASHBOARD_DEBUG] Associated Customer ID: ${customerId}`);

        const [petCount, nextAppointment, recentQuotes] = await Promise.all([
            prisma.pet.count({ where: { customerId } }),
            prisma.appointment.findFirst({
                where: {
                    customerId,
                    startAt: { gte: new Date() },
                    status: { notIn: ['CANCELADO', 'NO_SHOW'] }
                },
                orderBy: { startAt: 'asc' },
                include: { pet: true }
            }),
            prisma.quote.findMany({
                where: { customerId },
                orderBy: { createdAt: 'desc' },
                take: 3
            })
        ]);

        console.log(`[DASHBOARD_DEBUG] Found: ${petCount} pets, Next Appt: ${nextAppointment ? 'Yes' : 'No'}, Quotes: ${recentQuotes.length}`);

        res.json({
            petCount,
            nextAppointment,
            recentQuotes
        });
    } catch (error: any) {
        console.error(`[DASHBOARD_DEBUG] Error:`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
