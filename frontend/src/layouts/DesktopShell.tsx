import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';

/**
 * Desktop shell layout - Provides a persistent sidebar for staff routes.
 */
export default function DesktopShell() {
    return (
        <div className="floating-layout-wrapper">
            <StaffSidebar />
            <main className="floating-main-content flex-1 min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
