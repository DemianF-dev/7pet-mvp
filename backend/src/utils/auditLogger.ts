import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
    entityType: 'CUSTOMER' | 'QUOTE' | 'APPOINTMENT' | 'INVOICE' | 'PET' | 'USER';
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CONVERT' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'CONFIRM' | 'COMPLETE' | 'STATUS_CHANGE' | 'DUPLICATE';
    performedBy: string;
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    metadata?: any;
    reason?: string;
}

/**
 * Helper function to create audit logs
 * Optimized for performance and consistency
 */
export const createAuditLog = async (
    data: AuditLogData,
    tx?: any // Optional transaction
): Promise<void> => {
    const client = tx || prisma;

    try {
        await client.auditLog.create({
            data: {
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                performedBy: data.performedBy,
                previousData: data.changes ? { changes: data.changes.map(c => ({ field: c.field, value: c.oldValue })) } : null,
                newData: data.changes ? { changes: data.changes.map(c => ({ field: c.field, value: c.newValue })) } : null,
                reason: data.reason || `${data.action} realizado por usuário`,
            },
        });
    } catch (error) {
        console.error('Erro ao criar log de auditoria:', error);
        // Don't throw - logging failure shouldn't break the main operation
    }
};

/**
 * Helper to detect changes between two objects
 */
export const detectChanges = (before: any, after: any): AuditLogData['changes'] => {
    const changes: AuditLogData['changes'] = [];
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

    for (const key of allKeys) {
        // Skip internal fields
        if (['id', 'createdAt', 'updatedAt', 'userId', 'customerId'].includes(key)) {
            continue;
        }

        const oldValue = before?.[key];
        const newValue = after?.[key];

        // Check if values are different
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({
                field: key,
                oldValue,
                newValue,
            });
        }
    }

    return changes;
};

/**
 * Format changes for human-readable display
 */
export const formatChanges = (changes: AuditLogData['changes']): string => {
    if (!changes || changes.length === 0) return 'Nenhuma alteração';

    return changes
        .map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`)
        .join(', ');
};

export default {
    createAuditLog,
    detectChanges,
    formatChanges,
};
