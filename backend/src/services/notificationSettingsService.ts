import prisma from '../lib/prisma';
import Logger from '../lib/logger';

/**
 * Service for managing notification settings and user preferences
 */

export const notificationSettingsService = {
    /**
     * Check if a user can receive a specific notification type
     */
    async canUserReceiveNotification(userId: string, notificationType: string): Promise<boolean> {
        try {
            // 1. Check global settings
            const globalSetting = await prisma.notificationSettings.findUnique({
                where: { notificationType }
            });

            if (!globalSetting || !globalSetting.enabled || globalSetting.frequency === 'DISABLED') {
                Logger.info(`[NotifSettings] ${notificationType} disabled globally`);
                return false;
            }

            // 2. Check user-specific preference
            const userPref = await prisma.userNotificationPreference.findUnique({
                where: {
                    userId_notificationType: {
                        userId,
                        notificationType
                    }
                }
            });

            if (userPref && !userPref.enabled) {
                Logger.info(`[NotifSettings] ${notificationType} disabled for user ${userId}`);
                return false;
            }

            // 3. Check role-based permissions
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });

            if (!user) return false;

            const allowedRoles = globalSetting.allowedRoles
                ? JSON.parse(globalSetting.allowedRoles as string)
                : [];

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                Logger.info(`[NotifSettings] User role ${user.role} not allowed for ${notificationType}`);
                return false;
            }

            // 4. Check minimum interval (rate limiting)
            if (globalSetting.minInterval > 0) {
                const recentNotif = await prisma.notification.findFirst({
                    where: {
                        userId,
                        type: notificationType,
                        createdAt: {
                            gte: new Date(Date.now() - globalSetting.minInterval * 60 * 1000)
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                if (recentNotif) {
                    Logger.info(`[NotifSettings] ${notificationType} rate-limited for user ${userId}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            Logger.error('[NotifSettings] Error checking notification permission:', error);
            return true; // Fail open - allow notification on error
        }
    },

    /**
     * Get effective frequency for a notification type (considering user overrides)
     */
    async getEffectiveFrequency(userId: string, notificationType: string): Promise<string> {
        const globalSetting = await prisma.notificationSettings.findUnique({
            where: { notificationType }
        });

        return globalSetting?.frequency || 'IMMEDIATE';
    },

    /**
     * Initialize default settings for a new notification type
     */
    async initializeDefaultSettings() {
        const defaultTypes = [
            'APPOINTMENT_REMINDER',
            'QUOTE_UPDATE',
            'CHAT_MESSAGE',
            'DAILY_REVIEW'
        ];

        for (const type of defaultTypes) {
            await prisma.notificationSettings.upsert({
                where: { notificationType: type },
                create: {
                    notificationType: type,
                    enabled: true,
                    frequency: 'IMMEDIATE',
                    allowedRoles: JSON.stringify(['MASTER', 'ADMIN', 'GESTAO', 'OPERACIONAL', 'SPA', 'COMERCIAL', 'CLIENTE']),
                    minInterval: 0
                },
                update: {}
            });
        }

        Logger.info('[NotifSettings] Default settings initialized');
    },

    /**
     * Sync user preferences with global settings
     * Creates missing preferences with default enabled=true
     */
    async syncUserPreferences(userId: string) {
        const globalSettings = await prisma.notificationSettings.findMany();

        for (const setting of globalSettings) {
            await prisma.userNotificationPreference.upsert({
                where: {
                    userId_notificationType: {
                        userId,
                        notificationType: setting.notificationType
                    }
                },
                create: {
                    userId,
                    notificationType: setting.notificationType,
                    enabled: true,
                    channels: JSON.stringify(['IN_APP', 'PUSH'])
                },
                update: {}
            });
        }

        Logger.info(`[NotifSettings] Synced preferences for user ${userId}`);
    },

    /**
     * Get all users who should receive a specific notification type
     */
    async getUsersForNotificationType(notificationType: string, roleFilter?: string[]): Promise<string[]> {
        try {
            const globalSetting = await prisma.notificationSettings.findUnique({
                where: { notificationType }
            });

            if (!globalSetting || !globalSetting.enabled) {
                return [];
            }

            const allowedRoles = globalSetting.allowedRoles
                ? JSON.parse(globalSetting.allowedRoles as string)
                : [];

            // Build role filter
            const roleCondition = roleFilter || (allowedRoles.length > 0 ? allowedRoles : undefined);

            // Find users with the allowed roles
            const users = await prisma.user.findMany({
                where: {
                    deletedAt: null,
                    active: true,
                    ...(roleCondition ? { role: { in: roleCondition } } : {})
                },
                select: { id: true }
            });

            // Filter out users who have disabled this notification type
            const disabledPrefs = await prisma.userNotificationPreference.findMany({
                where: {
                    notificationType,
                    enabled: false,
                    userId: { in: users.map(u => u.id) }
                },
                select: { userId: true }
            });

            const disabledUserIds = new Set(disabledPrefs.map(p => p.userId));

            return users
                .filter(u => !disabledUserIds.has(u.id))
                .map(u => u.id);
        } catch (error) {
            Logger.error('[NotifSettings] Error getting users for notification type:', error);
            return [];
        }
    }
};
