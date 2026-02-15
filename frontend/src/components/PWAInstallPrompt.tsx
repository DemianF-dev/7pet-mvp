import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOS, isStandalone } from '../utils/swStatus';
import { useAuthStore } from '../store/authStore';

// Type declaration for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        // Don't show if already installed
        if (isStandalone()) return;

        // Session/Visit counting logic
        const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0');
        void localStorage.getItem('pwa_last_prompt_date'); // lastPromptDate - reserved for future
        const now = Date.now();

        // Simple visit counter
        if (visitCount < 10) {
            localStorage.setItem('pwa_visit_count', (visitCount + 1).toString());
        }

        const isDismissed = localStorage.getItem('pwa_prompt_dismissed_v2');
        const dismissedAt = parseInt(localStorage.getItem('pwa_prompt_dismissed_at') || '0');

        // If dismissed, wait 30 days
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        const canShowAgain = now - dismissedAt > thirtyDays;

        const handler = (e: any) => {
            // Prevent the default browser install prompt
            e.preventDefault();
            setInstallPrompt(e);

            // Log for debugging
            console.log('PWA: beforeinstallprompt event captured', { 
                user: !!user, 
                visitCount, 
                isDismissed, 
                canShowAgain 
            });

            // Show after 3 visits and if not dismissed recently, and only for logged in users
            if (user && visitCount >= 3 && (!isDismissed || canShowAgain)) {
                console.log('PWA: Showing install prompt after delay');
                setTimeout(() => setIsVisible(true), 10000);
            } else {
                console.log('PWA: Not showing prompt', { 
                    hasUser: !!user, 
                    visitCount, 
                    isDismissed, 
                    canShowAgain 
                });
            }
        };

        // Android/Chrome logic
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Specific Logic
        if (isIOS() && user && visitCount >= 3 && (!isDismissed || canShowAgain)) {
            setTimeout(() => setIsVisible(true), 10000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, [user]);

    const handleInstallClick = async () => {
        if (isIOS()) {
            setShowIOSInstructions(true);
            return;
        }

        if (!installPrompt) {
            console.error('PWA: No install prompt event available');
            return;
        }

        console.log('PWA: Showing native install prompt');
        try {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            console.log(`PWA: User response to the install prompt: ${outcome}`);

            setInstallPrompt(null);
            setIsVisible(false);
        } catch (error) {
            console.error('PWA: Error showing install prompt:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_prompt_dismissed_v2', 'true');
        localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-[200] lg:left-auto lg:right-6 lg:max-w-sm"
                >
                    <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 p-6 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        {!showIOSInstructions ? (
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                                    <Smartphone size={24} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-secondary text-lg leading-tight mb-1">
                                        {isIOS() ? '7Pet no seu iPhone' : '7Pet no seu Celular'}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                        Tenha um acesso mais rápido e estável instalando nosso aplicativo.
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleInstallClick}
                                            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            <Download size={16} /> Instalar agora
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-3 bg-gray-50 text-gray-400 font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors"
                                        >
                                            Depois
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-secondary text-lg">Instalar no iOS</h3>
                                    <button onClick={() => setShowIOSInstructions(false)} className="text-gray-400">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center shrink-0">
                                            <Share2 size={16} className="text-primary" />
                                        </div>
                                        <span>Toque no botão de <strong>Compartilhar</strong> na barra do Safari.</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl">
                                        <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center shrink-0">
                                            <PlusSquare size={16} className="text-primary" />
                                        </div>
                                        <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-4 bg-secondary text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest"
                                >
                                    Entendi, valeu!
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
