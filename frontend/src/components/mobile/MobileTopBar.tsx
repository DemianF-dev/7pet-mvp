import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { safeBack } from '../../utils/safeBack';

/**
 * Route configuration for mobile top bar titles and actions
 */
const routeConfig: Record<string, { title: string; showBack?: boolean; showSearch?: boolean; fallback?: string }> = {
    '/staff/dashboard': { title: 'Hoje' },
    '/staff/agenda-spa': { title: 'Agenda SPA', showSearch: true },
    '/staff/agenda-log': { title: 'Transporte', showSearch: true },
    '/staff/transport': { title: 'Transporte', showSearch: true },
    '/staff/customers': { title: 'Clientes', showSearch: true },
    '/staff/chat': { title: 'Chat' },
    '/staff/quotes': { title: 'Orçamentos', showSearch: true },
    '/staff/services': { title: 'Serviços' },
    '/staff/products': { title: 'Produtos' },
    '/staff/billing': { title: 'Faturamento' },
    '/staff/management': { title: 'Gestão' },
    '/staff/reports': { title: 'Relatórios' },
    '/staff/users': { title: 'Usuários' },
    '/staff/notifications': { title: 'Notificações' },
    '/staff/profile': { title: 'Meu Perfil', showBack: true },
    '/staff/support': { title: 'Suporte' },
    '/staff/feed': { title: 'Feed' },
    '/staff/my-hr': { title: 'Meu RH', showBack: true, fallback: '/staff/dashboard' },
    '/staff/menu': { title: 'Menu' },
    '/staff/hr/collaborators': { title: 'Colaboradores', showBack: true, fallback: '/staff/my-hr' },
    '/staff/hr/pay-periods': { title: 'Pagamentos', showBack: true, fallback: '/staff/my-hr' },
};

interface MobileTopBarProps {
    onSearchClick?: () => void;
    onMoreClick?: () => void;
}

export default function MobileTopBar({ onSearchClick, onMoreClick }: MobileTopBarProps) {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if it's a detail page (e.g. /staff/customers/:id)
    const isDetail = /^\/staff\/(customers|quotes|hr\/collaborators)\/[^/]+$/.test(location.pathname);

    // Get config for current route
    const config = routeConfig[location.pathname] || {
        title: isDetail ? 'Detalhes' : (location.pathname.split('/').pop()?.replace(/-/g, ' ') || '7Pet'),
        showBack: isDetail || location.pathname.split('/').length > 2,
    };

    const handleBack = () => {
        // Fallback calculation
        let fallback = config.fallback;
        if (!fallback) {
            if (location.pathname.startsWith('/staff/customers/')) fallback = '/staff/customers';
            else if (location.pathname.startsWith('/staff/quotes/')) fallback = '/staff/quotes';
            else fallback = '/staff/dashboard';
        }
        safeBack(navigate, fallback);
    };

    return (
        <header
            className="shrink-0 flex items-center justify-between px-4 h-16 landscape-compact bg-[var(--color-bg-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border-subtle)] z-50 sticky top-0 md:hidden"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className="flex items-center gap-2">
                {config.showBack && (
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl text-[var(--color-text-secondary)] active:bg-[var(--color-fill-secondary)] active:scale-90 transition-all"
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={22} strokeWidth={2.5} />
                    </button>
                )}
                <h1 className="text-lg font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-tight">
                    {config.title}
                </h1>
            </div>

            <div className="flex items-center gap-1">
                {config.showSearch && (
                    <button
                        onClick={onSearchClick}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl text-[var(--color-text-tertiary)] active:bg-[var(--color-fill-secondary)] active:scale-90 transition-all"
                        aria-label="Pesquisar"
                    >
                        <Search size={22} strokeWidth={2.5} />
                    </button>
                )}
                {onMoreClick && (
                    <button
                        onClick={onMoreClick}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl text-[var(--color-text-tertiary)] active:bg-[var(--color-fill-secondary)] active:scale-90 transition-all"
                        aria-label="Mais"
                    >
                        <MoreHorizontal size={22} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </header>
    );
}
