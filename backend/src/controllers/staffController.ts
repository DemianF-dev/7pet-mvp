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
    },

    async getFeedWidgets(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const today = new Date();

            // 1. Next Appointments (Events)
            const nextAppointments = await prisma.appointment.findMany({
                where: {
                    performerId: userId,
                    startAt: { gte: today },
                    status: { notIn: ['CANCELADO', 'FINALIZADO'] },
                    deletedAt: null
                },
                orderBy: { startAt: 'asc' },
                take: 5,
                select: {
                    id: true,
                    startAt: true,
                    status: true,
                    pet: { select: { name: true } },
                    customer: { select: { name: true } },
                    services: { select: { name: true } }
                }
            });

            // 2. My Tasks (Status Counts)
            const statusCounts = await prisma.appointment.groupBy({
                by: ['status'],
                where: {
                    performerId: userId,
                    deletedAt: null,
                    // Active statuses only? Bitrix shows "Em andamento", "Auxiliando", etc.
                    // We'll return all and filter on frontend
                },
                _count: true
            });

            // 3. Popular Posts (Mock logic for now as Relation Count Sort can be tricky depending on Prisma version)
            // We'll fetch recent posts and sort by reaction count in memory for MVP simplicity
            const recentPosts = await prisma.post.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    author: { select: { name: true } },
                    reactions: true,
                    _count: { select: { comments: true } }
                }
            });

            const popularPosts = recentPosts
                .sort((a, b) => b.reactions.length - a.reactions.length)
                .slice(0, 3);

            return res.json({
                nextAppointments,
                myTasks: statusCounts.map(s => ({ status: s.status, count: s._count })),
                popularPosts
            });

        } catch (error) {
            console.error('Error fetching feed widgets:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
