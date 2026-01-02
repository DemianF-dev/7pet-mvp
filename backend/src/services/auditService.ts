import prisma from '../lib/prisma'; // Ensure this path is correct relative to service

interface AuditLogEntry {
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLLBACK';
    performedBy: string; // userId
    previousData?: any;
    newData?: any;
    reason?: string;
}

export const auditService = {
    log: async (entry: AuditLogEntry) => {
        try {
            await prisma.auditLog.create({
                data: {
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    action: entry.action,
                    performedBy: entry.performedBy,
                    previousData: entry.previousData || {},
                    newData: entry.newData || {},
                    reason: entry.reason
                }
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw, we don't want to break the main flow if logging fails
        }
    },

    getLogs: async (entityType: string, entityId: string) => {
        return prisma.auditLog.findMany({
            where: { entityType, entityId },
            orderBy: { createdAt: 'desc' }
        });
    },

    // Admin only
    rollback: async (logId: string, adminUserId: string) => {
        const log = await prisma.auditLog.findUnique({ where: { id: logId } });
        if (!log || !log.previousData) throw new Error('Log not found or no previous data');

        const model = (prisma as any)[log.entityType.toLowerCase()];
        if (!model) throw new Error('Invalid entity type');

        // Restore previous data
        await model.update({
            where: { id: log.entityId },
            data: log.previousData
        });

        // Log the rollback itself
        await auditService.log({
            entityType: log.entityType,
            entityId: log.entityId,
            action: 'ROLLBACK',
            performedBy: adminUserId,
            previousData: log.newData,
            newData: log.previousData,
            reason: `Rollback to state before log ${logId}`
        });
    }
};
