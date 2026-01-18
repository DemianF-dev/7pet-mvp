/**
 * Google Maps Loader - Singleton for loading Google Maps JavaScript API
 * Ensures the script is loaded only once and provides error handling
 */

let loadPromise: Promise<boolean> | null = null;
let isLoaded = false;
let lastError: string | null = null;

export interface GoogleMapsLoaderStatus {
    loaded: boolean;
    error?: string;
}

/**
 * Load Google Maps JavaScript API with Places library
 * Returns true if loaded successfully, false otherwise
 * This is idempotent - multiple calls return the same promise
 */
export async function loadGoogleMaps(): Promise<boolean> {
    // Already loaded
    if (isLoaded && typeof (window as any).google?.maps?.places !== 'undefined') {
        return true;
    }

    // Loading in progress
    if (loadPromise) {
        return loadPromise;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;

    if (!apiKey) {
        lastError = 'VITE_GOOGLE_MAPS_BROWSER_KEY is missing from environment variables';
        console.error('[GoogleMapsLoader]', lastError);
        return false;
    }

    // Check if already loaded by another script tag
    if (typeof (window as any).google?.maps?.places !== 'undefined') {
        isLoaded = true;
        return true;
    }

    // Create load promise
    loadPromise = new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log('[GoogleMapsLoader] Google Maps script loaded successfully');
            isLoaded = true;
            lastError = null;
            resolve(true);
        };

        script.onerror = (error) => {
            lastError = 'Failed to load Google Maps script. Check console for details.';
            console.error('[GoogleMapsLoader] Script load error:', error);
            console.error('[GoogleMapsLoader] Possible causes:');
            console.error('  1. Invalid API key');
            console.error('  2. HTTP referrer restrictions blocking this domain');
            console.error('  3. Places API not enabled in Google Cloud Console');
            console.error('  4. Network connectivity issues');
            resolve(false);
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}

/**
 * Get the current status of Google Maps loader
 */
export function getLoaderStatus(): GoogleMapsLoaderStatus {
    return {
        loaded: isLoaded,
        error: lastError || undefined
    };
}

/**
 * Check if Google Maps is ready to use
 */
export function isGoogleMapsReady(): boolean {
    return isLoaded && typeof (window as any).google?.maps?.places !== 'undefined';
}
