import { Request, Response } from 'express';
import { auditService } from '../services/auditService';
import prisma from '../lib/prisma';

interface AuthenticatedRequest extends Request {
    user?: { id: string; role: string };
}

export const auditController = {
    getLogs: async (req: Request, res: Response) => {
        try {
            const { entityType, entityId } = req.params;
            const logs = await auditService.getLogs(entityType, entityId);

            // Enrich with performedBy user names if possible
            const enrichedLogs = await Promise.all(logs.map(async (log) => {
                const user = await prisma.user.findUnique({
                    where: { id: log.performedBy },
                    select: { name: true, firstName: true, lastName: true, role: true }
                });
                return {
                    ...log,
                    performedByName: user ? (user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'Unknown'
                };
            }));

            return res.json(enrichedLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    rollback: async (req: Request, res: Response) => {
        try {
            const { logId } = req.params;
            // Assumption: Middleware already checked Admin role
            await auditService.rollback(logId, (req as AuthenticatedRequest).user!.id);
            return res.json({ message: 'Rollback successful' });
        } catch (error) {
            console.error('Error on rollback:', error);
            return res.status(500).json({ error: 'Rollback failed' });
        }
    }
};
