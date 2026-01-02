
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar notificação' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar notificações' });
    }
};

export const resolveNotification = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        // Get notification details
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        // Update notification as resolved
        await prisma.notification.update({
            where: { id },
            data: {
                resolved: true,
                resolvedAt: new Date(),
                resolvedBy: userId,
                read: true
            }
        });

        // If it's a recurrence request, add to customer log
        if (notification.type === 'RECURRENCE_REQUEST' && notification.relatedId) {
            const customer = await prisma.customer.findUnique({
                where: { id: notification.relatedId }
            });

            if (customer) {
                const currentNotes = customer.internalNotes || '';
                const resolverUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true }
                });
                const resolverName = resolverUser
                    ? `${resolverUser.firstName || ''} ${resolverUser.lastName || ''}`.trim()
                    : 'Equipe';

                const newNote = `\n[${new Date().toLocaleString('pt-BR')}] Solicitação de recorrência tratada por ${resolverName}.`;

                await prisma.customer.update({
                    where: { id: notification.relatedId },
                    data: {
                        internalNotes: currentNotes + newNote
                    }
                });
            }
        }

        res.json({ success: true, message: 'Solicitação marcada como resolvida' });
    } catch (error) {
        console.error('Erro ao resolver notificação:', error);
        res.status(500).json({ error: 'Erro ao resolver notificação' });
    }
};
