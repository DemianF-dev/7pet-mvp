import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, BellOff, Download, Wifi, WifiOff, Smartphone, Check, X, ArrowLeft } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'react-hot-toast';
import ThemePicker from './ThemePicker';
import { APP_VERSION } from '../constants/version';
import { useAuthStore } from '../store/authStore';
import DiagnosticsModal from './DiagnosticsModal';

const PWASettings: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isMaster = user?.role === 'MASTER';
    const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
    const {
        supported,
        permission,
        subscription,
        requestPermission,
        unsubscribe,
        sendTestNotification,
        sendBackendTestNotification,
        isGranted,
        isDenied
    } = usePushNotifications();


    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detectar iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Detectar mudanças de conexão
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Conexão restaurada! 🌐', { icon: '✅' });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error('Você está offline! Algumas funções podem estar limitadas.', {
                icon: '📵',
                duration: 4000
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Detectar prompt de instalação
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detectar se já está instalado
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            toast.error('Instalação não disponível neste momento');
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast.success('App instalado com sucesso! 🎉');
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Header com botão voltar */}
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-medium"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <h1 className="text-3xl font-extrabold text-text-primary mb-2">
                        Configurações do <span className="text-primary">App</span>
                    </h1>
                    <p className="text-text-secondary font-medium">
                        Personalize sua experiência, notificações e modo offline
                    </p>
                </div>

                {/* Theme Selector */}
                <div className="bg-bg-surface rounded-3xl border border-border p-6 shadow-sm">
                    <ThemePicker />
                </div>

                {/* Status de Conexão */}
                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`p-6 rounded-3xl border-2 ${isOnline
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isOnline ? (
                                <Wifi className="text-green-600" size={24} />
                            ) : (
                                <WifiOff className="text-orange-600" size={24} />
                            )}
                            <div>
                                <h3 className={`font-bold ${isOnline ? 'text-green-900' : 'text-orange-900'
                                    }`}>
                                    {isOnline ? 'Conectado' : 'Offline'}
                                </h3>
                                <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                                    {isOnline
                                        ? 'Todas as funcionalidades disponíveis'
                                        : 'Modo offline - Dados em cache disponíveis'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                            }`} />
                    </div>
                </motion.div>

                {/* Instalação do App */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Smartphone className="text-primary" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Instalar App</h3>
                                <p className="text-sm text-slate-500">Use como aplicativo nativo</p>
                            </div>
                        </div>
                        {isInstalled ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <Check size={14} /> Instalado
                            </span>
                        ) : null}
                    </div>

                    {isInstalled ? (
                        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">
                            ✅ O app já está instalado! Você pode acessá-lo pela tela inicial do seu dispositivo.
                        </div>
                    ) : deferredPrompt ? (
                        <button
                            onClick={handleInstallClick}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Instalar App na Tela Inicial
                        </button>
                    ) : (
                        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">
                            💡 Para instalar:
                            <ul className="mt-2 space-y-1 ml-4 list-disc">
                                <li><strong>Android/Chrome:</strong> Menu (⋮) → "Adicionar à tela inicial"</li>
                                <li><strong>iOS/Safari:</strong> Compartilhar (□↑) → "Adicionar à Tela de Início"</li>
                                <li><strong>Desktop:</strong> Ícone (⊕) na barra de endereço</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Push Notifications */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                {isGranted ? (
                                    <Bell className="text-indigo-600" size={20} />
                                ) : (
                                    <BellOff className="text-slate-400" size={20} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Notificações Push</h3>
                                <p className="text-sm text-slate-500">
                                    Receba alertas de agendamentos e lembretes
                                </p>
                            </div>
                        </div>
                        {isGranted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <Check size={14} /> Ativo
                            </span>
                        ) : isDenied ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                <X size={14} /> Bloqueado
                            </span>
                        ) : null}
                    </div>

                    {!supported ? (
                        <div className="text-sm text-orange-600 bg-orange-50 p-4 rounded-2xl">
                            ⚠️ Push Notifications não são suportadas neste navegador
                        </div>
                    ) : isGranted ? (
                        <div className="space-y-3">
                            <div className="text-sm text-green-600 bg-green-50 p-4 rounded-2xl">
                                ✅ Notificações ativadas! Você receberá alertas importantes.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                    onClick={sendTestNotification}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                                    title="Testa se o navegador pode mostrar notificações agora"
                                >
                                    Teste Local (Browser)
                                </button>
                                <button
                                    onClick={sendBackendTestNotification}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                                    title="Testa o envio real via servidor (Requer VAPID Keys)"
                                >
                                    Teste Real (Servidor)
                                </button>
                                <button
                                    onClick={unsubscribe}
                                    className="sm:col-span-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    Desativar Notificações
                                </button>
                            </div>

                        </div>
                    ) : isDenied ? (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-2xl">
                            🚫 Você bloqueou as notificações. Para ativar:
                            {isIOS ? (
                                <ul className="mt-2 ml-4 list-disc space-y-1">
                                    <li><strong>Passo 1:</strong> Abra os <strong>Ajustes</strong> do iOS</li>
                                    <li><strong>Passo 2:</strong> Role até encontrar <strong>7Pet</strong> (ou o nome do app)</li>
                                    <li><strong>Passo 3:</strong> Toque em <strong>Notificações</strong></li>
                                    <li><strong>Passo 4:</strong> Ative <strong>"Permitir Notificações"</strong></li>
                                </ul>
                            ) : (
                                <ul className="mt-2 ml-4 list-disc space-y-1">
                                    <li>Configurações do navegador</li>
                                    <li>Notificações ou Permissões</li>
                                    <li>Encontre este site e permita notificações</li>
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isIOS && !isInstalled && (
                                <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-2xl">
                                    📱 <strong>Usuário iOS:</strong> Para receber notificações, você precisa:
                                    <ol className="mt-2 ml-4 list-decimal space-y-1">
                                        <li>Instalar o app na tela inicial (veja seção acima)</li>
                                        <li>Abrir o app instalado (não pelo Safari)</li>
                                        <li>Voltar aqui e ativar as notificações</li>
                                    </ol>
                                </div>
                            )}
                            {isIOS && isInstalled && (
                                <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-2xl">
                                    ⚠️ <strong>Nota iOS:</strong> Se o botão abaixo não solicitar permissão automaticamente, vá em:
                                    <br /><strong>Ajustes → 7Pet → Notificações</strong> e ative manualmente.
                                </div>
                            )}
                            <button
                                onClick={requestPermission}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >

                                <Bell size={18} />
                                Ativar Notificações
                            </button>
                        </div>
                    )}
                </div>

                {/* Informações Adicionais */}
                <div className="bg-slate-50 rounded-3xl border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-3">ℹ️ Recursos Offline</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                            <Check className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                            <span><strong>Visualização de dados:</strong> Últimos 200 registros acessados</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                            <span><strong>Imagens:</strong> Até 100 imagens em cache (30 dias)</span>
                        </li>
                    </ul>
                </div>

                {/* Developer Console - MASTER ONLY */}
                {isMaster && (
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4">
                            <Terminal className="text-primary/20 opacity-30" size={40} />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <Activity className="text-primary" size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Developer Console</h3>
                                <p className="text-sm text-slate-400">Ferramentas de observabilidade mobile</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDiagnosticsOpen(true)}
                            className="w-full py-4 bg-slate-800 text-primary font-black rounded-2xl text-[10px] uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Terminal size={16} />
                            Abrir Mobile Diagnostics
                        </button>
                    </div>
                )}

                <div className="text-center pb-6">
                    <p className="text-xs text-text-tertiary font-mono opacity-50">
                        {APP_VERSION}
                    </p>
                </div>
            </motion.div>

            <DiagnosticsModal
                isOpen={isDiagnosticsOpen}
                onClose={() => setIsDiagnosticsOpen(false)}
            />
        </div>
    );
};

export default PWASettings;
