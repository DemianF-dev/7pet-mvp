import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, QuoteStatus } from '@prisma/client';

export const staffController = {
    async getDashboardMetrics(req: Request, res: Response) {
        try {
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());

            const startOfMonth = new Date(today);
            startOfMonth.setDate(1);

            const threeDaysAgo = new Date(now);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            console.log('[getDashboardMetrics] Starting basic counts...');
            // 1. Basic Counts
            const [
                todayAppointments,
                newQuotes,
                newTicketsCount,
                pendingTicketsCount,
                todayTransports,
                recurrentClients,
                totalClientsServedData,
                totalPetsServedData,
                rejectedQuotes,
                noResponseQuotes,
                todaySpaCount,
                activeSession
            ] = await Promise.all([
                // Today's appointments
                prisma.appointment.count({
                    where: {
                        startAt: { gte: today, lt: tomorrow },
                        status: { notIn: ['CANCELADO', 'NO_SHOW'] },
                        deletedAt: null
                    }
                }),
                // NEW Quotes
                prisma.quote.count({
                    where: { status: 'SOLICITADO' as any, deletedAt: null }
                }),
                // Support Tickets
                prisma.bugReport.count({ where: { status: 'SOLICITADO' } }),
                prisma.bugReport.count({ where: { status: 'EM_ANDAMENTO' } }),
                // Today's Transports
                prisma.transportDetails.count({
                    where: {
                        appointment: {
                            startAt: { gte: today, lt: tomorrow },
                            deletedAt: null
                        },
                        status: { notIn: ['CANCELADO'] }
                    }
                }),
                // Recurrent Clients
                prisma.customer.count({
                    where: { type: 'RECORRENTE', deletedAt: null }
                }),
                // Total Clients Served (Active)
                prisma.appointment.groupBy({
                    by: ['customerId'],
                    where: {
                        status: 'FINALIZADO' as any,
                        deletedAt: null
                    }
                }),
                // Total Pets Served
                prisma.appointment.groupBy({
                    by: ['petId'],
                    where: {
                        status: 'FINALIZADO' as any,
                        deletedAt: null
                    }
                }),
                // Rejected Quotes
                prisma.quote.count({
                    where: { status: 'REJEITADO' as any, deletedAt: null }
                }),
                // Quotes Sent with No Response (3+ days)
                prisma.quote.count({
                    where: {
                        status: 'ENVIADO' as any,
                        updatedAt: { lt: threeDaysAgo },
                        deletedAt: null
                    }
                }),
                // Today's SPA services
                prisma.appointment.count({
                    where: {
                        startAt: { gte: today, lt: tomorrow },
                        category: 'SPA' as any,
                        status: { notIn: ['CANCELADO', 'NO_SHOW'] },
                        deletedAt: null
                    }
                }),
                // POS Status
                prisma.cashSession.findFirst({
                    where: { status: 'OPEN' as any }
                })
            ]);
            console.log('[getDashboardMetrics] Basic counts finished');

            console.log('[getDashboardMetrics] Starting revenue counts...');
            // 2. Revenue (Faturamento)
            // Note: Using Invoice as the source of truth for revenue
            const [revenueDay, revenueWeek, revenueMonth] = await Promise.all([
                prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: {
                        createdAt: { gte: today, lt: tomorrow },
                        // FIX: status 'CANCELADO' does not exist in InvoiceStatus enum
                        // status: { not: 'CANCELADO' }, 
                        deletedAt: null
                    }
                }),
                prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: {
                        createdAt: { gte: startOfWeek, lt: tomorrow },
                        // status: { not: 'CANCELADO' },
                        deletedAt: null
                    }
                }),
                prisma.invoice.aggregate({
                    _sum: { amount: true },
                    where: {
                        createdAt: { gte: startOfMonth, lt: tomorrow },
                        // status: { not: 'CANCELADO' },
                        deletedAt: null
                    }
                })
            ]);
            console.log('[getDashboardMetrics] Revenue counts finished');

            // 3. Overdue items (Legacy logic kept for compatibility)
            const unconfirmedSoon = await prisma.appointment.count({
                where: {
                    startAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    },
                    status: 'PENDENTE',
                    deletedAt: null
                }
            });

            // 4. Status distribution for Kanban (next 7 days)
            const statusCounts = await prisma.appointment.groupBy({
                by: ['status'],
                where: {
                    startAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    },
                    deletedAt: null
                },
                _count: true
            });

            const safeStatusCounts = statusCounts.map(item => ({
                status: item.status,
                // @ts-ignore
                _count: typeof item._count === 'number' ? item._count : (item._count as any)?._all || 0
            }));

            return res.json({
                // Original metrics
                todayAppointments,
                newQuotes,
                todayTransports,
                overdueItems: noResponseQuotes + unconfirmedSoon,
                statusCounts: safeStatusCounts,
                newTickets: newTicketsCount,
                pendingTickets: pendingTicketsCount,

                // New requested metrics
                recurrentClients,
                totalClientsServed: totalClientsServedData.length,
                totalPetsServed: totalPetsServedData.length,
                todaySpaCount,
                rejectedQuotes,
                noResponseQuotes,
                revenue: {
                    day: revenueDay._sum.amount || 0,
                    week: revenueWeek._sum.amount || 0,
                    month: revenueMonth._sum.amount || 0
                },
                posStatus: activeSession ? 'ABERTO' : 'FECHADO'
            });
        } catch (error: any) {
            console.error('Error fetching staff metrics:', error);
            // Return detailed error message if possible to help debugging from frontend
            return res.status(500).json({
                error: (error as Error).message || 'Internal server error',
                details: error
            });
        }
    },

    async listTransports(req: Request, res: Response) {
        try {
            const { status } = req.query;

            const whereClause: any = {};
            if (status) {
                whereClause.status = status;
            }

            const transports = await prisma.transportDetails.findMany({
                where: whereClause,
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
        } catch (error: any) {
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

        } catch (error: any) {
            console.error('Error fetching feed widgets:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateTransportStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            console.log(`[updateTransportStatus] ID: ${id} Status: ${status}`);

            const existing = await prisma.transportDetails.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ error: 'Transporte não encontrado' });

            const updateData: any = { status };
            if (status === 'INICIADO' && !existing.startedAt) {
                updateData.startedAt = new Date();
            }
            if (status === 'CONCLUIDO') {
                updateData.completedAt = new Date();
            }

            const transport = await prisma.transportDetails.update({
                where: { id },
                data: updateData,
                include: {
                    appointment: true
                }
            });

            return res.json(transport);
        } catch (error: any) {
            console.error('Error updating transport status:', error);
            return res.status(500).json({ error: (error as Error).message });
        }
    },

    async logTransportOccurrence(req: Request, res: Response) {
        return res.status(501).json({ error: 'Funcionalidade desabilitada temporariamente devido a limitações de ambiente' });
    },

    async getTransportDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const transport = await prisma.transportDetails.findUnique({
                where: { id },
                include: {
                    appointment: {
                        include: { pet: true, customer: true }
                    }
                }
            });
            if (!transport) return res.status(404).json({ error: 'Não encontrado' });
            return res.json(transport);
        } catch (error: any) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
