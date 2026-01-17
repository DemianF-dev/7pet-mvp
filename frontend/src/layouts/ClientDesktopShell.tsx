import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/**
 * Client desktop shell layout - Provides a persistent sidebar for client routes.
 */
export default function ClientDesktopShell() {
    return (
        <div className="floating-layout-wrapper">
            <Sidebar />
            <main className="floating-main-content custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
