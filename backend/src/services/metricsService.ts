/**
 * 📊 Metrics Service - Real-time Performance Monitoring
 * Collects and stores application metrics for monitoring dashboard
 * Updated (04/01/2026): Added database persistence and alert integration
 */

import prisma from '../lib/prisma';
import { alertService } from './alertService';

interface MetricData {
    timestamp: number;
    value: number;
    label?: string;
}

interface RequestMetric {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    timestamp: number;
}

interface MetricsSummary {
    requests: {
        total: number;
        successful: number;
        failed: number;
        avgResponseTime: number;
        requestsPerMinute: number;
    };
    endpoints: {
        path: string;
        count: number;
        avgDuration: number;
        errors: number;
    }[];
    errors: {
        statusCode: number;
        count: number;
        lastOccurrence: number;
    }[];
    database: {
        activeConnections: number;
        queryCount: number;
        avgQueryTime: number;
        slowQueries: number;
    };
    security: {
        blockedCORS: number;
        rateLimitHits: number;
        authFailures: number;
    };
    uptime: {
        startTime: number;
        currentUptime: number;
        lastRestart: number;
    };
}

class MetricsService {
    private requests: RequestMetric[] = [];
    private maxStoredRequests = 10000; // Store last 10k requests
    private startTime = Date.now();
    private lastRestart = Date.now();

    // Security metrics
    private blockedCORSCount = 0;
    private rateLimitHitsCount = 0;
    private authFailuresCount = 0;

    // Database metrics
    private queryCount = 0;
    private totalQueryTime = 0;
    private slowQueryCount = 0;

    /**
     * Record an incoming request
     */
    recordRequest(metric: RequestMetric): void {
        this.requests.push(metric);

        // Keep only last N requests to prevent memory overflow
        if (this.requests.length > this.maxStoredRequests) {
            this.requests.shift();
        }

        // 💾 PERSISTENCE: Save to database every 100 requests
        if (this.requests.length % 100 === 0) {
            this.persistMetricToDatabase('request', metric).catch(err => {
                console.error('Failed to persist metric:', err);
            });
        }
    }

    /**
     * Persist a metric to database
     * @private
     */
    private async persistMetricToDatabase(type: string, data: any): Promise<void> {
        try {
            await prisma.metric.create({
                data: {
                    type,
                    data: data as any,
                    timestamp: new Date(data.timestamp || Date.now())
                }
            });
        } catch (error) {
            // Silently fail to not disrupt application
            console.error('Error persisting metric:', error);
        }
    }

    /**
     * Record a database query
     */
    recordQuery(duration: number): void {
        this.queryCount++;
        this.totalQueryTime += duration;

        // Queries taking more than 1 second are considered slow
        if (duration > 1000) {
            this.slowQueryCount++;
        }
    }

    /**
     * Increment CORS block counter
     */
    incrementBlockedCORS(): void {
        this.blockedCORSCount++;

        // 🚨 Check threshold and send alert
        alertService.checkThreshold('cors_blocks', this.blockedCORSCount);
    }

    /**
     * Increment rate limit hits
     */
    incrementRateLimitHit(): void {
        this.rateLimitHitsCount++;

        // 🚨 Check threshold and send alert
        alertService.checkThreshold('rate_limit_hits', this.rateLimitHitsCount);
    }

    /**
     * Increment auth failures
     */
    incrementAuthFailure(): void {
        this.authFailuresCount++;

        // 🚨 Check threshold and send alert
        alertService.checkThreshold('auth_failures', this.authFailuresCount);
    }

