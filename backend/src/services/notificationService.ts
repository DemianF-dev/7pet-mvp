import prisma from '../lib/prisma';
import logger, { logInfo, logError } from '../utils/logger';
import { messagingService } from './messagingService';

/**
 * 🔔 Comprehensive Notification Service
 * Handles all scheduled notifications for the 7Pet system
 */

export const notificationService = {
    /**
     * 📋 NOTIFICATION 1: 30min before appointment (CLIENT)
     * Notifica o cliente 30 minutos antes do agendamento
     */
    async notify30MinBefore() {
        const now = new Date();
        const start = new Date(now.getTime() + 25 * 60 * 1000); // 25min
        const end = new Date(now.getTime() + 35 * 60 * 1000);   // 35min

        const appointments = await prisma.appointment.findMany({
            where: {
                startAt: {
                    gte: start,
                    lte: end
                },
                status: { in: ['CONFIRMADO', 'PENDENTE'] },
                deletedAt: null,
                // Evita re-notificar
                notified1h: false, // Temporary proxy until schema is updated
            },
            include: {
                customer: { include: { user: true } },
                pet: true,
                services: true,
                performer: true
            }
        });

        for (const appt of appointments) {
            if (!appt.customer.user) continue;

            const timeStr = appt.startAt.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Notificação para o CLIENTE
            await messagingService.notifyUser(
                appt.customer.user.id,
                `🐾 Agendamento em 30 minutos!`,
                `${appt.pet.name} tem um agendamento às ${timeStr}. Já estamos preparando tudo! 🎉`,
                'APPOINTMENT_REMINDER'
            );

            // Notificação para o OPERADOR/GERENTE
            const managers = await prisma.user.findMany({
                where: { role: { in: ['GESTAO', 'ADMIN', 'MASTER'] } }
            });

            for (const manager of managers) {
                await messagingService.notifyUser(
                    manager.id,
                    `📋 Agendamento iniciando em 30min`,
                    `${appt.pet.name} - ${appt.customer.name} às ${timeStr}`,
                    'APPOINTMENT_STAFF_REMINDER'
                );
            }

            // Notificação para o PROFISSIONAL responsável (se houver)
            if (appt.performerId) {
                await messagingService.notifyUser(
                    appt.performerId,
                    `⭐ Seu agendamento é em 30min!`,
                    `${appt.pet.name} - ${appt.services.map(s => s.name).join(', ')} às ${timeStr}`,
                    'APPOINTMENT_PERFORMER_REMINDER'
                );
            }

            await prisma.appointment.update({
                where: { id: appt.id },
                data: { notified1h: true }
            });
            logger.info(`✅ Notificações enviadas para agendamento ${appt.id} (30min antes)`);
        }

        return appointments.length;
    },

    /**
     * 📋 NOTIFICATION 2: Daily reminder at 22:00 (ALL OPERATORS)
     * "Atenção, revise sua agenda de amanhã!"
     */
    async notifyDailyReview() {
        const now = new Date();
        const hour = now.getHours();

        // Só roda entre 22:00 e 22:05
        if (hour !== 22) {
            return 0;
        }

        // Busca todos operadores (OPERACIONAL, GESTAO, ADMIN, SPA)
        const operators = await prisma.user.findMany({
            where: {
                role: { in: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER'] }
            }
        });

        // Data de amanhã
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        // Conta quantos agendamentos tem amanhã
        const tomorrowApptsCount = await prisma.appointment.count({
            where: {
                startAt: {
                    gte: tomorrow,
                    lt: dayAfter
                },
                deletedAt: null
            }
        });

        for (const operator of operators) {
            await messagingService.notifyUser(
                operator.id,
                `📅 Atenção! Revise sua agenda de amanhã`,
                `Você tem ${tomorrowApptsCount} agendamento(s) programado(s) para amanhã. Revise e se prepare! 💼`,
                'DAILY_REVIEW'
            );
        }

        logger.info(`✅ Notificação diária enviada para ${operators.length} operadores`);
        return operators.length;
    },

    /**
     * 📋 NOTIFICATION 3: Quote response (CLIENT)
     * Cliente recebe notificação quando orçamento é respondido
     */
    async notifyQuoteResponse(quoteId: string, userId: string, message: string) {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: { pet: true }
        });

        if (!quote) return;

        await messagingService.notifyUser(
            userId,
            `💰 Orçamento Respondido!`,
            message || `Seu orçamento #${quote.seqId} foi respondido. Confira os detalhes!`,
            'QUOTE_RESPONSE'
        );

        logger.info(`✅ Notificação de resposta enviada para orçamento ${quoteId}`);
    },

    /**
     * 📋 NOTIFICATION 4: Appointment changes (CLIENT)
     * Cliente recebe notificação quando agendamento é alterado
     */
    async notifyAppointmentChange(appointmentId: string, userId: string, changeType: 'UPDATE' | 'CANCEL' | 'CONFIRM', message: string) {
        const titles = {
            UPDATE: '🔄 Agendamento Alterado',
            CANCEL: '❌ Agendamento Cancelado',
            CONFIRM: '✅ Agendamento Confirmado'
        };

        const priorities = {
            UPDATE: 'HIGH',
            CANCEL: 'HIGH',
            CONFIRM: 'MEDIUM'
        };

        await messagingService.notifyUser(
            userId,
            titles[changeType],
            message,
            `APPOINTMENT_${changeType}`
        );

        logger.info(`✅ Notificação de ${changeType} enviada para agendamento ${appointmentId}`);
    },

    /**
     * 📋 NOTIFICATION 5: Support ticket response (CLIENT)
     * Cliente recebe notificação quando problema/dúvida é respondido
     */
    async notifySupportResponse(ticketId: string, userId: string, message: string) {
        await messagingService.notifyUser(
            userId,
            `💬 Você recebeu uma resposta!`,
            message,
            'SUPPORT_RESPONSE'
        );

        logger.info(`✅ Notificação de suporte enviada para ticket ${ticketId}`);
    },

    /**
     * 📋 NOTIFICATION 6: New Quote Alert (STAFF)
     * Notifica a equipe de atendimento/comercial sobre um novo pedido de orçamento
     */
    async notifyNewQuoteToStaff(quoteId: string) {
        try {
            const quote = await prisma.quote.findUnique({
                where: { id: quoteId },
                include: {
                    customer: true,
                    pet: true
                }
            });

            if (!quote) return;

            // Busca todos usuários que precisam saber de um novo orçamento
            const staff = await prisma.user.findMany({
                where: {
                    role: { in: ['COMERCIAL', 'GESTAO', 'ADMIN', 'MASTER'] },
                    deletedAt: null
                }
            });

            const clientName = quote.customer.name;
            const petName = quote.pet?.name || 'Pet';
            const title = `🆕 Novo Orçamento Recebido!`;
            const message = `${clientName} solicitou um orçamento para ${petName} (OR-${String(quote.seqId).padStart(4, '0')}).`;

            const promises = staff.map(user =>
                messagingService.notifyUser(
                    user.id,
                    title,
                    message,
                    'NEW_QUOTE_STAFF_ALERT'
                )
            );

            await Promise.all(promises);
            logger.info(`✅ Alerta de novo orçamento enviado para ${staff.length} colaboradores`);
        } catch (error: any) {
            logError('❌ Erro ao notificar staff sobre novo orçamento:', error);
        }
    }
};

