import { useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Bell, CheckCircle, Clock, Volume2, Settings } from 'lucide-react';

import { useNotification } from '../../context/NotificationContext';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function NotificationList() {
    const { } = useAuthStore();
    const { notifications, markAsRead, markAllAsRead, requestPermission, permission, playSound } = useNotification();
    const testAudioRef = useRef<HTMLAudioElement | null>(null);

    const testSound = () => {
        playSound();
    };

    const testToast = () => {
        toast.custom(
            (t) => (
                <div
                    onClick={() => toast.dismiss(t.id)}
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer overflow-hidden`}
                >
                    <div className="w-2 bg-blue-500" />
                    <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🔔</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900">Teste de Notificação</p>
                                <p className="text-sm text-gray-500">Se você está vendo isso, o sistema visual está funcionando!</p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            { duration: 4000, position: 'top-right' }
        );
        testSound();
    };

    return (
        <main className="p-6 md:p-10 max-w-4xl">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-secondary">
                        Minhas <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Notificações</span>
                    </h1>
                    <p className="text-gray-500 mt-2">Gerencie seus alertas e avisos.</p>
                </div>

                <div className="flex items-center gap-3">
                    {notifications.some(n => !n.read) && (
                        <button onClick={markAllAsRead} className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition">
                            Marcar todas como lidas
                        </button>
                    )}
                </div>
            </header>

            {/* Control Panel */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                <h3 className="font-bold text-secondary flex items-center gap-2 mb-4">
                    <Settings size={18} /> Configurações de Alerta
                </h3>
                <div className="flex flex-wrap gap-4">
                    {permission !== 'granted' && (
                        <button
                            onClick={requestPermission}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Bell size={16} /> Ativar Notificações no Navegador
                        </button>
                    )}
                    <button
                        onClick={testToast}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                    >
                        <Volume2 size={16} /> Testar Som e Popup
                    </button>

                    <button
                        onClick={async () => {
                            const toastId = toast.loading('Enviando teste via Socket...');
                            try {
                                await api.post('/notifications/test', {});
                                toast.success('Comando enviado! Aguarde o popup e som...', { id: toastId });
                            } catch (e) {
                                toast.error('Erro ao chamar API de teste', { id: toastId });
                                console.error(e);
                            }
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-100 transition flex items-center gap-2"
                    >
                        <span className="text-lg">📡</span> Testar Conexão Real
                    </button>

                    <div className="ml-auto flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        STATUS SOM:
                        <span className={permission === 'granted' ? 'text-green-500 font-bold' : 'text-orange-500 font-bold'}>
                            {permission === 'granted' ? 'ATIVO' : 'PENDENTE'}
                        </span>
                    </div>
                </div>
            </div>

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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.type?.includes('URGENT') ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
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
        </main>
    );
}
