import { ReactNode } from 'react';
import { TabBar } from '../components/mobile/TabBar';
import { MobileHeader } from '../components/mobile/MobileHeader';
import { useLocation } from 'react-router-dom';

interface MobileShellProps {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
    rightAction?: ReactNode;
}

export const MobileShell = ({ children, title, showBack, rightAction }: MobileShellProps) => {
    const location = useLocation();

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
        <div className="min-h-screen bg-[var(--mobile-bg-base)] text-gray-900 dark:text-white pb-[var(--tabbar-height)]">
            <MobileHeader
                title={getAutoTitle()}
                showBack={showBack}
                rightAction={rightAction}
            />

            <main className="pt-[var(--header-height)] px-4 mobile-safe-top">
                {children}
            </main>

            <TabBar />
        </div>
    );
};