/**
 * 🕐 Main Scheduler Function
 * Runs every minute and triggers appropriate notifications
 */
export async function runScheduledNotifications() {
    try {
        logger.info('[Notif Scheduler] Running scheduled checks...');

        // Check 30min before appointments
        const count30min = await notificationService.notify30MinBefore();
        if (count30min > 0) {
            logger.info(`[Notif Scheduler] ✅ ${count30min} agendamentos notificados (30min)`);
        }

        // Check daily review (only at 22:00)
        const countDaily = await notificationService.notifyDailyReview();
        if (countDaily > 0) {
            logger.info(`[Notif Scheduler] ✅ ${countDaily} operadores notificados (revisão diária)`);
        }
    } catch (error: any) {
        logError('[Notif Scheduler] Error:', error);
    }
}

/**
 * Start auto-scheduler (local dev only, Vercel uses Cron Jobs)
 */
export function startNotificationScheduler() {
    // Don't run in production (Vercel serverless)
    if (process.env.NODE_ENV === 'production') {
        logger.info('[Notif Scheduler] Disabled in production - using Vercel Cron');
        return;
    }

    // Run every minute in development
    setInterval(runScheduledNotifications, 60 * 1000);
    logger.info('[Notif Scheduler] Started (runs every 60s in dev)');

    // Run immediately on startup
    runScheduledNotifications();
}
