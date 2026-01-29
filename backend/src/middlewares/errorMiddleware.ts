import { Request, Response, NextFunction } from 'express';
import { logInfo, logError } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logError(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, err);

    // 🛡️ Ensure CORS headers are present even on errors
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    const statusCode = err.status || 500;

    // DEBUG: Always return real error in prod for now
    res.status(statusCode).json({
        error: err.message,
        stack: err.stack,
        details: err.details || null
    });
};
