import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketManager } from '../services/socketManager';
import { useSocketStore } from '../store/socketStore';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { Bell } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: 'chat' | 'quote' | 'system' | 'appointment';
    data?: any;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    subscribeToPush: () => Promise<void>;
    requestPermission: () => Promise<void>;
    permission: NotificationPermission;
    refetchNotifications: () => void;
    playSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Base64 encoded short notification sound (a gentle "ding")


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { status } = useSocketStore();
    void status; // Used to track socket connection status
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    const unreadCount = notifications.filter(n => !n.read).length;

    // Play notification sound using Web Audio API (No dependencies)
    const playSound = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            // "Ding" sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Erro ao tocar som:", e);
        }
    }, []);

    // Check permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('7pet-token');
        if (!token) return;

        try {
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
        } catch (err) {
            // Silent in production
        }
    }, []);

    // Load notifications on mount
    useEffect(() => {
        const timeoutId = setTimeout(fetchNotifications, 1000);
        return () => clearTimeout(timeoutId);
    }, [fetchNotifications]);

    // Play notification sound


    // Show browser notification
    const showBrowserNotification = useCallback((notification: Notification) => {
        if (permission !== 'granted') return;

        try {
            const browserNotification = new window.Notification(notification.title, {
                body: notification.message,
                icon: '/pwa-192x192.png',
                badge: '/badge.png',
                tag: notification.id,
                requireInteraction: false,
                silent: true // We play our own sound
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => browserNotification.close(), 5000);
        } catch (e) {
            // Silent fail in production
        }
    }, [permission]);

    // Get icon based on notification type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'chat': return '💬';
            case 'quote': return '📄';
            case 'appointment': return '📅';
            default: return '🔔';
        }
    };

    // Handle new notification (from notification:new event)
    useEffect(() => {
        const handleNewNotification = (notification: Notification) => {
            if (import.meta.env.DEV) console.log('🔔 Nova Notificação:', notification);
            setNotifications(prev => [notification, ...prev]);
            playSound();
            showBrowserNotification(notification);
            toast.custom(
                (t) => (
                    <div
                        onClick={() => {
                            toast.dismiss(t.id);
                            const url = notification.data?.url || (notification.type === 'chat' && notification.metadata?.chatId ? `/staff/chat?chatId=${notification.metadata.chatId}` : null);
                            if (url) window.location.href = url;
                        }}
                        className={`
                            ${t.visible ? 'animate-enter' : 'animate-leave'}
                            max-w-[calc(100vw-32px)] w-full sm:max-w-md
                            bg-[var(--color-bg-surface)] shadow-[var(--shadow-xl)] 
                            rounded-[var(--radius-xl)] pointer-events-auto flex 
                            border border-[var(--color-border)] 
                            cursor-pointer overflow-hidden
                        `.trim()}
                    >
                        <div className={`w-1.5 ${notification.type === 'chat' ? 'bg-[var(--color-accent-primary)]' : notification.type === 'quote' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent-primary)]'}`} />
                        <div className="flex-1 p-[var(--space-4)]">
                            <div className="flex items-start gap-4">
                                <span className="text-2xl mt-0.5">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-[var(--font-weight-bold)] text-[var(--color-text-primary)] truncate text-[var(--font-size-headline)]">{notification.title}</p>
                                    <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] line-clamp-2 mt-0.5 leading-snug">{notification.message}</p>
                                    <p className="text-[var(--font-size-caption2)] text-[var(--color-text-tertiary)] mt-2 font-[var(--font-weight-medium)]">agora mesmo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                { duration: 5000, position: 'top-right' }
            );
        };

        socketManager.on('notification:new', handleNewNotification);

        return () => {
            socketManager.off('notification:new', handleNewNotification);
        };
    }, [playSound, showBrowserNotification]);

    // Handle chat messages directly (WhatsApp-style instant notification)
    useEffect(() => {
        const handleChatMessage = (message: any) => {
            if (import.meta.env.DEV) console.log('💬 Chat message received:', message);
            const storedUser = localStorage.getItem('7pet-auth-storage');
            const currentUserId = storedUser ? JSON.parse(storedUser)?.state?.user?.id : null;
            if (message.senderId === currentUserId) return;
            playSound();
            const senderName = message.sender?.name || 'Nova mensagem';
            toast.custom(
                (t) => (
                    <div
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (message.conversationId) {
                                window.location.href = `/staff/chat?chatId=${message.conversationId}`;
                            } else {
                                window.location.href = `/staff/chat`;
                            }
                        }}
                        className={`
                            ${t.visible ? 'animate-enter' : 'animate-leave'}
                            max-w-[calc(100vw-32px)] w-full sm:max-w-md
                            bg-[var(--color-bg-surface)] shadow-[var(--shadow-xl)] 
                            rounded-[var(--radius-xl)] pointer-events-auto flex 
                            border border-[var(--color-border)] 
                            cursor-pointer overflow-hidden
                        `.trim()}
                    >
                        <div className="w-1.5 bg-[var(--color-accent-primary)]" />
                        <div className="flex-1 p-[var(--space-4)]">
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <span className="text-2xl">💬</span>
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--color-accent-primary)] rounded-full border-2 border-[var(--color-bg-surface)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-[var(--font-weight-bold)] text-[var(--color-text-primary)] truncate text-[var(--font-size-headline)]">{senderName}</p>
                                    <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] line-clamp-2 mt-0.5 leading-snug">{message.content}</p>
                                    <p className="text-[var(--font-size-caption2)] text-[var(--color-text-tertiary)] mt-2 font-[var(--font-weight-medium)]">agora mesmo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                { duration: 4000, position: 'top-right' }
            );
        };

        const handleAttention = (data: any) => {
            if (import.meta.env.DEV) console.log('⚠️ Attention received:', data);
            playSound();
            toast.custom(
                (t) => (
                    <div
                        onClick={() => {
                            toast.dismiss(t.id);
                            window.location.href = '/staff/chat';
                        }}
                        className={`
                            ${t.visible ? 'animate-bounce' : 'animate-leave'}
                            max-w-[calc(100vw-32px)] w-full sm:max-w-md
                            bg-[var(--color-error)] shadow-[0_0_50px_rgba(255,69,58,0.4)]
                            rounded-[var(--radius-2xl)] pointer-events-auto flex 
                            border-4 border-white/20 
                            cursor-pointer overflow-hidden p-[var(--space-6)] text-white
                        `.trim()}
                    >
                        <div className="flex items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-full">
                                <Bell size={40} className="text-white animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <p className="font-[var(--font-weight-bold)] text-xl uppercase tracking-tighter leading-none mb-1">CHAMADA DE ATENÇÃO!</p>
                                <p className="text-lg font-[var(--font-weight-medium)] opacity-90">Atenção, você tem uma mensagem urgente no chat.</p>
                                <p className="text-[var(--font-size-caption2)] font-[var(--font-weight-bold)] uppercase tracking-widest mt-4 opacity-80 underline">Toque para abrir agora</p>
                            </div>
                        </div>
                    </div>
                ),
                { duration: 15000, position: 'top-center' }
            );
        };

        socketManager.on('chat:new_message', handleChatMessage);
        socketManager.on('chat:attention', handleAttention);

        return () => {
            socketManager.off('chat:new_message', handleChatMessage);
            socketManager.off('chat:attention', handleAttention);
        };
    }, [playSound]);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        api.put(`/notifications/${id}/read`).catch(console.error);
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        api.put('/notifications/read-all').catch(console.error);
    }, []);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            toast.error('Seu navegador não suporta notificações');
            return;
        }

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                toast.success('🔔 Notificações ativadas!');
            } else if (perm === 'denied') {
                toast.error('Notificações bloqueadas. Altere nas configurações do navegador.');
            }
        } catch (e) {
            console.error('Permission request failed', e);
        }
    }, []);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = useCallback(async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            await requestPermission();

            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;
            const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!VAPID_PUBLIC_KEY) {
                console.warn('VAPID Key not configured');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await api.post('/notifications/subscribe', subscription);
            toast.success('Push notifications ativadas!');
        } catch (error) {
            console.error('Erro push:', error);
        }
    }, [permission, requestPermission]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            subscribeToPush,
            requestPermission,
            permission,
            refetchNotifications: fetchNotifications,
            playSound
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};
