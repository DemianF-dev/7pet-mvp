
import axios from 'axios';
import prisma from '../lib/prisma';
import { createNotification } from '../controllers/notificationController';
import { notificationSettingsService } from './notificationSettingsService';

/**
 * messagingService
 * Centralizes active communications (WhatsApp, Email, Push)
 * Current status: Preview/Stubs ready for implementation
 */
export const messagingService = {
    /**
     * Sends a WhatsApp message via an external provider (Stub)
     */
    async sendWhatsApp(phone: string, message: string): Promise<boolean> {
        console.log(`[MessagingService] Request to send WhatsApp to ${phone}: "${message}"`);

        // FUTURE: Integrate with Z-API, Twilio, or WPPConnect
        // Example:
        // const response = await axios.post(process.env.WA_API_URL, { phone, message });

        // For now, we simulate success if the number exists
        return !!phone;
    },

    /**
     * Sends an email via SMTP or Provider (Stub)
     */
    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        console.log(`[MessagingService] Request to send Email to ${to}: "${subject}"`);

        // FUTURE: Use Nodemailer with AWS SES, SendGrid, etc.
        return !!to;
    },

    /**
     * Routes a notification to active channels based on user preferences
     */
    async notifyUser(userId: string, title: string, message: string, type: string) {
        // 0. Check Notification Settings & Permissions
        const canReceive = await notificationSettingsService.canUserReceiveNotification(userId, type);
        if (!canReceive) {
            console.log(`[MessagingService] Notification blocked by settings for user ${userId}, type ${type}`);
            return null;
        }

        // 1. Create in-app notification (Delegated to createNotification to avoid duplication)
        // Historic bug fix: Removed redundant prisma.notification.create call here


        // 2. Fetch user/customer preferences
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { customer: true }
        });

        if (!user) return null;

        // Cast communicationPrefs to string array with fallback
        const prefsRaw = user.customer?.communicationPrefs as any;
        const prefs: string[] = (Array.isArray(prefsRaw)
            ? prefsRaw.filter((p: any) => typeof p === 'string')
            : ['APP']) as string[];
        const phone = user.phone || user.customer?.phone;

        // 3. Trigger Active Channels
        if (prefs.includes('WHATSAPP') && phone) {
            await this.sendWhatsApp(phone, `*${title}*\n\n${message}`);
        }

        if (prefs.includes('EMAIL') && user.email) {
            await this.sendEmail(user.email, title, message);
        }

        // 4. Trigger Push Notifications & Store in History (Single source of truth)
        try {
            return await createNotification(userId, {
                title,
                body: message,
                type: type,
                data: { generatedBy: 'messagingService' }
            });
        } catch (error: any) {
            console.error('[MessagingService] Erro ao disparar notificação unificada:', error);
            return null;
        }
    }
};

