import { useCallback } from 'react';

/**
 * useHaptic Hook
 * Provides a safe way to trigger device vibration (haptic feedback) on supported devices.
 */
export const useHaptic = () => {
    /**
     * Trigger a haptic feedback pattern.
     * @param pattern - 'light', 'medium', 'heavy', 'success', 'error', or custom duration in ms.
     */
    const trigger = useCallback((pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' | number = 'light') => {
        // Check for navigator.vibrate support
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            try {
                switch (pattern) {
                    case 'light':
                        window.navigator.vibrate(10); // Very subtle tick
                        break;
                    case 'medium':
                        window.navigator.vibrate(40); // Standard click
                        break;
                    case 'heavy':
                        window.navigator.vibrate(70); // Firm bump
                        break;
                    case 'success':
                        window.navigator.vibrate([20, 40, 20]); // Da-da-da
                        break;
                    case 'error':
                        window.navigator.vibrate([50, 30, 50, 30, 50]); // Buzz-buzz-buzz
                        break;
                    default:
                        if (typeof pattern === 'number') {
                            window.navigator.vibrate(pattern);
                        }
                        break;
                }
            } catch (e) {
                // Ignore errors (some browsers block vibration without user interaction)
                console.debug('Haptic feedback not supported or blocked', e);
            }
        }
    }, []);

    return { trigger };
};
