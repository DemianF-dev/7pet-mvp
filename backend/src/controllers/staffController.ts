import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, QuoteStatus } from '@prisma/client';

export const staffController = {
    async getDashboardMetrics(req: Request, res: Response) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // 1. Today's appointments (already good)
            const todayAppointments = await prisma.appointment.count({
                where: {
                    startAt: {
                        gte: today,
                        lt: tomorrow
                    },
                    status: {
                        notIn: ['CANCELADO', 'NO_SHOW']
                    },
                    deletedAt: null
                }
            });

            // 2. NEW Quotes only (just SOLICITADO - fresh incoming)
            const newQuotes = await prisma.quote.count({
                where: {
                    status: 'SOLICITADO',
                    deletedAt: null
                }
            });

            // 2b. Support Tickets (New & Pending)
            const newTicketsCount = await prisma.bugReport.count({
                where: { status: 'SOLICITADO' }
            });

            const pendingTicketsCount = await prisma.bugReport.count({
                where: { status: 'EM_ANDAMENTO' }
            });

            // 3. Today's Transports only (not all active)
            const todayTransports = await prisma.transportDetails.count({
                where: {
                    appointment: {
                        startAt: {
                            gte: today,
                            lt: tomorrow
                        },
                        deletedAt: null
                    },
                    status: {
                        notIn: ['ENTREGUE', 'CANCELADO', 'CONCLUIDO']
                    }
                }
            });

            // 4. Overdue items needing attention
            const threeDaysAgo = new Date(today);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            // Quotes sent but no response in 3+ days
            const overdueQuotes = await prisma.quote.count({
                where: {
                    status: 'ENVIADO',
                    updatedAt: { lt: threeDaysAgo },
                    deletedAt: null
                }
            });

            // Appointments coming soon but not confirmed
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const unconfirmedSoon = await prisma.appointment.count({
                where: {
                    startAt: {
                        gte: today,
                        lt: nextWeek
                    },
                    status: 'PENDENTE',
                    deletedAt: null
                }
            });

            const overdueItems = overdueQuotes + unconfirmedSoon;

            // 5. Appointments by status for Kanban (next 7 days)
            const statusCounts = await prisma.appointment.groupBy({
                by: ['status'],
                where: {
                    startAt: {
                        gte: today,
                        lt: nextWeek
                    },
                    deletedAt: null
                },
                _count: true
            });

            // Map Prisma groupBy result to ensure _count is a number for the frontend
            const safeStatusCounts = statusCounts.map(item => ({
                status: item.status,
                // @ts-ignore - Prisma types can be tricky with groupBy
                _count: typeof item._count === 'number' ? item._count : (item._count as any)?._all || 0
            }));

            return res.json({
                todayAppointments,
                newQuotes,
                todayTransports,
                overdueItems,
                statusCounts: safeStatusCounts,
                newTickets: newTicketsCount,
                pendingTickets: pendingTicketsCount
            });
        } catch (error) {
            console.error('Error fetching staff metrics:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async listTransports(req: Request, res: Response) {
        try {
            const transports = await prisma.transportDetails.findMany({
                include: {
                    appointment: {
                        include: {
                            pet: true,
                            customer: true
                        }
                    }
                },
                orderBy: {
                    appointment: {
                        startAt: 'asc'
                    }
                }
            });
            return res.json(transports);
        } catch (error) {
            console.error('Error listing transports:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
