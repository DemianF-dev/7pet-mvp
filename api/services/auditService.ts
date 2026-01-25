
import { PrismaClient, AuditSource, AuditTargetType, AuditAction, AuditSeverity } from '@prisma/client';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

export interface AuditContext {
    actorUserId?: string;
    actorNameSnapshot?: string;
    actorRoleSnapshot?: string;
    source: AuditSource;
    ip?: string;
    userAgent?: string;
    requestId?: string;
}

export interface LogEventOptions {
    targetType: AuditTargetType;
    targetId?: string;
    clientId?: string;
    appointmentId?: string;
    quoteId?: string;
    petId?: string;
    action: AuditAction;
    severity?: AuditSeverity;
    summary: string;
    meta?: any;
    before?: any;
    after?: any;
    diff?: any;
    revertible?: boolean;
    revertStrategy?: string;
    revertOfEventId?: string;
}

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'plainPassword', 'token', 'jwt', 'authorization', 'secret', 'key'];

/**
 * Sanitizes objects by removing sensitive fields
 */
export const sanitizeAuditPayload = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeAuditPayload);

    const sanitized = { ...obj };
    for (const key of Object.keys(sanitized)) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeAuditPayload(sanitized[key]);
        }
    }
    return sanitized;
};

/**
 * Calculates a simple diff between two objects
 */
export const calculateDiff = (before: any, after: any) => {
    if (!before || !after) return null;

    const sBefore = sanitizeAuditPayload(before);
    const sAfter = sanitizeAuditPayload(after);

    const diff: any = {};
    const allKeys = new Set([...Object.keys(sBefore), ...Object.keys(sAfter)]);

    for (const key of allKeys) {
        // Skip internal or oversized fields if necessary
        if (['updatedAt', 'createdAt'].includes(key)) continue;

        if (JSON.stringify(sBefore[key]) !== JSON.stringify(sAfter[key])) {
            diff[key] = {
                old: sBefore[key],
                new: sAfter[key]
            };
        }
    }
    return Object.keys(diff).length > 0 ? diff : null;
};

/**
 * Logs an audit event to the database
 */
export const logEvent = async (context: AuditContext, options: LogEventOptions, tx?: any) => {
    const client = tx || prisma;

    // Auto-calculate diff if before and after are provided
    const diff = options.diff || calculateDiff(options.before, options.after);

    // Sanitizar before/after
    const before = sanitizeAuditPayload(options.before);
    const after = sanitizeAuditPayload(options.after);

    try {
        return await client.auditEvent.create({
            data: {
                id: randomUUID(),
                actorUserId: context.actorUserId,
                actorNameSnapshot: context.actorNameSnapshot,
                actorRoleSnapshot: context.actorRoleSnapshot,
                source: context.source,
                ip: context.ip,
                userAgent: context.userAgent,
                requestId: context.requestId,

                targetType: options.targetType,
                targetId: options.targetId,
                clientId: options.clientId,
                appointmentId: options.appointmentId,
                quoteId: options.quoteId,
                petId: options.petId,

                action: options.action,
                severity: options.severity || 'INFO',
                summary: options.summary,
                meta: options.meta,
                before: before,
                after: after,
                diff: diff,
                revertible: options.revertible || false,
                revertStrategy: options.revertStrategy,
                revertOfEventId: options.revertOfEventId
            }
        });
    } catch (error) {
        console.error('[AuditService] Failed to log event:', error);
        // We don't throw here to prevent breaking the main flow
        return null;
    }
};

/**
 * Specific helper for Client updates
 */
export const logClientUpdated = async (context: AuditContext, clientId: string, before: any, after: any, byStaff: boolean = false, tx?: any) => {
    return logEvent(context, {
        targetType: 'CLIENT',
        targetId: clientId,
        clientId: clientId,
        action: 'CLIENT_UPDATED',
        summary: `Dados do cliente ${after.name || 'N/A'} atualizados`,
        meta: { byStaff },
        before,
        after,
        revertible: true,
        revertStrategy: 'PATCH'
    }, tx);
};

/**
 * Specific helper for Quote status changes
 */
export const logQuoteStatusChanged = async (context: AuditContext, quoteId: string, clientId: string, oldStatus: string, newStatus: string, tx?: any) => {
    return logEvent(context, {
        targetType: 'QUOTE',
        targetId: quoteId,
        quoteId: quoteId,
        clientId: clientId,
        action: 'QUOTE_STATUS_CHANGED',
        summary: `Status do orçamento alterado de ${oldStatus} para ${newStatus}`,
        before: { status: oldStatus },
        after: { status: newStatus },
        revertible: true,
        revertStrategy: 'PATCH'
    }, tx);
};

