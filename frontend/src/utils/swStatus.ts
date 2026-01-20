/**
 * Utility to get Service Worker status
 */
export type SWStatus = 'unsupported' | 'registering' | 'active' | 'waiting' | 'need-refresh' | 'offline-ready';

export async function getSWStatus(): Promise<SWStatus> {
    if (!('serviceWorker' in navigator)) {
        return 'unsupported';
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
            return 'registering';
        }

        if (registration.waiting) {
            return 'need-refresh';
        }

        if (registration.active) {
            return 'active';
        }

        return 'registering';
    } catch (error) {
        console.error('Error getting SW status:', error);
        return 'unsupported';
    }
}

/**
 * Checks if the app is running in standalone mode (PWA installed)
 */
export function isStandalone(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
    );
}

/**
 * Checks if the browser is iOS Safari
 */
export function isIOS(): boolean {
    return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
    );
}
