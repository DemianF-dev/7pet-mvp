import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';

const router = Router();


router.get('/client', authenticate, async (req: any, res) => {
    try {
        if (!req.user.customer) {
            return res.status(400).json({ error: 'Perfil de cliente incompleto.' });
        }

        const customerId = req.user.customer.id;

        // Optimize queries with selective field selection
        const [petCount, nextAppointment, recentQuotes] = await Promise.all([
            prisma.pet.count({
                where: { customerId }
            }),
            prisma.appointment.findFirst({
                where: {
                    customerId,
                    startAt: { gte: new Date() },
                    status: { notIn: ['CANCELADO', 'NO_SHOW'] }
                },
                orderBy: { startAt: 'asc' },
                select: {
                    id: true,
                    startAt: true,
                    status: true,
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }),
            prisma.quote.findMany({
                where: {
                    customerId
                },
                orderBy: { createdAt: 'desc' },
                take: 3,
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true
                }
            })
        ]);

        res.json({
            petCount,
            nextAppointment,
            recentQuotes
        });
    } catch (error: any) {
        console.error(`[Dashboard Error]:`, error.message);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

export default router;
