import { ReactNode } from 'react';
import { MobileHeader } from '../components/mobile/MobileHeader';
import { useLocation } from 'react-router-dom';

interface MobileShellProps {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: ReactNode;
}

import { useInMobileShell } from '../context/MobileShellContext';

export const MobileShell = ({ children, title, showBack, onBack, rightAction }: MobileShellProps) => {
    const location = useLocation();
    const inGlobalShell = useInMobileShell();

    // Auto-detect title based on route if not provided
    const getAutoTitle = () => {
        if (title) return title;
        const path = location.pathname;
        if (path.includes('dashboard')) return 'Hoje';
        if (path.includes('agenda')) return 'Agenda';
        if (path.includes('chat')) return 'Chat';
        if (path.includes('customers')) return 'Clientes';
        if (path.includes('hub')) return 'Menu';
        return '7Pet';
    };

    return (
        <div className={`min-h-screen bg-[var(--mobile-bg-base)] text-gray-900 dark:text-white ${!inGlobalShell ? 'pb-[var(--tabbar-height)]' : ''}`}>
            {!inGlobalShell && (
                <MobileHeader
                    title={getAutoTitle()}
                    showBack={showBack}
                    onBack={onBack}
                    rightAction={rightAction}
                />
            )}

            <main className={`${!inGlobalShell ? 'pt-[var(--header-height)] px-4 mobile-safe-top' : ''}`}>
                {children}
            </main>

            {/* TabBar removed to avoid duplication with MobileBottomNav */}
            {/* <TabBar /> */}
        </div>
    );
};
