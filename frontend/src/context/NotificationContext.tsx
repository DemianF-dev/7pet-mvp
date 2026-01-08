import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { Bell, MessageCircle, FileText, AlertCircle } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    type: 'chat' | 'quote' | 'system' | 'appointment';
    data?: any;
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
    const { socket, isConnected } = useSocket();
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
            console.log('Notifications not available');
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
            console.log('Browser notification failed');
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
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            console.log('🔔 Nova Notificação:', notification);

            // Add to list
            setNotifications(prev => [notification, ...prev]);

            // Play Sound
            playSound();

            // Show Browser Notification
            showBrowserNotification(notification);

            // Show Toast with styled content
            toast.custom(
                (t) => (
                    <div
                        onClick={() => toast.dismiss(t.id)}
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer overflow-hidden`}
                    >
                        <div className={`w-2 ${notification.type === 'chat' ? 'bg-blue-500' : notification.type === 'quote' ? 'bg-green-500' : 'bg-primary'}`} />
                        <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{notification.title}</p>
                                    <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Agora mesmo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                { duration: 5000, position: 'top-right' }
            );
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [socket, playSound, showBrowserNotification]);

    // Handle chat messages directly (WhatsApp-style instant notification)
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message: any) => {
            console.log('💬 Chat message received:', message);

            // Get current user ID from localStorage (zustand persist uses this key)
            const storedUser = localStorage.getItem('7pet-auth-storage');
            const currentUserId = storedUser ? JSON.parse(storedUser)?.state?.user?.id : null;

            // Skip if message is from current user
            if (message.senderId === currentUserId) return;

            // Play sound immediately
            playSound();

            // Show toast for chat message
            const senderName = message.sender?.name || 'Nova mensagem';
            toast.custom(
                (t) => (
                    <div
                        onClick={() => toast.dismiss(t.id)}
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer overflow-hidden`}
                    >
                        <div className="w-2 bg-blue-500" />
                        <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💬</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{senderName}</p>
                                    <p className="text-sm text-gray-500 line-clamp-2">{message.content}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Agora mesmo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                { duration: 4000, position: 'top-right' }
            );
        };

        socket.on('chat:new_message', handleChatMessage);

        return () => {
            socket.off('chat:new_message', handleChatMessage);
        };
    }, [socket, playSound]);

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