    /**
     * Get metrics summary
     */
    getSummary(): MetricsSummary {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.requests.filter(r => r.timestamp > oneMinuteAgo);

        // Calculate request metrics
        const totalRequests = this.requests.length;
        const successfulRequests = this.requests.filter(r => r.statusCode < 400).length;
        const failedRequests = totalRequests - successfulRequests;
        const avgResponseTime = totalRequests > 0
            ? this.requests.reduce((sum, r) => sum + r.duration, 0) / totalRequests
            : 0;
        const requestsPerMinute = recentRequests.length;

        // Group by endpoint
        const endpointMap = new Map<string, { count: number; totalDuration: number; errors: number }>();
        this.requests.forEach(req => {
            const key = `${req.method} ${req.path}`;
            const existing = endpointMap.get(key) || { count: 0, totalDuration: 0, errors: 0 };
            existing.count++;
            existing.totalDuration += req.duration;
            if (req.statusCode >= 400) existing.errors++;
            endpointMap.set(key, existing);
        });

        const endpoints = Array.from(endpointMap.entries())
            .map(([path, data]) => ({
                path,
                count: data.count,
                avgDuration: data.totalDuration / data.count,
                errors: data.errors
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 endpoints

        // Group errors by status code
        const errorMap = new Map<number, { count: number; lastOccurrence: number }>();
        this.requests.filter(r => r.statusCode >= 400).forEach(req => {
            const existing = errorMap.get(req.statusCode) || { count: 0, lastOccurrence: 0 };
            existing.count++;
            existing.lastOccurrence = Math.max(existing.lastOccurrence, req.timestamp);
            errorMap.set(req.statusCode, existing);
        });

        const errors = Array.from(errorMap.entries())
            .map(([statusCode, data]) => ({
                statusCode,
                count: data.count,
                lastOccurrence: data.lastOccurrence
            }))
            .sort((a, b) => b.count - a.count);

        return {
            requests: {
                total: totalRequests,
                successful: successfulRequests,
                failed: failedRequests,
                avgResponseTime: Math.round(avgResponseTime),
                requestsPerMinute
            },
            endpoints,
            errors,
            database: {
                activeConnections: 0, // Would need to integrate with Prisma metrics
                queryCount: this.queryCount,
                avgQueryTime: this.queryCount > 0 ? Math.round(this.totalQueryTime / this.queryCount) : 0,
                slowQueries: this.slowQueryCount
            },
            security: {
                blockedCORS: this.blockedCORSCount,
                rateLimitHits: this.rateLimitHitsCount,
                authFailures: this.authFailuresCount
            },
            uptime: {
                startTime: this.startTime,
                currentUptime: now - this.startTime,
                lastRestart: this.lastRestart
            }
        };
    }

    /**
     * Get real-time metrics for last N minutes
     */
    getRealtimeMetrics(minutes: number = 5): {
        timeline: { timestamp: number; requests: number; avgDuration: number }[];
        statusCodes: { code: number; count: number }[];
    } {
        const now = Date.now();
        const cutoff = now - (minutes * 60 * 1000);
        const recentRequests = this.requests.filter(r => r.timestamp > cutoff);

        // Group by minute
        const timelineMap = new Map<number, { count: number; totalDuration: number }>();
        recentRequests.forEach(req => {
            const minuteKey = Math.floor(req.timestamp / 60000) * 60000;
            const existing = timelineMap.get(minuteKey) || { count: 0, totalDuration: 0 };
            existing.count++;
            existing.totalDuration += req.duration;
            timelineMap.set(minuteKey, existing);
        });

        const timeline = Array.from(timelineMap.entries())
            .map(([timestamp, data]) => ({
                timestamp,
                requests: data.count,
                avgDuration: Math.round(data.totalDuration / data.count)
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

        // Count by status code
        const statusCodesMap = new Map<number, number>();
        recentRequests.forEach(req => {
            statusCodesMap.set(req.statusCode, (statusCodesMap.get(req.statusCode) || 0) + 1);
        });

        const statusCodes = Array.from(statusCodesMap.entries())
            .map(([code, count]) => ({ code, count }))
            .sort((a, b) => b.count - a.count);

        return { timeline, statusCodes };
    }

    /**
     * Reset metrics (for testing or periodic cleanup)
     */
    reset(): void {
        this.requests = [];
        this.blockedCORSCount = 0;
        this.rateLimitHitsCount = 0;
        this.authFailuresCount = 0;
        this.queryCount = 0;
        this.totalQueryTime = 0;
        this.slowQueryCount = 0;
        this.lastRestart = Date.now();
    }

    /**
     * Get health status
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: {
            name: string;
            status: 'pass' | 'fail' | 'warn';
            message?: string;
        }[];
    } {
        const summary = this.getSummary();
        const checks = [];

        // Check 1: Response time
        const avgResponseTime = summary.requests.avgResponseTime;
        checks.push({
            name: 'Response Time',
            status: avgResponseTime < 200 ? 'pass' : avgResponseTime < 500 ? 'warn' : 'fail',
            message: `${avgResponseTime}ms average`
        });

        // Check 2: Error rate
        const errorRate = summary.requests.total > 0
            ? (summary.requests.failed / summary.requests.total) * 100
            : 0;
        checks.push({
            name: 'Error Rate',
            status: errorRate < 1 ? 'pass' : errorRate < 5 ? 'warn' : 'fail',
            message: `${errorRate.toFixed(2)}% errors`
        });

        // Check 3: Slow queries
        const slowQueryRate = summary.database.queryCount > 0
            ? (summary.database.slowQueries / summary.database.queryCount) * 100
            : 0;
        checks.push({
            name: 'Database Performance',
            status: slowQueryRate < 1 ? 'pass' : slowQueryRate < 5 ? 'warn' : 'fail',
            message: `${slowQueryRate.toFixed(2)}% slow queries`
        });

        // Determine overall status
        const hasFailures = checks.some(c => c.status === 'fail');
        const hasWarnings = checks.some(c => c.status === 'warn');
        const status = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy';

        return {
            status,
            checks: checks as { name: string; status: 'pass' | 'fail' | 'warn'; message?: string }[]
        };
    }

    /**
     * Cleanup old metrics from database (older than 7 days)
     * Should be called periodically (e.g., daily cron job)
     */
    async cleanupOldMetrics(): Promise<number> {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const result = await prisma.metric.deleteMany({
                where: {
                    timestamp: { lt: sevenDaysAgo }
                }
            });

            console.log(`✅ Cleaned up ${result.count} old metrics`);
            return result.count;
        } catch (error) {
            console.error('Error cleaning up metrics:', error);
            return 0;
        }
    }

    /**
     * Get persisted metrics count from database
     */
    async getPersistedMetricsCount(): Promise<number> {
        try {
            return await prisma.metric.count();
        } catch (error) {
            console.error('Error counting metrics:', error);
            return 0;
        }
    }
}

// Singleton instance
export const metricsService = new MetricsService();
