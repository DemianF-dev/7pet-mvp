import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { customer: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Master has access to everything
        if (req.user.role === 'MASTER') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
        }
        next();
    };
};
