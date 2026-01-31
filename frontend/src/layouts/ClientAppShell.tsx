import { useIsMobile } from '../hooks/useIsMobile';
import ClientDesktopShell from './ClientDesktopShell';
import MobileAppLayout from './MobileAppLayout';
import { FloatingActionDock } from '../components/ui/FloatingActionDock';

/**
 * Client-specific app shell that switches between mobile/desktop layouts.
 * Uses the new MobileAppLayout for a premium mobile experience.
 */
export default function ClientAppShell() {
    const { isMobile } = useIsMobile();
    return (
        <>
            {isMobile ? <MobileAppLayout /> : <ClientDesktopShell />}
            <FloatingActionDock />
        </>
    );
}
