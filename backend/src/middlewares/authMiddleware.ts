import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

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
        next();
    } catch (error) {
        console.log('[Auth] Token Validation Error:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.log('[Authz] No user attached to request');
            return res.status(403).json({ error: 'Acesso negado' });
        }

        console.log(`[Authz] User Role: ${req.user.role}, Required: ${roles.join(',')}`);

        // Master has access to everything
        if (req.user.role === 'MASTER') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            console.log('[Authz] Insufficient permissions');
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};
