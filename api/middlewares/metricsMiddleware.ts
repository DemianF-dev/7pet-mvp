import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';

/**
 * 📊 Metrics Collection Middleware
 * Automatically collects performance metrics for all requests
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to capture metrics when response is sent
    res.end = function (this: Response, ...args: any[]): Response {
        const duration = Date.now() - startTime;

        // Record the request metric
        metricsService.recordRequest({
            method: req.method,
            path: sanitizePath(req.path),
            statusCode: res.statusCode,
            duration,
            timestamp: Date.now()
        });

        // Track auth failures
        if (req.path.includes('/auth') && res.statusCode === 401) {
            metricsService.incrementAuthFailure();
        }

        // Call the original end function
        return (originalEnd as any).apply(this, args);
    };

    next();
};

/**
 * Sanitize path to remove IDs and keep only route pattern
 * Example: /customers/123abc -> /customers/:id
 */
function sanitizePath(path: string): string {
    return path
        .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:id')
        .replace(/\/\d+/g, '/:id');
}
