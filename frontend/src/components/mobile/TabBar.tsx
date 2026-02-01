import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageSquare, Users, Grid } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const TabBar = () => {
    const location = useLocation();
    const { user } = useAuthStore();
    const isStaff = user?.role !== 'CLIENTE';

    // Staff Routes
    const tabs = isStaff ? [
        { path: '/staff/dashboard', icon: Home, label: 'Hoje' },
        { path: '/staff/agenda-spa', icon: Calendar, label: 'Agenda' },
        { path: '/staff/chat', icon: MessageSquare, label: 'Chat' },
        { path: '/staff/customers', icon: Users, label: 'Clientes' },
        { path: '/staff/menu', icon: Grid, label: 'Menu' },
    ] : [
        // Client Routes (Placeholder)
        { path: '/client/dashboard', icon: Home, label: 'Início' },
        { path: '/client/agenda', icon: Calendar, label: 'Agendar' },
        { path: '/client/chat', icon: MessageSquare, label: 'Ajuda' },
        { path: '/client/hub', icon: Grid, label: 'Mais' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-zinc-800 mobile-safe-bottom h-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] md:hidden">
            <div className="flex justify-around items-center h-full pb-[env(safe-area-inset-bottom)]">
                {tabs.map((tab) => {
                    const isActive = location.pathname.startsWith(tab.path);
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                                }`}
                        >
                            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
};
