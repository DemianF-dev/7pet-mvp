/**
 * Haptics Utility
 * Provides tactile feedback for PWA users on supported devices.
 * Uses the Web Vibrations API.
 */

export const Haptics = {
    /**
     * Light tap for subtle interactions (e.g., clicking a button)
     */
    light: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    },

    /**
     * Medium tap for standard actions (e.g., toggling a switch)
     */
    medium: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    },

    /**
     * Success feedback (double short vibration)
     */
    success: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([20, 30, 20]);
        }
    },

    /**
     * Error feedback (longer, distinct vibration)
     */
    error: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]);
        }
    },

    /**
     * Warning feedback
     */
    warning: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 30]);
        }
    },

    /**
     * Heavy feedback for major actions (e.g., deleting a record)
     */
    heavy: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }
};

export default Haptics;
