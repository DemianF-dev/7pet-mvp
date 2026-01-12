import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized.
 * Uses media query (max-width: 768px) for responsive detection.
 * SSR-safe with useState/useEffect pattern.
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check initial value
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);

        // Listen for changes
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);

        return () => mq.removeEventListener('change', handler);
    }, []);

    return isMobile;
}

export default useIsMobile;
