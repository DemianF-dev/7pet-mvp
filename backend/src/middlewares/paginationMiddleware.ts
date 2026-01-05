import { Request, Response, NextFunction } from 'express';

export interface PaginationQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
    skip: number;
    take: number;
    orderBy?: any;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Middleware to parse and validate pagination parameters
 * Usage: app.get('/api/items', paginationMiddleware, controller)
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Attach pagination params to request
    (req as any).pagination = {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
        sortBy,
        sortOrder
    };

    next();
};

/**
 * Helper to build pagination metadata
 */
export const buildPaginationMeta = (
    page: number,
    limit: number,
    total: number
): PaginationMeta => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};

/**
 * Helper to build paginated response
 */
export const paginatedResponse = <T>(
    data: T[],
    meta: PaginationMeta
) => ({
    data,
    meta
});
