/**
 * ⏰ Vercel Cron Job Handler
 * 
 * Este arquivo é executado automaticamente pelos Cron Jobs do Vercel
 * 
 * Configuração no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/notifications",
 *     "schedule": "* * * * *" // Every minute
 *   }]
 * }
 */

import { Request, Response } from 'express';
import { executeScheduledChecks } from '../schedulers/notificationScheduler';
import logger, { logInfo, logError, logWarn } from '../utils/logger';

export async function cronNotifications(req: Request, res: Response) {
    // Verify Vercel Cron secret (security)
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
        logWarn('[Cron] Unauthorized cron job access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        logger.info('[Cron] Starting scheduled notifications...');
        await executeScheduledChecks();

        res.status(200).json({
            success: true,
            message: 'Scheduled notifications executed',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        logError('[Cron] Error executing notifications:', error);
        res.status(500).json({
            error: 'Failed to execute notifications',
            message: error.message
        });
    }
}
