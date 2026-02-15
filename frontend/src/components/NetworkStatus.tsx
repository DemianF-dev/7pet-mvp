import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus: React.FC = () => {
    const [, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);
    const [statusType, setStatusType] = useState<'offline' | 'restored' | 'reconnecting'>('offline');
    const [offlineTimer, setOfflineTimer] = useState<number | null>(null);

    useEffect(() => {
        const handleOnline = () => {
            // Clear offline timer if exists
            if (offlineTimer) {
                clearTimeout(offlineTimer);
                setOfflineTimer(null);
            }

            setIsOnline(true);
            setStatusType('restored');
            setShowBanner(true);
            // Hide "back online" banner after 3 seconds
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setStatusType('offline');
            setShowBanner(true);

            // After 3 seconds offline, change to "reconnecting" message
            const timer = setTimeout(() => {
                if (!navigator.onLine) {
                    setStatusType('reconnecting');
                }
            }, 3000);
            setOfflineTimer(timer);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (offlineTimer) clearTimeout(offlineTimer);
        };
    }, []);

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
                >
                    <div className="flex justify-center p-4">
                        <div className={`
                            px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-xl border
                            ${statusType === 'offline' || statusType === 'reconnecting'
                                ? 'bg-red-500/90 text-white border-red-400/20'
                                : 'bg-green-500/90 text-white border-green-400/20'}
                        `}>
                            {statusType === 'offline' ? (
                                <>
                                    <WifiOff size={16} className="animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Sem Conexão</span>
                                </>
                            ) : statusType === 'reconnecting' ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Tentando Reconectar...</span>
                                </>
                            ) : (
                                <>
                                    <Wifi size={16} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Conexão Restabelecida</span>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NetworkStatus;
