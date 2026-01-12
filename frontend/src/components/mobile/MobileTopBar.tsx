import { useLocation } from 'react-router-dom';
import { Search, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Route configuration for mobile top bar titles and actions
 */
const routeConfig: Record<string, { title: string; showBack?: boolean; showSearch?: boolean }> = {
    '/staff/dashboard': { title: 'Home' },
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
    '/staff/profile': { title: 'Perfil', showBack: true },
    '/staff/support': { title: 'Suporte' },
    '/staff/feed': { title: 'Feed' },
    '/staff/my-hr': { title: 'Meu RH', showBack: true },
    '/staff/menu': { title: 'Menu' },
    '/staff/hr/collaborators': { title: 'Colaboradores', showBack: true },
    '/staff/hr/pay-periods': { title: 'Períodos de Pagamento', showBack: true },
};

interface MobileTopBarProps {
    onSearchClick?: () => void;
    onMoreClick?: () => void;
}

/**
 * Compact mobile top bar with title and actions.
 * Bitrix-like pattern: Large title left, actions right.
 */
export default function MobileTopBar({ onSearchClick, onMoreClick }: MobileTopBarProps) {
    const location = useLocation();
    const navigate = useNavigate();

    // Get config for current route, fallback to path-based title
    const config = routeConfig[location.pathname] || {
        title: location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Menu',
        showBack: true,
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <header
            className="shrink-0 flex items-center justify-between px-4 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
        >
            {/* Left: Back button or Title */}
            <div className="flex items-center gap-3">
                {config.showBack && (
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-fill-tertiary)] transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] capitalize">
                    {config.title}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {config.showSearch && onSearchClick && (
                    <button
                        onClick={onSearchClick}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-fill-tertiary)] transition-colors"
                        aria-label="Pesquisar"
                    >
                        <Search size={20} />
                    </button>
                )}
                {onMoreClick && (
                    <button
                        onClick={onMoreClick}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-fill-tertiary)] transition-colors"
                        aria-label="Mais opções"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                )}
            </div>
        </header>
    );
}
