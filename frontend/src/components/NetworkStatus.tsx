import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);
    const [statusType, setStatusType] = useState<'offline' | 'restored' | 'syncing'>('offline');

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setStatusType('restored');
            setShowBanner(true);
            // Hide "back online" banner after 4 seconds
            setTimeout(() => setShowBanner(false), 4000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setStatusType('offline');
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Also check for periodic sync status if we were to implement it

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
                            ${statusType === 'offline'
                                ? 'bg-red-500/90 text-white border-red-400/20'
                                : 'bg-green-500/90 text-white border-green-400/20'}
                        `}>
                            {statusType === 'offline' ? (
                                <>
                                    <WifiOff size={16} className="animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest">Sem Conexão</span>
                                </>
                            ) : (
                                <>
                                    <Wifi size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Conexão Restabelecida</span>
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
