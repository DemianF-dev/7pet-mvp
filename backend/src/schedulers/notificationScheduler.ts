
import prisma from '../lib/prisma';
import { messagingService } from '../services/messagingService';

export const runNotificationScheduler = () => {
    // Don't run scheduler in test environment
    if (process.env.NODE_ENV === 'test') return;

    // Run every minute
    setInterval(async () => {
        try {
            await checkAppointments();
        } catch (error) {
            console.error('Error in notification scheduler:', error);
        }
    }, 60 * 1000);
};

/**
 * Checks for appointments starting in 24h or 1h and sends notifications
 */
async function checkAppointments() {
    const now = new Date();

    // 1. Check 24 hour reminders (between 23.5 and 24.5 hours from now)
    const start24 = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const end24 = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    const appointments24 = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: start24,
                lte: end24
            },
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
        console.log(`[Scheduler] Sent 24h reminder for Appt ${appt.id}`);
    }

    // 2. Check 1 hour reminders (between 55 min and 65 min from now)
    const start1 = new Date(now.getTime() + 55 * 60 * 1000);
    const end1 = new Date(now.getTime() + 65 * 60 * 1000);

    const appointments1 = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: start1,
                lte: end1
            },
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
        console.log(`[Scheduler] Sent 1h reminder for Appt ${appt.id}`);
    }
}
