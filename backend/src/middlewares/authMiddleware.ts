import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// CRITICAL SECURITY: No fallback! Force JWT_SECRET to be defined
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET environment variable is not defined! Application cannot start.');
}

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log(`[Auth] Header: ${authHeader ? 'Present' : 'Missing'}`);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[Auth] No Bearer token');
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);
        // console.log(`[Auth] Token decoded for UserID: ${decoded.userId}`);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { customer: true }
        });

        if (!user) {
            console.log('[Auth] User not found in DB');
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.user = user;

        // Inject Audit Context
        req.audit = {
            actorUserId: user.id,
            actorNameSnapshot: user.name,
            actorRoleSnapshot: user.division || user.role,
            source: 'API', // Default for backend requests
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            requestId: crypto.randomUUID?.() || Math.random().toString(36).substring(2)
        };

        next();
    } catch (error) {
        console.log('[Auth] Token Validation Error:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const authorize = (divisions: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.log('[Authz] No user attached to request');
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Use division if available, fallback to role for backward compatibility
        const userDivision = req.user.division || req.user.role;
        console.log(`[Authz] User Division: ${userDivision}, Required: ${divisions.join(',')}`);

        // ADMIN has access to everything
        if (userDivision === 'ADMIN' || userDivision === 'MASTER') {
            return next();
        }

        if (!divisions.includes(userDivision)) {
            console.log('[Authz] Insufficient permissions');
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};
