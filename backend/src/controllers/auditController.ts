
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import * as auditService from '../services/auditService';
import { AuditTargetType, AuditSeverity, Prisma } from '@prisma/client';

export const auditController = {
    /**
     * GET /clients/:clientId/audit
     * Timeline do cliente
     */
    async getClientAudit(req: Request, res: Response) {
        const { clientId } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const take = Number(limit);
        const skip = (Number(page) - 1) * take;

        try {
            const [events, total] = await Promise.all([
                prisma.auditEvent.findMany({
                    where: { clientId },
                    take,
                    skip,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.auditEvent.count({ where: { clientId } })
            ]);

            return res.json({
                data: events,
                pagination: {
                    total,
                    pages: Math.ceil(total / take),
                    page: Number(page),
                    limit: take
                }
            });
        } catch (error: any) {
            console.error('[AuditController] Error fetching client audit:', error);
            return res.status(500).json({ error: 'Erro ao buscar histórico de auditoria do cliente' });
        }
    },

    /**
     * GET /admin/audit
     * Global audit log for admins
     */
    async getAdminAudit(req: Request, res: Response) {
        const {
            actor,
            targetType,
            severity,
            from,
            to,
            q,
            limit = 50,
            page = 1
        } = req.query;

        const take = Number(limit);
        const skip = (Number(page) - 1) * take;

        try {
            const where: any = {};

            if (actor) where.actorUserId = String(actor);
            if (targetType) where.targetType = targetType as AuditTargetType;
            if (severity) where.severity = severity as AuditSeverity;

            if (from || to) {
                where.createdAt = {};
                if (from) where.createdAt.gte = new Date(String(from));
                if (to) where.createdAt.lte = new Date(String(to));
            }

            if (q) {
                where.OR = [
                    { summary: { contains: String(q), mode: Prisma.QueryMode.insensitive } },
                    { actorNameSnapshot: { contains: String(q), mode: Prisma.QueryMode.insensitive } },
                    { targetId: { contains: String(q) } }
                ];
            }

            const [events, total] = await Promise.all([
                prisma.auditEvent.findMany({
                    where,
                    take,
                    skip,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.auditEvent.count({ where })
            ]);

            return res.json({
                data: events,
                pagination: {
                    total,
                    pages: Math.ceil(total / take),
                    page: Number(page),
                    limit: take
                }
            });
        } catch (error: any) {
            console.error('[AuditController] Error fetching admin audit:', error);
            return res.status(500).json({ error: 'Erro ao buscar histórico global de auditoria' });
        }
    },

    /**
     * POST /admin/audit/:eventId/revert
     * Reverter um evento
     */
    async revert(req: Request, res: Response) {
        const { eventId } = req.params;
        const { reason } = req.body;
        const auditContext = (req as any).audit;

        if (!reason) {
            return res.status(400).json({ error: 'Motivo da reversão é obrigatório' });
        }

        try {
            const result = await auditService.revertEvent(auditContext, eventId, reason);
            return res.json({ message: 'Evento revertido com sucesso', result });
        } catch (error: any) {
            console.error('[AuditController] Error reverting event:', error);
            return res.status(400).json({ error: error.message || 'Erro ao reverter evento' });
        }
    },

    /**
     * GET /management/audit/:entityType/:entityId
     * Legacy Audit Logs
     */
    async getLogs(req: Request, res: Response) {
        const { entityType, entityId } = req.params;
        try {
            const logs = await prisma.auditLog.findMany({
                where: { entityType, entityId },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(logs);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar logs' });
        }
    },

    /**
     * POST /management/audit/:logId/rollback
     * Legacy Rollback
     */
    async rollback(req: Request, res: Response) {
        return res.status(501).json({ error: 'Rollback legado não implementado. Use a reversão do AuditEvent.' });
    }
};


