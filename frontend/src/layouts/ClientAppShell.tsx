import { useIsMobile } from '../hooks/useIsMobile';
import ClientDesktopShell from './ClientDesktopShell';
import MobileShell from './MobileShell';

/**
 * Client-specific app shell that switches between mobile/desktop layouts.
 * Uses the same MobileShell for now as it's responsive.
 */
export default function ClientAppShell() {
    const isMobile = useIsMobile();
    return isMobile ? <MobileShell /> : <ClientDesktopShell />;
}
