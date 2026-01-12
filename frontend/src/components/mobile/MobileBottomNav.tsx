import { useLocation, useNavigate } from 'react-router-dom';
import { useMobileNav } from '../../hooks/useMobileNav';

interface MobileBottomNavProps {
    /** Optional badge counts keyed by tab id */
    badges?: Record<string, number>;
}

/**
 * Fixed bottom navigation for mobile.
 * Dynamic based on user preferences managed by useMobileNav.
 */
export default function MobileBottomNav({ badges = {} }: MobileBottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { navTabs } = useMobileNav();

    // Determine active tab based on current path
    const getIsActive = (tabPath: string) => {
        if (tabPath === '/staff/dashboard') {
            return location.pathname === '/staff/dashboard';
        }
        return location.pathname.startsWith(tabPath);
    };

    return (
        <nav
            id="mobile-bottom-nav"
            className="shrink-0 fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-center justify-around">
                {navTabs.map((tab) => {
                    const isActive = getIsActive(tab.path);
                    const Icon = tab.icon;
                    const badge = badges[tab.id];

                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`flex-1 min-w-[60px] flex flex-col items-center gap-1 py-3 px-1 transition-all relative active:scale-90 ${isActive
                                ? 'text-[var(--color-accent-primary)]'
                                : 'text-[var(--color-text-secondary)]'
                                }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <div className="relative">
                                <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'} />
                                {/* Badge */}
                                {badge !== undefined && badge > 0 && (
                                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[var(--color-error)] text-white text-[10px] font-bold rounded-full border border-[var(--color-bg-surface)]">
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'font-bold' : ''}`}>
                                {tab.label}
                            </span>
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[var(--color-accent-primary)] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
