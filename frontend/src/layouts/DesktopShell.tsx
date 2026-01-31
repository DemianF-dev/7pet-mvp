import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';

/**
 * Desktop shell layout - Provides a persistent sidebar for staff routes.
 */
export default function DesktopShell() {
    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
            <StaffSidebar />
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}
