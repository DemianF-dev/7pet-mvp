import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';

/**
 * Desktop shell layout - Provides a persistent sidebar for staff routes.
 */
export default function DesktopShell() {
    return (
        <div className="min-h-screen">
            <StaffSidebar />
            <div className="main-content-layout bg-[var(--color-bg-primary)]">
                <Outlet />
            </div>
        </div>
    );
}
