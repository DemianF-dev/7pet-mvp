import prisma from '../lib/prisma';
import { messagingService } from '../services/messagingService';
import Logger from '../lib/logger';
import { notificationService } from '../services/notificationService';

// Tipos de notificação do sistema que controlam agendamentos e rotinas
const NOTIF_TYPES = {
    DAILY_REVIEW: 'SYSTEM_DAILY_REVIEW',
    REMINDER_24H: 'SYSTEM_APPOINTMENT_REMINDER_24H',
    REMINDER_1H: 'SYSTEM_APPOINTMENT_REMINDER_1H'
};

export const runNotificationScheduler = () => {
    // Don't run scheduler in test or production (Vercel serverless)
    // On Vercel, this should be triggered by a Cron Job endpoint
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
        Logger.info('[Scheduler] Background interval disabled for this environment (using Cron).');
        return;
    }

    // Run every minute (only for local dev)
    setInterval(async () => {
        try {
            await executeScheduledChecks();
        } catch (error) {
            Logger.error('[Scheduler] Error in notification scheduler:', error);
        }
    }, 60 * 1000);
    Logger.info('[Scheduler] Started local interval (60s)');
};

/**
 * Main function that runs every minute to check all scheduled tasks
 */
export async function executeScheduledChecks() {
    Logger.info('[Scheduler] Checking scheduled tasks...');

    // 1. Carregar configurações globais
    const settings = await prisma.notificationSettings.findMany({
        where: {
            notificationType: {
                in: Object.values(NOTIF_TYPES)
            }
        }
    });

    // Helper para pegar config (padrão enabled: true se não existir)
    const getConfig = (type: string) => {
        const setting = settings.find(s => s.notificationType === type);
        // Se configuração não existe no banco, assume habilitado (comportamento padrão legado)
        // Se existe, respeita o campo 'enabled'
        return setting ? setting : { enabled: true, frequency: '22:00' };
    };

    const dailyReviewConfig = getConfig(NOTIF_TYPES.DAILY_REVIEW);
    const reminder24hConfig = getConfig(NOTIF_TYPES.REMINDER_24H);
    const reminder1hConfig = getConfig(NOTIF_TYPES.REMINDER_1H);

    // 2. Daily Review Check
    if (dailyReviewConfig.enabled) {
        // Usa o horário configurado ou 22:00 por padrão
        // Se frequency contiver ':' assume que é horário HH:MM
        const targetTime = dailyReviewConfig.frequency.includes(':') ? dailyReviewConfig.frequency : '22:00';
        const [targetHour, targetMinute] = targetTime.split(':').map(Number);

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Executa apenas se for exatamente a hora e minuto (com margem de 1 min)
        // Como roda a cada 60s, vai pegar.
        if (currentHour === targetHour && currentMinute === targetMinute) {
            Logger.info(`[Scheduler] Executing Daily Review at ${targetTime}`);
            await notificationService.notifyDailyReview();
        }
    }

    // 3. Appointment Reminders (24h)
    if (reminder24hConfig.enabled) {
        await check24hReminders();
    }

    // 4. Appointment Reminders (1h)
    if (reminder1hConfig.enabled) {
        await check1hReminders();
    }
}

async function check24hReminders() {
    const now = new Date();
    // Check 24 hour reminders (between 23.5 and 24.5 hours from now)
    const start24 = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const end24 = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    const appointments24 = await prisma.appointment.findMany({
        where: {
            startAt: { gte: start24, lte: end24 },
            status: 'CONFIRMADO',
            notified24h: false
        } as any,
        include: { customer: { include: { user: true } }, pet: true, services: true }
    });

    for (const appt of appointments24 as any[]) {
        if (!appt.customer.user) continue;

        await messagingService.notifyUser(
            appt.customer.user.id,
            'Lembrete de Agendamento',
            `Olá! Lembrando do agendamento de ${appt.pet.name} amanhã às ${appt.startAt.getHours()}:${appt.startAt.getMinutes().toString().padStart(2, '0')}.`,
            'REMINDER'
        );

        await prisma.appointment.update({
            where: { id: appt.id },
            data: { notified24h: true } as any
        });
        Logger.info(`[Scheduler] Sent 24h reminder for Appt ${appt.id}`);
    }
}

async function check1hReminders() {
    const now = new Date();
    // Check 1 hour reminders (between 55 min and 65 min from now)
    const start1 = new Date(now.getTime() + 55 * 60 * 1000);
    const end1 = new Date(now.getTime() + 65 * 60 * 1000);

    const appointments1 = await prisma.appointment.findMany({
        where: {
            startAt: { gte: start1, lte: end1 },
            status: 'CONFIRMADO',
            notified1h: false
        } as any,
        include: { customer: { include: { user: true } }, pet: true }
    });

    for (const appt of appointments1 as any[]) {
        if (!appt.customer.user) continue;

        await messagingService.notifyUser(
            appt.customer.user.id,
            'Seu agendamento é em breve!',
            `Estamos esperando ${appt.pet.name} daqui a pouco, às ${appt.startAt.getHours()}:${appt.startAt.getMinutes().toString().padStart(2, '0')}.`,
            'REMINDER_URGENT'
        );

        await prisma.appointment.update({
            where: { id: appt.id },
            data: { notified1h: true } as any
        });
        Logger.info(`[Scheduler] Sent 1h reminder for Appt ${appt.id}`);
    }
}
