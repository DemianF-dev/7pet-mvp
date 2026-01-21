import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { socketManager } from '../services/socketManager';
import logger from '../utils/logger';

/**
 * useSocketLifecycle - Manages the connection lifecycle based on auth state and visibility.
 * This hook should be called at the root level (App shell).
 */
export const useSocketLifecycle = () => {
    const { user, token, isInitialized } = useAuthStore();
    const connectTimer = useRef<number | null>(null);

    useEffect(() => {
        if (!isInitialized) return;

        const cleanupTimer = () => {
            if (connectTimer.current) {
                clearTimeout(connectTimer.current);
                connectTimer.current = null;
            }
        };

        if (user && token) {
            // Debounce connection to avoid multiple rapid connects
            cleanupTimer();
            connectTimer.current = setTimeout(() => {
                socketManager.connect(user.id, token);
            }, 500);
        } else {
            cleanupTimer();
            socketManager.disconnect('auth_lost');
        }

        return () => cleanupTimer();
    }, [user?.id, token, isInitialized]);

    useEffect(() => {
        // Handle Visibility Change (Background/Foreground)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                socketManager.pause();
            } else {
                socketManager.resume();
            }
        };

        // Handle Online/Offline browser events
        const handleOnline = () => {
            logger.info('🌐 Browser back online, attempting socket resume');
            socketManager.resume();
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, []);
};
