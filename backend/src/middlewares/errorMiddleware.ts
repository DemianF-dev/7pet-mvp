import { Request, Response, NextFunction } from 'express';
import Logger from '../lib/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    Logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // 🛡️ Ensure CORS headers are present even on errors
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Erro interno no servidor' : err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};
