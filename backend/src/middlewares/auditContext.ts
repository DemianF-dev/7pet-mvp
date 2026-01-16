
import { Request, Response, NextFunction } from 'express';
import { AuditSource } from '@prisma/client';
import crypto from 'crypto';

export interface AuditContext {
    actorUserId?: string;
    actorNameSnapshot?: string;
    actorRoleSnapshot?: string;
    source: AuditSource;
    ip?: string;
    userAgent?: string;
    requestId: string;
}

/**
 * Middleware to enrich request with Audit Context
 * Must be applied AFTER authMiddleware
 */
export const auditContextMiddleware = (req: any, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'] || '';

    // Identify Source
    let source: AuditSource = 'WEB';
    if (userAgent.toLowerCase().includes('mobile') || req.path.includes('/mobile')) {
        source = 'MOBILE';
    } else if (req.path.includes('/system') || !userAgent) {
        source = 'SYSTEM';
    } else if (req.headers['x-api-key'] || req.path.includes('/api/')) {
        source = 'API';
    }

    // Capture context
    const ctx: AuditContext = {
        actorUserId: req.user?.id,
        actorNameSnapshot: req.user?.name,
        actorRoleSnapshot: req.user?.division || req.user?.role,
        source,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent,
        requestId: crypto.randomUUID?.() || Math.random().toString(36).substring(2)
    };

    // Attach to request
    req.audit = ctx;

    next();
};
