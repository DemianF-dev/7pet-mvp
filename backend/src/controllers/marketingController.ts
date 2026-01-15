import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createNotification } from './notificationController';
import Logger from '../lib/logger';

/**
 * 📣 Marketing & Bulk Notifications Controller
 */
export const sendBulkNotification = async (req: Request, res: Response) => {
    try {
        const {
            targetType, // 'ALL', 'CLIENTS', 'ROLES', 'USERS'
            targetRoles, // string[]
            targetUserIds, // string[]
            title,
            body,
            type = 'marketing',
            url,
            priority = 'LOW'
        } = req.body;

        const senderId = (req as any).user.id;

        if (!title || !body) {
            return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
        }

        // 1. Identify Target Users
        let targetIds: string[] = [];

        if (targetType === 'ALL') {
            const users = await prisma.user.findMany({
                where: { active: true, deletedAt: null },
                select: { id: true }
            });
            targetIds = users.map(u => u.id);
        } else if (targetType === 'CLIENTS') {
            const users = await prisma.user.findMany({
                where: { active: true, deletedAt: null, division: 'CLIENTE' },
                select: { id: true }
            });
            targetIds = users.map(u => u.id);
        } else if (targetType === 'ROLES' && targetRoles?.length > 0) {
            const users = await prisma.user.findMany({
                where: { active: true, deletedAt: null, role: { in: targetRoles } },
                select: { id: true }
            });
            targetIds = users.map(u => u.id);
        } else if (targetType === 'USERS' && targetUserIds?.length > 0) {
            targetIds = targetUserIds;
        }

        if (targetIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum usuário destinatário encontrado com os filtros selecionados' });
        }

        // 2. Audit the action
        await prisma.auditLog.create({
            data: {
                entityType: 'MARKETING_BULK',
                entityId: 'SYSTEM',
                action: 'SEND_BULK_NOTIFICATION',
                performedBy: senderId,
                newData: { targetType, targetRoles, targetIdsCount: targetIds.length, title }
            }
        });

        // 3. Batch Send (Parallelized but controlled)
        // Note: For very large sets (>10k), a Queue system (BullMQ) would be better.
        // For MVP, we use Promise.all with chunks or simple parallel execution.
        const sendPromises = targetIds.map(userId =>
            createNotification(userId, {
                title,
                body,
                type,
                data: { url, senderId, isBulk: true },
                priority
            })
        );

        // Splitting into chunks to avoid database connection exhaustion if set is huge
        const chunkSize = 50;
        let successCount = 0;
        for (let i = 0; i < targetIds.length; i += chunkSize) {
            const chunk = sendPromises.slice(i, i + chunkSize);
            await Promise.all(chunk);
            successCount += chunk.length;
            Logger.info(`[BulkNotif] Sent ${successCount}/${targetIds.length} notifications`);
        }

        res.json({
            success: true,
            message: `Notificações enviadas com sucesso para ${targetIds.length} usuários.`,
            recipientCount: targetIds.length
        });

    } catch (error) {
        Logger.error('❌ Erro ao enviar notificação em massa:', error);
        res.status(500).json({ error: 'Erro interno ao processar envio em massa' });
    }
};

/**
 * 📋 Get available roles for the filter UI
 */
export const getAvailableRoles = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.user.findMany({
            where: { role: { not: null } },
            distinct: ['role'],
            select: { role: true }
        });

        const roleList = roles.map(r => r.role).filter(Boolean);
        res.json(roleList);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar cargos' });
    }
};
