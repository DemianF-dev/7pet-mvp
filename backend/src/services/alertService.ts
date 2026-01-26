/**
 * Alert Service - Security Monitoring and Notifications
 * Implementado seguindo auditoria de segurança (04/01/2026) - Fase 4
 */

import logger, { logInfo, logError, logWarn, logDebug } from '../utils/logger';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
    severity: AlertSeverity;
    title: string;
    message: string;
    metadata?: any;
    timestamp?: Date;
}

interface AlertThreshold {
    metric: string;
    value: number;
    severity: AlertSeverity;
    message: string;
}

class AlertService {
    private alertHistory: Alert[] = [];
    private maxHistorySize = 1000;

    // Thresholds configuráveis
    private thresholds: AlertThreshold[] = [
        {
            metric: 'cors_blocks',
            value: 100,
            severity: 'high',
            message: 'Alto número de bloqueios CORS detectado'
        },
        {
            metric: 'auth_failures',
            value: 500,
            severity: 'critical',
            message: 'Possível ataque de força bruta em andamento'
        },
        {
            metric: 'rate_limit_hits',
            value: 1000,
            severity: 'medium',
            message: 'Muitos rate limit hits detectados'
        },
        {
            metric: 'error_rate',
            value: 5,
            severity: 'high',
            message: 'Taxa de erro acima do normal'
        }
    ];

    /**
     * Send an alert
     */
    async sendAlert(alert: Alert): Promise<void> {
        // Adicionar timestamp se não fornecido
        const fullAlert: Alert = {
            ...alert,
            timestamp: alert.timestamp || new Date()
        };

        // Adicionar ao histórico
        this.alertHistory.push(fullAlert);
        if (this.alertHistory.length > this.maxHistorySize) {
            this.alertHistory.shift();
        }

        // Log sempre
        logWarn(`[ALERT ${alert.severity.toUpperCase()}] ${alert.title}`, {
            message: alert.message,
            metadata: alert.metadata
        });

        // Email para high e critical
        if (alert.severity === 'high' || alert.severity === 'critical') {
            await this.sendEmailAlert(fullAlert);
        }

        // Slack para critical (se configurado)
        if (alert.severity === 'critical' && process.env.SLACK_WEBHOOK_URL) {
            await this.sendSlackAlert(fullAlert);
        }

        // Console para desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            this.logAlertToConsole(fullAlert);
        }
    }

    /**
     * Send email alert (stub - requires nodemailer setup)
     */
    private async sendEmailAlert(alert: Alert): Promise<void> {
        // Verificar se email está configurado
        if (!process.env.ALERT_EMAIL || !process.env.ADMIN_EMAIL) {
            logDebug('Email alerts not configured (ALERT_EMAIL or ADMIN_EMAIL missing)');
            return;
        }

        try {
            // TODO: Implementar com nodemailer se necessário
            // const transporter = nodemailer.createTransporter({ ... });
            // await transporter.sendMail({ ... });

            logInfo(`📧 Email alert would be sent to ${process.env.ADMIN_EMAIL}`, {
                subject: `🚨 [${alert.severity.toUpperCase()}] ${alert.title}`,
                alert
            });
        } catch (error) {
            logError('Failed to send email alert:', error);
        }
    }

    /**
     * Send Slack alert via webhook
     */
    private async sendSlackAlert(alert: Alert): Promise<void> {
        if (!process.env.SLACK_WEBHOOK_URL) {
            return;
        }

        try {
            const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *${alert.title}*`,
                    attachments: [{
                        color: this.getSeverityColor(alert.severity),
                        fields: [
                            {
                                title: 'Severity',
                                value: alert.severity.toUpperCase(),
                                short: true
                            },
                            {
                                title: 'Time',
                                value: alert.timestamp?.toISOString() || 'N/A',
                                short: true
                            },
                            {
                                title: 'Message',
                                value: alert.message,
                                short: false
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Slack API returned ${response.status}`);
            }

            logger.info('📱 Slack alert sent successfully');
        } catch (error) {
            logError('Failed to send Slack alert:', error);
        }
    }

    /**
     * Log alert to console with colors
     */
    private logAlertToConsole(alert: Alert): void {
        const emoji = this.getSeverityEmoji(alert.severity);
        console.log('\n' + '='.repeat(60));
        console.log(`${emoji} SECURITY ALERT - ${alert.severity.toUpperCase()}`);
        console.log('='.repeat(60));
        console.log(`Title:     ${alert.title}`);
        console.log(`Message:   ${alert.message}`);
        console.log(`Time:      ${alert.timestamp?.toISOString()}`);
        if (alert.metadata) {
            console.log(`Metadata:  ${JSON.stringify(alert.metadata, null, 2)}`);
        }
        console.log('='.repeat(60) + '\n');
    }

    /**
     * Check if a metric exceeds threshold
     */
    checkThreshold(metric: string, value: number): void {
        const threshold = this.thresholds.find(t => t.metric === metric);

        if (threshold && value >= threshold.value) {
            this.sendAlert({
                severity: threshold.severity,
                title: `Threshold Exceeded: ${metric}`,
                message: threshold.message,
                metadata: {
                    metric,
                    value,
                    threshold: threshold.value
                }
            });
        }
    }

    /**
     * Get alert history
     */
    getAlertHistory(limit: number = 100): Alert[] {
        return this.alertHistory.slice(-limit).reverse();
    }

    /**
     * Get alert count by severity
     */
    getAlertStats(): Record<AlertSeverity, number> {
        return this.alertHistory.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {} as Record<AlertSeverity, number>);
    }

    /**
     * Clear alert history
     */
    clearHistory(): void {
        this.alertHistory = [];
    }

    /**
     * Get severity color for Slack
     */
    private getSeverityColor(severity: AlertSeverity): string {
        const colors = {
            low: '#36a64f',      // Green
            medium: '#ff9900',   // Orange
            high: '#ff0000',     // Red
            critical: '#8B0000'  // Dark Red
        };
        return colors[severity];
    }

    /**
     * Get severity emoji
     */
    private getSeverityEmoji(severity: AlertSeverity): string {
        const emojis = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🚨',
            critical: '🔥'
        };
        return emojis[severity];
    }

    /**
     * Add custom threshold
     */
    addThreshold(threshold: AlertThreshold): void {
        this.thresholds.push(threshold);
    }

    /**
     * Update threshold value
     */
    updateThreshold(metric: string, newValue: number): boolean {
        const threshold = this.thresholds.find(t => t.metric === metric);
        if (threshold) {
            threshold.value = newValue;
            return true;
        }
        return false;
    }

    /**
     * Get all thresholds
     */
    getThresholds(): AlertThreshold[] {
        return [...this.thresholds];
    }
}

// Singleton instance
export const alertService = new AlertService();

// Export helper function
export async function sendSecurityAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    metadata?: any
): Promise<void> {
    await alertService.sendAlert({ severity, title, message, metadata });
}
