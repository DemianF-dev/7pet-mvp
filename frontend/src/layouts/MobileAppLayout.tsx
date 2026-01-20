import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MobileTopBar from '../components/mobile/MobileTopBar';
import MobileBottomNav from '../components/mobile/MobileBottomNav';
import MobileDrawer from '../components/navigation/MobileDrawer';
import MobileQuickActions from '../components/mobile/MobileQuickActions';
import { MobileShellProvider } from '../context/MobileShellContext';
import { NO_BOTTOM_NAV_ROUTES } from '../navigation/mobileNav';
import { useMobileActions } from '../hooks/useMobileActions';

/**
 * MobileAppLayout - Premium App-like shell
 * Handles safe areas, bottom navigation, and top bar transitions.
 */
export default function MobileAppLayout() {
    const location = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const triggerAction = useMobileActions(s => s.triggerAction);

    // Check if bottom nav should be hidden
    const hideNav = NO_BOTTOM_NAV_ROUTES.some(route => location.pathname.startsWith(route));

    // Full screen routes (games, etc) hide the top bar but might keep the bottom nav or manage their own
    const isFullScreen = location.pathname.startsWith('/pausa/') || location.pathname.startsWith('/staff/agenda-');

    // Scroll to top on route change
    useEffect(() => {
        const main = document.getElementById('mobile-main-content');
        if (main) main.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <MobileShellProvider>
            <div className="fixed inset-0 flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
                {/* Top Bar - Minimal */}
                {!isFullScreen && !hideNav && (
                    <MobileTopBar onMoreClick={() => setIsDrawerOpen(true)} />
                )}

                {/* Main Content Area */}
                <main
                    id="mobile-main-content"
                    className="flex-1 overflow-y-auto overscroll-contain relative"
                    style={{
                        // Add padding if bottom nav is visible
                        paddingBottom: !hideNav ? 'calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 24px))' : 'env(safe-area-inset-bottom, 24px)',
                        paddingTop: isFullScreen ? 'env(safe-area-inset-top, 0px)' : '0px'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="min-h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Floating Quick Actions */}
                {!hideNav && (
                    <MobileQuickActions onAction={triggerAction} />
                )}

                {/* Bottom Navigation */}
                {!hideNav && (
                    <MobileBottomNav onMoreClick={() => setIsDrawerOpen(true)} />
                )}

                {/* Secondary Drawer */}
                <MobileDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                />
            </div>
        </MobileShellProvider>
    );
}
