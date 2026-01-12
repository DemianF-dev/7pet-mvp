import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import MobileTopBar from '../components/mobile/MobileTopBar';
import MobileBottomNav from '../components/mobile/MobileBottomNav';
import MobileOverflowMenu from '../components/mobile/MobileOverflowMenu';
import { MobileShellProvider } from '../context/MobileShellContext';

/**
 * Routes that should render full-screen without shell chrome (topbar/bottomnav)
 * These pages manage their own layout (e.g., calendar compact view)
 */
const fullScreenRoutes = ['/staff/agenda-spa', '/staff/agenda-log', '/pausa/paciencia-pet', '/pausa/coleira'];

/**
 * Mobile shell layout - app-like experience.
 * Full viewport height, compact topbar, fixed bottom nav.
 * Wraps content in MobileShellProvider so child components know they're in mobile mode.
 */
export default function MobileShell() {
    const location = useLocation();
    const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);

    // Check if current route should render full-screen
    const isFullScreen = fullScreenRoutes.some(route => location.pathname.startsWith(route));

    // For full-screen routes, render just the Outlet with bottom nav
    if (isFullScreen) {
        return (
            <MobileShellProvider>
                <div className="h-[100dvh] flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
                    <Outlet />
                    <MobileBottomNav />
                </div>
            </MobileShellProvider>
        );
    }

    return (
        <MobileShellProvider>
            <div className="h-[100dvh] flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
                {/* Top Bar */}
                <MobileTopBar
                    onMoreClick={() => setIsOverflowMenuOpen(true)}
                />

                {/* Main Content */}
                <main
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
                    style={{
                        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 24px))',
                        position: 'relative'
                    }}
                >
                    <Outlet />
                </main>

                {/* Bottom Nav */}
                <MobileBottomNav />

                {/* Overflow Menu */}
                <MobileOverflowMenu
                    isOpen={isOverflowMenuOpen}
                    onClose={() => setIsOverflowMenuOpen(false)}
                />
            </div>
        </MobileShellProvider>
    );
}
