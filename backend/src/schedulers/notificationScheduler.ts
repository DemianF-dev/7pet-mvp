import prisma from '../lib/prisma';
import { messagingService } from '../services/messagingService';
import logger, { logInfo, logError } from '../utils/logger';
import { notificationService } from '../services/notificationService';

// Tipos de notificação do sistema que controlam agendamentos e rotinas
const NOTIF_TYPES = {
    DAILY_REVIEW: 'SYSTEM_DAILY_REVIEW',
    REMINDER_24H: 'SYSTEM_APPOINTMENT_REMINDER_24H',
    REMINDER_1H: 'SYSTEM_APPOINTMENT_REMINDER_1H',
    LOGISTICS_REMINDER: 'SYSTEM_LOGISTICS_STATUS_REMINDER'
};

export const runNotificationScheduler = () => {
    // Don't run scheduler in test or production (Vercel serverless)
    // On Vercel, this should be triggered by a Cron Job endpoint
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production') {
        logger.info('[Scheduler] Background interval disabled for this environment (using Cron).');
        return;
    }

    // Run every minute (only for local dev)
    setInterval(async () => {
        try {
            await executeScheduledChecks();
        } catch (error) {
            logError('[Scheduler] Error in notification scheduler:', error);
        }
    }, 60 * 1000);
    logger.info('[Scheduler] Started local interval (60s)');
};

/**
 * Main function that runs every minute to check all scheduled tasks
 */
export async function executeScheduledChecks() {
    logger.info('[Scheduler] Checking scheduled tasks...');

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
            logger.info(`[Scheduler] Executing Daily Review at ${targetTime}`);
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

    // 5. Logistics Status Reminders (15m post-service + 30m follow-ups)
    await checkLogisticsStatusReminders();
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
        logger.info(`[Scheduler] Sent 24h reminder for Appt ${appt.id}`);
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
        logger.info(`[Scheduler] Sent 1h reminder for Appt ${appt.id}`);
    }
}

async function checkLogisticsStatusReminders() {
    const now = new Date();

    // 1. Initial 15m reminder for appointments that just finished
    // We look for LOGISTICA appointments that ended more than 15m ago, have no logisticsStatus, and haven't been reminded yet
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const pendingInitial = await prisma.appointment.findMany({
        where: {
            category: 'LOGISTICA',
            status: { in: ['CONFIRMADO', 'EM_ATENDIMENTO'] },
            logisticsStatus: null,
            logisticsLastRemindedAt: null,
            // Simple logic: if startAt + ~30m (average trip) is more than 15m ago. 
            // In a real scenario, we might use a more precise 'endTime' if available.
            startAt: { lte: new Date(fifteenMinsAgo.getTime() - 30 * 60 * 1000) }
        } as any,
        include: { performer: true, pet: true }
    });

    for (const appt of pendingInitial as any[]) {
        if (!appt.performerId) continue;

        await messagingService.notifyUser(
            appt.performerId,
            'Atualização de Status Necessária',
            `O serviço de ${appt.pet?.name || 'logística'} finalizou há 15min. Por favor, informe o status (Executado, Atrasado, etc).`,
            'LOGISTICS_REMINDER'
        );

        await prisma.appointment.update({
            where: { id: appt.id },
            data: { logisticsLastRemindedAt: now } as any
        });
        logger.info(`[Scheduler] Sent initial logistics reminder for Appt ${appt.id}`);
    }

    // 2. 30m follow-up for 'DELAYED' status
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const pendingFollowUp = await prisma.appointment.findMany({
        where: {
            category: 'LOGISTICA',
            logisticsStatus: 'DELAYED',
            logisticsLastRemindedAt: { lte: thirtyMinsAgo }
        } as any,
        include: { performer: true, pet: true }
    });

    for (const appt of pendingFollowUp as any[]) {
        if (!appt.performerId) continue;

        await messagingService.notifyUser(
            appt.performerId,
            'Lembrete de Atraso',
            `O serviço de ${appt.pet?.name || 'logística'} continua marcado como 'Atrasado'. Alguma atualização?`,
            'LOGISTICS_REMINDER'
        );

        await prisma.appointment.update({
            where: { id: appt.id },
            data: { logisticsLastRemindedAt: now } as any
        });
        logger.info(`[Scheduler] Sent follow-up logistics reminder for Appt ${appt.id}`);
    }
}
