import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';

/**
 * Desktop shell layout - Provides a persistent sidebar for staff routes.
 */
export default function DesktopShell() {
    return (
        <div className="flex flex-row justify-start items-stretch h-screen overflow-hidden bg-[var(--color-bg-primary)] w-full">
            <StaffSidebar />
            <main className="flex-1 min-w-0 overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
}
