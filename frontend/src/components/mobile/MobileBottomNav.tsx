import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prefetchRoute, RouteKey } from '../../utils/routePrefetch';
import { MOBILE_TABS, CLIENT_MOBILE_TABS } from '../../navigation/mobileNav';
import { useAuthStore } from '../../store/authStore';

interface MobileBottomNavProps {
    badges?: Record<string, number>;
    onMoreClick?: () => void;
}

export default function MobileBottomNav({ badges = {}, onMoreClick }: MobileBottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Use specific tab set based on user role
    const tabs = user?.role === 'CLIENTE' ? CLIENT_MOBILE_TABS : MOBILE_TABS;

    // Filter tabs based on role if allowedRoles is defined
    const visibleTabs = tabs.filter(tab => {
        if (!tab.rolesAllowed) return true;
        return tab.rolesAllowed.includes(user?.role || '');
    });

    const getIsActive = (tab: any) => {
        if (tab.path === '#more') return false;
        if (tab.matchPaths) {
            return tab.matchPaths.some((p: string) => location.pathname.startsWith(p));
        }
        return location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
    };

    return (
        <nav
            id="mobile-bottom-nav"
            className="fixed bottom-0 left-0 right-0 z-[60] bg-[var(--color-bg-surface)]/80 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] landscape-compact"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                height: 'calc(var(--nav-bottom-height) + env(safe-area-inset-bottom, 0px))'
            }}
        >
            <div className="flex h-full items-stretch justify-around px-2">
                {visibleTabs.map((tab) => {
                    const isActive = getIsActive(tab);
                    const Icon = tab.icon;
                    const badge = badges[tab.key];

                    return (
                        <button
                            key={tab.key}
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(5);
                                if (tab.path === '#more') {
                                    onMoreClick?.();
                                } else {
                                    navigate(tab.path);
                                }
                            }}
                            onPointerDown={() => {
                                if (tab.path !== '#more') prefetchRoute(tab.key as RouteKey);
                            }}
                            className={`flex-1 relative flex flex-col items-center justify-center gap-1.5 transition-all duration-300 tap-highlight-none ${isActive ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)]'
                                }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <motion.div
                                className="relative flex items-center justify-center"
                                whileTap={{ scale: 0.85 }}
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_var(--color-accent-primary-alpha)]' : ''}`}
                                />

                                {/* Badge */}
                                <AnimatePresence>
                                    {badge !== undefined && badge > 0 && (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-[var(--color-error)] text-white text-[10px] font-black rounded-full border-2 border-[var(--color-bg-surface)] shadow-sm"
                                        >
                                            {badge > 99 ? '99' : badge}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <span className={`text-[10px] uppercase tracking-widest font-[var(--font-weight-black)] transition-all ${isActive ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-0.5'
                                }`}>
                                {tab.label}
                            </span>

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-1 w-1 h-1 bg-[var(--color-accent-primary)] rounded-full shadow-[0_0_8px_var(--color-accent-primary)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
