import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { socketService } from '../services/socketService';
// @ts-ignore
import webPush from 'web-push';

// Configurar VAPID
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@7pet.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let pushEnabled = false;

if (vapidPublicKey && vapidPrivateKey) {
    try {
        webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        pushEnabled = true;
        console.log('✅ Push Notifications VAPID configurado');
    } catch (error) {
        console.error('❌ Falha ao configurar VAPID:', error);
    }
} else {
    console.warn('⚠️ VAPID keys não configuradas. Push Notifications desabilitadas (apenas In-App).');
}

/**
 * Unified Helper to Create and Send Notifications (In-App + Socket + Push)
 * @param userId Target user ID
 * @param payload Notification data
 */
export const createNotification = async (userId: string, payload: {
    title: string;
    body: string;
    type: string; // 'chat', 'quote', 'system', etc.
    referenceId?: string; // id of referenced object (chatId, quoteId)
    icon?: string;
    data?: any;
}) => {
    try {
        // 1. Persist to Database (In-App History)
        const notification = await prisma.notification.create({
            data: {
                userId,
                title: payload.title,
                message: payload.body,
                type: payload.type,
                referenceId: payload.referenceId,
                read: false,
                data: payload.data ? JSON.stringify(payload.data) : undefined
            }
        });

        // 2. Emit Real-time Event (Socket.io)
        socketService.notifyUser(userId, 'notification:new', notification);

        // 3. Send Web Push (if enabled and user has subscriptions)
        if (pushEnabled) {
            const subscriptions = await prisma.pushSubscription.findMany({
                where: { userId }
            });

            if (subscriptions.length > 0) {
                const pushPayload = JSON.stringify({
                    title: payload.title,
                    body: payload.body,
                    icon: payload.icon || '/pwa-192x192.png',
                    badge: '/badge.png',
                    data: {
                        ...payload.data,
                        url: payload.data?.url || '/',
                        notificationId: notification.id
                    }
                });

                subscriptions.forEach(sub => {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    };

                    webPush.sendNotification(pushSubscription, pushPayload)
                        .catch(async (error: any) => {
                            if (error.statusCode === 410 || error.statusCode === 404) {
                                await prisma.pushSubscription.delete({ where: { id: sub.id } });
                            }
                        });
                });
            }
        }

        return notification;
    } catch (error) {
        console.error(`❌ Erro criando notificação para ${userId}:`, error);
        return null;
    }
};

// ... (Existing endpoints: subscribe, unsubscribe, listSubscriptions)

// Salvar subscription
export const subscribe = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { endpoint, keys } = req.body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Dados de subscription inválidos' });
        }

        await prisma.pushSubscription.upsert({
            where: { endpoint },
            create: {
                userId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            update: {
                userId,
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });

        res.json({ message: 'Subscription salva com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar subscription:', error);
        res.status(500).json({ error: 'Erro ao salvar subscription' });
    }
};

export const unsubscribe = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { endpoint } = req.body;

        await prisma.pushSubscription.deleteMany({
            where: { userId, endpoint }
        });

        res.json({ message: 'Subscription removida' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover subscription' });
    }
};

export const listSubscriptions = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, createdAt: true, endpoint: true }
        });
        res.json({
            count: subscriptions.length,
            subscriptions: subscriptions.map(s => ({
                ...s,
                endpoint: '...' + s.endpoint.slice(-10)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro listar subscriptions' });
    }
};

export const sendTestNotification = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id; // Send to self
        await createNotification(userId, {
            title: 'Teste de Notificação 🔔',
            body: 'Se você viu isso, o sistema universal está funcionando!',
            type: 'system',
            icon: '/pwa-192x192.png'
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar teste' });
    }
};

export const list = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: (page - 1) * limit
        });

        // Parse 'data' JSON if needed, or Prisma handles it if it's Json type? 
        // Prisma Json is object safely. If string in DB, might need parsing but schema says data is String?
        // Check schema later. Assuming String for now based on createNotification usage (JSON.stringify)
        const parsed = notifications.map(n => ({
            ...n,
            data: n.data ? JSON.parse(n.data as string) : null
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error listing notifications', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};
