import { useIsMobile } from '../hooks/useIsMobile';
import DesktopShell from './DesktopShell';
import MobileAppLayout from './MobileAppLayout';
import { FloatingActionDock } from '../components/ui/FloatingActionDock';

/**
 * Root layout wrapper that switches between Desktop and Mobile shells
 * based on viewport width. Renders child routes via <Outlet />.
 */
export default function AppShell() {
    const { isMobile } = useIsMobile();

    return (
        <>
            {isMobile ? <MobileAppLayout /> : <DesktopShell />}
            <FloatingActionDock />
        </>
    );
}
