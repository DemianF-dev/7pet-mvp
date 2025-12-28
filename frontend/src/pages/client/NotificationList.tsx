
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationList() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (err) {
            console.error('Error fetching notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        try {
            await api.put(`/notifications/read-all`);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-4xl">
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">
                            Minhas <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Notificações</span>
                        </h1>
                        <p className="text-gray-500 mt-3">Avisos importantes sobre seus agendamentos e conta.</p>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button onClick={markAllRead} className="text-sm font-bold text-primary hover:underline">
                            Marcar todas como lidas
                        </button>
                    )}
                </header>

                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                                <Bell className="mx-auto text-gray-200 mb-4" size={48} />
                                <p className="text-gray-400 font-bold">Nenhuma notificação por enquanto.</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`p-6 rounded-2xl border flex gap-4 transition-all ${notification.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-primary/20 shadow-lg shadow-primary/5'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.type.includes('URGENT') ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-secondary mb-1">{notification.title}</h3>
                                        <p className="text-gray-500 text-sm mb-2">{notification.message}</p>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(notification.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    {!notification.read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="self-start p-2 text-primary hover:bg-primary/10 rounded-full"
                                            title="Marcar como lida"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