/**
 * Helper for Appointment events
 */
export const logAppointmentEvent = async (context: AuditContext, appointment: any, action: AuditAction, summary: string, meta?: any, tx?: any) => {
    return logEvent(context, {
        targetType: 'APPOINTMENT',
        targetId: appointment.id,
        appointmentId: appointment.id,
        clientId: appointment.customerId,
        petId: appointment.petId,
        quoteId: appointment.quoteId,
        action,
        severity: action === 'APPOINTMENT_CANCELLED' || action === 'APPOINTMENT_NO_SHOW' ? 'WARNING' : 'INFO',
        summary,
        meta,
        revertible: action === 'APPOINTMENT_RESCHEDULED',
        revertStrategy: action === 'APPOINTMENT_RESCHEDULED' ? 'PATCH' : undefined
    }, tx);
};

/**
 * Helper for Permission/User changes
 */
export const logSecurityEvent = async (context: AuditContext, targetType: AuditTargetType, targetId: string, action: AuditAction, summary: string, before?: any, after?: any, tx?: any) => {
    return logEvent(context, {
        targetType,
        targetId,
        action,
        severity: 'CRITICAL',
        summary,
        before,
        after,
        revertible: true,
        revertStrategy: action === 'USER_DELETED_SOFT' ? 'RESTORE_SOFT_DELETE' : 'PATCH'
    }, tx);
};

/**
 * V1 Reversion Logic
 */
export const revertEvent = async (context: AuditContext, eventId: string, reason: string) => {
    return await prisma.$transaction(async (tx) => {
        const event = await tx.auditEvent.findUnique({
            where: { id: eventId }
        });

        if (!event) throw new Error('Evento não encontrado');
        if (!event.revertible) throw new Error('Este evento não pode ser revertido automaticamente');
        if (event.revertedAt) throw new Error('Este evento já foi revertido');

        console.log(`[AuditService] Revertendo evento ${eventId} (${event.action})`);

        let success = false;

        // V1 Strategies
        if (event.revertStrategy === 'PATCH' && event.before) {
            const beforeData = event.before as any;

            if (event.targetType === 'CLIENT' && event.targetId) {
                await tx.customer.update({
                    where: { id: event.targetId },
                    data: beforeData
                });
                success = true;
            } else if (event.targetType === 'QUOTE' && event.targetId) {
                await tx.quote.update({
                    where: { id: event.targetId },
                    data: beforeData
                });
                success = true;
            } else if (event.targetType === 'SERVICE' && event.targetId) {
                await tx.service.update({
                    where: { id: event.targetId },
                    data: beforeData
                });
                success = true;
            } else if (event.targetType === 'PET' && event.targetId) {
                await tx.pet.update({
                    where: { id: event.targetId },
                    data: beforeData
                });
                success = true;
            } else if (event.targetType === 'APPOINTMENT' && event.targetId) {
                await tx.appointment.update({
                    where: { id: event.targetId },
                    data: beforeData
                });
                success = true;
            } else if (event.targetType === 'PERMISSION' && event.targetId) {
                await tx.rolePermission.update({
                    where: { role: event.targetId },
                    data: beforeData
                });
                success = true;
            }
        } else if (event.revertStrategy === 'RESTORE_SOFT_DELETE' && event.targetId) {
            if (event.targetType === 'USER') {
                await (tx.user as any).update({ where: { id: event.targetId }, data: { deletedAt: null } });
                success = true;
            } else if (event.targetType === 'PET') {
                await (tx.pet as any).update({ where: { id: event.targetId }, data: { deletedAt: null } });
                success = true;
            } else if (event.targetType === 'SERVICE') {
                await (tx.service as any).update({ where: { id: event.targetId }, data: { deletedAt: null } });
                success = true;
            }
        }

        if (!success) {
            throw new Error(`Estratégia de reversão ${event.revertStrategy} não implementada ou inválida para ${event.targetType}`);
        }

        // Mark as reverted
        const updatedEvent = await tx.auditEvent.update({
            where: { id: eventId },
            data: {
                revertedAt: new Date(),
                revertedByUserId: context.actorUserId,
                revertReason: reason
            }
        });

        // Log the reversion itself
        await logEvent(context, {
            targetType: event.targetType as any,
            targetId: event.targetId || undefined,
            clientId: event.clientId || undefined,
            action: 'EVENT_REVERTED',
            severity: 'WARNING',
            summary: `Reversão do evento: ${event.summary}`,
            meta: { originalEventId: eventId, reason },
            revertOfEventId: eventId
        }, tx);

        return updatedEvent;
    });
};

