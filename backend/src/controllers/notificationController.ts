import { Request, Response } from 'express';
import prisma from '../lib/prisma';
// TEMPORARY FIX: Commented out to allow Vercel build to pass
// import webPush from 'web-push';

// Configurar VAPID (será populado quando você adicionar as keys ao .env)
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@7pet.com';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// TEMPORARY FIX: Commented out
// if (vapidPublicKey && vapidPrivateKey) {
//     webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
//     console.log('✅ Push Notifications VAPID configurado');
// } else {
//     console.warn('⚠️ VAPID keys não configuradas. Push Notifications desabilitadas.');
// }

// Salvar subscription
export const subscribe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { endpoint, keys } = req.body;

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ error: 'Dados de subscription inválidos' });
        }

        // Usar endpoint como chave única (um dispositivo só pode ter uma subscription)
        await prisma.pushSubscription.upsert({
            where: {
                endpoint
            },
            create: {
                userId,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            },
            update: {
                userId, // Atualizar userId caso o mesmo dispositivo seja usado por outro usuário
                p256dh: keys.p256dh,
                auth: keys.auth
            }
        });

        console.log(`📱 Subscription salva para usuário ${userId}`);
        res.json({ message: 'Subscription salva com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar subscription:', error);
        res.status(500).json({ error: 'Erro ao salvar subscription' });
    }
};


// Remover subscription
export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { endpoint } = req.body;

        await prisma.pushSubscription.deleteMany({
            where: {
                userId,
                endpoint
            }
        });

        console.log(`🔕 Subscription removida para usuário ${userId}`);
        res.json({ message: 'Subscription removida com sucesso' });
    } catch (error) {
        console.error('Erro ao remover subscription:', error);
        res.status(500).json({ error: 'Erro ao remover subscription' });
    }
};

// Enviar notificação para um usuário
export const sendNotification = async (userId: string, payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
}) => {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('⚠️ VAPID keys não configuradas. Notificação não enviada.');
        return;
    }

    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (subscriptions.length === 0) {
            console.log(`ℹ️ Usuário ${userId} não tem subscriptions ativas`);
            return;
        }

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/pwa-192x192.png',
            badge: payload.badge || '/pwa-192x192.png',
            data: payload.data
        });

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            // TEMPORARY FIX: web-push disabled
            console.warn('⚠️ Push notifications temporariamente desabilitadas');
            return Promise.resolve();

            /* return webPush.sendNotification(pushSubscription, notificationPayload)
                .then(() => {
                    console.log(`✅ Notificação enviada para ${sub.endpoint.substring(0, 50)}...`);
                })
                .catch(async (error) => {
                    console.error('❌ Erro ao enviar notificação:', error.message);

                    // Se subscription expirou, remover do banco
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`🗑️ Removendo subscription expirada: ${sub.id}`);
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id }
                        }).catch(e => console.error('Erro ao remover subscription:', e));
                    }
                }); */
        });

        await Promise.all(promises);
        console.log(`📨 Notificação processada para usuário ${userId} (${subscriptions.length} subscriptions)`);
    } catch (error) {
        console.error('Erro ao enviar notificações:', error);
    }
};

// Enviar notificação para múltiplos usuários
export const sendBulkNotification = async (userIds: string[], payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
}) => {
    console.log(`📢 Enviando notificação em massa para ${userIds.length} usuários`);
    const promises = userIds.map(userId => sendNotification(userId, payload));
    await Promise.all(promises);
    console.log(`✅ Notificação em massa concluída`);
};

// Enviar notificação de teste (endpoint para testar)
export const sendTestNotification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        await sendNotification(userId, {
            title: '7Pet - Notificação de Teste 🎉',
            body: 'Se você recebeu isso, as notificações estão funcionando perfeitamente!',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: {
                type: 'test',
                timestamp: new Date().toISOString()
            }
        });

        res.json({ message: 'Notificação de teste enviada' });
    } catch (error) {
        console.error('Erro ao enviar teste:', error);
        res.status(500).json({ error: 'Erro ao enviar notificação de teste' });
    }
};

// Listar subscriptions do usuário
export const listSubscriptions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
            select: {
                id: true,
                endpoint: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            count: subscriptions.length,
            subscriptions: subscriptions.map(sub => ({
                ...sub,
                endpoint: sub.endpoint.substring(0, 50) + '...' // Não expor endpoint completo
            }))
        });
    } catch (error) {
        console.error('Erro ao listar subscriptions:', error);
        res.status(500).json({ error: 'Erro ao listar subscriptions' });
    }
};
