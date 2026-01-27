import { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Bell } from 'lucide-react';

export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, permission, subscribeToPush } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm">Notificações</h3>
                            {permission !== 'granted' && (
                                <button
                                    onClick={subscribeToPush}
                                    className="text-xs text-blue-600 font-semibold hover:underline"
                                >
                                    Ativar Push
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className="shrink-0 mt-1">
                                                    {notification.type === 'chat' && <span className="text-xl">💬</span>}
                                                    {notification.type === 'quote' && <span className="text-xl">💰</span>}
                                                    {notification.type === 'system' && <span className="text-xl">🔔</span>}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                                        Agora
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
