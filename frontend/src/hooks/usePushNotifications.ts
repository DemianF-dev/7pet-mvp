import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

interface NotificationPermissionState {
    permission: NotificationPermission | null;
    supported: boolean;
    subscription: PushSubscription | null;
}

export const usePushNotifications = () => {
    const [notificationState, setNotificationState] = useState<NotificationPermissionState>({
        permission: null,
        supported: false,
        subscription: null
    });

    useEffect(() => {
        // Verifica se Push Notifications são suportadas
        const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

        setNotificationState(prev => ({
            ...prev,
            supported: isSupported,
            permission: isSupported ? Notification.permission : null
        }));

        // Carrega subscription existente
        if (isSupported) {
            loadExistingSubscription();
        }
    }, []);

    const loadExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            setNotificationState(prev => ({
                ...prev,
                subscription
            }));
        } catch (error) {
            console.error('Erro ao carregar subscription:', error);
        }
    };

    const requestPermission = async (): Promise<boolean> => {
        if (!notificationState.supported) {
            toast.error('Push Notifications não são suportadas neste navegador');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();

            setNotificationState(prev => ({
                ...prev,
                permission
            }));

            if (permission === 'granted') {
                toast.success('Notificações ativadas! ✨');
                await subscribeToPush();
                return true;
            } else if (permission === 'denied') {
                toast.error('Você bloqueou as notificações. Ative nas configurações do navegador.');
                return false;
            }

            return false;
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            toast.error('Erro ao solicitar permissão para notificações');
            return false;
        }
    };

    const subscribeToPush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;

            // VAPID public key da variável de ambiente
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey || vapidPublicKey === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
                console.warn('VAPID Public Key não configurada no frontend');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any
            });


            setNotificationState(prev => ({
                ...prev,
                subscription
            }));

            // Enviar subscription para o backend
            await saveSubscriptionToBackend(subscription);

            console.log('Push subscription criada:', subscription);
        } catch (error) {
            console.error('Erro ao criar push subscription:', error);
            toast.error('Erro ao configurar notificações push. Verifique se a VAPID Public Key é válida.');
        }
    };

    const saveSubscriptionToBackend = async (subscription: PushSubscription) => {
        try {
            const subData = subscription.toJSON();
            await api.post('/notifications/subscribe', {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subData.keys?.p256dh,
                    auth: subData.keys?.auth
                }
            });
            console.log('Subscription salva no servidor');
        } catch (error) {
            console.error('Erro ao salvar subscription:', error);
            toast.error('A permissão foi dada, mas não conseguimos salvar no servidor.');
        }
    };

    const unsubscribe = async () => {
        try {
            if (notificationState.subscription) {
                const endpoint = notificationState.subscription.endpoint;
                await notificationState.subscription.unsubscribe();
                setNotificationState(prev => ({
                    ...prev,
                    subscription: null
                }));

                toast.success('Notificações desativadas');

                // Remover do backend
                await api.post('/notifications/unsubscribe', { endpoint });
            }
        } catch (error) {
            console.error('Erro ao cancelar subscription:', error);
            toast.error('Erro ao desativar notificações no servidor');
        }
    };

    const sendTestNotification = () => {
        if (notificationState.permission === 'granted') {
            new Notification('7Pet - Teste Local', {
                body: 'Notificações locais estão funcionando! 🎉',
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: 'test-notification'
            });
        }
    };

    const sendBackendTestNotification = async () => {
        try {
            await api.post('/notifications/test');
            toast.success('Solicitação de teste enviada ao servidor!');
        } catch (error) {
            console.error('Erro ao enviar teste para backend:', error);
            toast.error('Erro ao enviar teste real. Verifique se as VAPID keys estão configuradas.');
        }
    };

    return {
        ...notificationState,
        requestPermission,
        unsubscribe,
        sendTestNotification,
        sendBackendTestNotification,
        isGranted: notificationState.permission === 'granted',
        isDenied: notificationState.permission === 'denied'
    };
};


// Utility function para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
