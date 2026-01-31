import { useState, useEffect } from 'react';

// Default mobile breakpoint (md in Tailwind)
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean>(() => {
        // SSR safe default
        if (typeof window === 'undefined') return false;
        return window.innerWidth < MOBILE_BREAKPOINT;
    });

    const [isStandalone, setIsStandalone] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        const checkStandalone = () => {
            const isPWA = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone // iOS Legacy
                || document.referrer.includes('android-app://');

            setIsStandalone(!!isPWA);
        };

        checkMobile();
        checkStandalone();

        window.addEventListener('resize', checkMobile);
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
        };
    }, []);

    return {
        isMobile,
        isDesktop: !isMobile,
        isStandalone
    };
}

export default useIsMobile;
