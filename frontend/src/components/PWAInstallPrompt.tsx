import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt: React.FC = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);

            // Show the prompt only if it hasn't been dismissed in this session
            const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                // Show after 5 seconds to not be too intrusive
                setTimeout(() => setIsVisible(true), 5000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        // Show the prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setInstallPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 z-[200] md:left-auto md:max-w-sm"
                >
                    <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 p-6 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                                <Smartphone size={24} />
                            </div>

                            <div className="flex-1">
                                <h3 className="font-black text-secondary text-lg leading-tight mb-1">
                                    7pet no seu Celular
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                    Instale nosso app para um acesso mais rápido e notificações exclusivas.
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 py-3 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20"
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
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
