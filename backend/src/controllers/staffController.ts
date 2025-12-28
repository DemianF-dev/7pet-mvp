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

            // 1. Today's appointments
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

            // 2. Pending Quotes (Not finalized)
            const pendingQuotes = await prisma.quote.count({
                where: {
                    status: {
                        in: ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'AGENDAR']
                    },
                    deletedAt: null
                }
            });

            // 3. Active Transports (Not Delivered or Cancelled)
            const activeTransports = await prisma.transportDetails.count({
                where: {
                    status: {
                        notIn: ['ENTREGUE', 'CANCELADO', 'CONCLUIDO']
                    },
                    appointment: {
                        deletedAt: null
                    }
                }
            });

            // 4. Appointments by status for Kanban (next 7 days)
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

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
                pendingQuotes,
                activeTransports,
                statusCounts: safeStatusCounts
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
