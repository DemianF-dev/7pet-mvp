import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/**
 * Client desktop shell layout - Provides a persistent sidebar for client routes.
 */
export default function ClientDesktopShell() {
    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="main-content-layout bg-gray-50">
                <Outlet />
            </div>
        </div>
    );
}
