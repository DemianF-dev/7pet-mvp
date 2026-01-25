import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Controller for notification settings management (MASTER only)
 */

export const getGlobalSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.notificationSettings.findMany({
            orderBy: { notificationType: 'asc' }
        });

        res.json(settings);
    } catch (error) {
        Logger.error('[NotifController] Error fetching global settings:', error);
        res.status(500).json({ error: (error as Error).message || 'Erro ao buscar configurações' });
    }
};

export const updateGlobalSettings = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;
        const { enabled, frequency, allowedRoles, minInterval } = req.body;
        const userId = (req as any).user.id;

        const updated = await prisma.notificationSettings.upsert({
            where: { notificationType: type },
            update: {
                enabled,
                frequency,
                allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : undefined,
                minInterval,
                updatedBy: userId
            },
            create: {
                notificationType: type,
                enabled: enabled !== undefined ? enabled : true,
                frequency: frequency || 'IMMEDIATE',
                allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : '[]',
                minInterval: minInterval || 0,
                updatedBy: userId
            }
        });

        Logger.info(`[NotifController] Updated settings for ${type} by user ${userId}`);
        res.json(updated);
    } catch (error) {
        Logger.error('[NotifController] Error updating global settings:', error);
        res.status(500).json({ error: 'Erro ao atualizar configurações' });
    }
};

export const getUserPreferences = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const preferences = await prisma.userNotificationPreference.findMany({
            where: { userId },
            orderBy: { notificationType: 'asc' }
        });

        // Include global settings for context
        const globalSettings = await prisma.notificationSettings.findMany({
            orderBy: { notificationType: 'asc' }
        });

        res.json({
            preferences,
            globalSettings
        });
    } catch (error) {
        Logger.error('[NotifController] Error fetching user preferences:', error);
        res.status(500).json({ error: 'Erro ao buscar preferências' });
    }
};

export const updateUserPreference = async (req: Request, res: Response) => {
    try {
        const { userId, type } = req.params;
        const { enabled, channels } = req.body;

        const updated = await prisma.userNotificationPreference.upsert({
            where: {
                userId_notificationType: {
                    userId,
                    notificationType: type
                }
            },
            create: {
                id: randomUUID(),
                userId,
                notificationType: type,
                enabled,
                channels: channels ? JSON.stringify(channels) : undefined,
                updatedAt: new Date()
            },
            update: {
                enabled,
                channels: channels ? JSON.stringify(channels) : undefined,
                updatedAt: new Date()
            }
        });

        Logger.info(`[NotifController] Updated preference for user ${userId}, type ${type}`);
        res.json(updated);
    } catch (error) {
        Logger.error('[NotifController] Error updating user preference:', error);
        res.status(500).json({ error: 'Erro ao atualizar preferência' });
    }
};

export const bulkUpdateUserPreferences = async (req: Request, res: Response) => {
    try {
        const { updates } = req.body; // Array of { userId, notificationType, enabled, channels }

        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Updates deve ser um array' });
        }

        const results = [];

        for (const update of updates) {
            const { userId, notificationType, enabled, channels } = update;

            const result = await prisma.userNotificationPreference.upsert({
                where: {
                    userId_notificationType: {
                        userId,
                        notificationType
                    }
                },
                create: {
                    id: randomUUID(),
                    userId,
                    notificationType,
                    enabled,
                    channels: channels ? JSON.stringify(channels) : JSON.stringify(['IN_APP', 'PUSH']),
                    updatedAt: new Date()
                },
                update: {
                    enabled,
                    channels: channels ? JSON.stringify(channels) : undefined,
                    updatedAt: new Date()
                }
            });

            results.push(result);
        }

        Logger.info(`[NotifController] Bulk updated ${results.length} preferences`);
        res.json({
            success: true,
            updated: results.length,
            results
        });
    } catch (error) {
        Logger.error('[NotifController] Error in bulk update:', error);
        res.status(500).json({ error: 'Erro ao atualizar preferências em massa' });
    }
};

export const getNotificationStats = async (req: Request, res: Response) => {
    try {
        const { days = 7 } = req.query;
        const daysNum = parseInt(days as string);

        const since = new Date();
        since.setDate(since.getDate() - daysNum);

        // Count notifications by type
        const notifications = await prisma.notification.findMany({
            where: {
                createdAt: { gte: since }
            },
            select: {
                type: true,
                read: true
            }
        });

        const statsByType: Record<string, { sent: number; read: number }> = {};

        notifications.forEach(n => {
            if (!statsByType[n.type]) {
                statsByType[n.type] = { sent: 0, read: 0 };
            }
            statsByType[n.type].sent++;
            if (n.read) {
                statsByType[n.type].read++;
            }
        });

        // Get users with disabled notifications count
        const allUsers = await prisma.user.count({
            where: { deletedAt: null, active: true }
        });

        const disabledPrefsCount = await prisma.userNotificationPreference.count({
            where: { enabled: false }
        });

        res.json({
            period: `${daysNum} days`,
            totalSent: notifications.length,
            totalRead: notifications.filter(n => n.read).length,
            statsByType,
            totalActiveUsers: allUsers,
            totalDisabledPreferences: disabledPrefsCount
        });
    } catch (error) {
        Logger.error('[NotifController] Error getting stats:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
};

export const getAllUsersWithPreferences = async (req: Request, res: Response) => {
    try {
        const { role, division, search, page = '1', limit = '30' } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where = {
            deletedAt: null,
            active: true,
            ...(role ? { role: role as string } : {}),
            ...(division ? { division: division as string } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search as string, mode: Prisma.QueryMode.insensitive } }
                ]
            } : {})
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    division: true,
                    notificationPreferences: {
                        select: {
                            notificationType: true,
                            enabled: true,
                            channels: true
                        }
                    }
                },
                orderBy: [
                    { role: 'asc' },
                    { name: 'asc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        Logger.error('[NotifController] Error fetching users with preferences:', error);
        res.status(500).json({ error: (error as Error).message || 'Erro ao buscar usuários' });
    }
};

