import { Router } from 'express';
import { metricsService } from '../services/metricsService';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';
import os from 'os';

const router = Router();

/**
 * 📊 GET /metrics/summary
 * Get comprehensive metrics summary
 * Requires: ADMIN, GESTAO, or MASTER role
 */
router.get('/summary', authenticate, authorize(['ADMIN', 'GESTAO', 'MASTER']), (req, res) => {
    try {
        const summary = metricsService.getSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics summary' });
    }
});

/**
 * 📈 GET /metrics/realtime
 * Get real-time metrics for dashboard charts
 * Requires: ADMIN, GESTAO, or MASTER role
 */
router.get('/realtime', authenticate, authorize(['ADMIN', 'GESTAO', 'MASTER']), (req, res) => {
    try {
        const minutes = parseInt(req.query.minutes as string) || 5;
        const metrics = metricsService.getRealtimeMetrics(Math.min(minutes, 60)); // Max 60 minutes
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch realtime metrics' });
    }
});

/**
 * 🏥 GET /metrics/health
 * Detailed health check with component status
 * Public endpoint (no auth required for monitoring tools)
 */
router.get('/health', async (req, res) => {
    try {
        const health = metricsService.getHealthStatus();

        // Add system metrics
        const systemMetrics = {
            memory: {
                used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
                total: Math.round(os.totalmem() / 1024 / 1024),
                percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                loadAverage: os.loadavg()
            },
            uptime: process.uptime(),
            nodeVersion: process.version
        };

        // Test database connection
        let dbStatus: 'pass' | 'fail' = 'pass';
        let dbMessage = 'Connected';
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            dbStatus = 'fail';
            dbMessage = 'Connection failed';
        }

        health.checks.push({
            name: 'Database Connection',
            status: dbStatus,
            message: dbMessage
        });

        // Return appropriate status code based on health
        const statusCode = health.status === 'healthy' ? 200
            : health.status === 'degraded' ? 200
                : 503;

        res.status(statusCode).json({
            ...health,
            timestamp: Date.now(),
            system: systemMetrics
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: 'Health check failed',
            timestamp: Date.now()
        });
    }
});

/**
 * 🔄 POST /metrics/reset
 * Reset all metrics (for testing or cleanup)
 * Requires: MASTER role only
 */
router.post('/reset', authenticate, authorize(['MASTER']), (req, res) => {
    try {
        metricsService.reset();
        res.json({ success: true, message: 'Metrics reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset metrics' });
    }
});

/**
 * 💾 GET /metrics/database
 * Get database-specific metrics
 * Requires: ADMIN, GESTAO, or MASTER role
 */
router.get('/database', authenticate, authorize(['ADMIN', 'GESTAO', 'MASTER']), async (req, res) => {
    try {
        // Get table sizes and record counts
        const tables = [
            'User', 'Customer', 'Pet', 'Service', 'Appointment',
            'Quote', 'Invoice', 'Notification', 'AuditLog'
        ];

        const tableSizes = await Promise.all(
            tables.map(async (table) => {
                try {
                    const count = await (prisma as any)[table.toLowerCase()].count();
                    return { table, count };
                } catch {
                    return { table, count: 0 };
                }
            })
        );

        // Get recent activity
        const recentAudits = await prisma.auditLog.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h
                }
            }
        });

        res.json({
            tables: tableSizes,
            activity: {
                auditsLast24h: recentAudits
            },
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch database metrics' });
    }
});

export default router;
