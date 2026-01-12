import { Outlet } from 'react-router-dom';

/**
 * Desktop shell layout - passthrough wrapper.
 * 
 * On desktop, pages already manage their own layouts including StaffSidebar.
 * This shell is a passthrough that simply renders the page content.
 * 
 * Future: If we want to centralize sidebar management, pages would need
 * to be refactored to not include their own sidebars.
 */
export default function DesktopShell() {
    return <Outlet />;
}
