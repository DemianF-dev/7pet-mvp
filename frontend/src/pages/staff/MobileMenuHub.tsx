import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
    Calendar,
    Truck,
    FileText,
    Users,
    ClipboardList,
    CreditCard,
    BarChart3,
    Settings,
    HelpCircle,
    UserCircle,
    Bell,
    Briefcase,
    ChevronRight,
    Star,
    Package,
    Gamepad2,
    Layout,
    LogOut,
    type LucideIcon,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuthStore } from '../../store/authStore';
import MobileNavSettings from '../../components/mobile/MobileNavSettings';
import { AnimatePresence } from 'framer-motion';
import { DIVISION_LABELS } from '../../constants/divisions';
import { APP_VERSION } from '../../constants/version';
import SystemStatusModal from '../../components/SystemStatusModal';

/**
 * Menu section configuration
 */
interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    badge?: number;
    color?: string;
}

/**
 * Mobile Menu Hub page - Bitrix-like navigation hub.
 * User card at top, categorized navigation sections.
 */
export default function MobileMenuHub() {
    const navigate = useNavigate();
    const { unreadCount } = useNotification();
    const { user, logout } = useAuthStore();
    const [isNavSettingsOpen, setIsNavSettingsOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    // Official Role/Division Label
    const officialRole = useMemo(() => {
        if (!user) return 'Convidado';
        const division = DIVISION_LABELS[user.division as keyof typeof DIVISION_LABELS] || user.division;
        const role = user.role || '';
        return role ? `${division} • ${role}` : division;
    }, [user]);

    const handleLogout = () => {
        if (window.confirm('Deseja realmente sair do sistema?')) {
            logout();
            navigate('/staff/login');
        }
    };

    const sections: MenuSection[] = [
        {
            title: 'Ferramentas',
            items: [
                { id: 'agenda-spa', label: 'Agenda SPA', icon: Calendar, path: '/staff/agenda-spa' },
                { id: 'agenda-log', label: 'Agenda Transporte', icon: Truck, path: '/staff/agenda-log' },
                { id: 'pos', label: 'Caixa (PDV)', icon: CreditCard, path: '/staff/pos' },
                { id: 'transport', label: 'Transporte', icon: Truck, path: '/staff/transport' },
                { id: 'quotes', label: 'Orçamentos', icon: FileText, path: '/staff/quotes' },
                { id: 'customers', label: 'Clientes', icon: Users, path: '/staff/customers' },
                { id: 'mural', label: 'Mural', icon: Layout, path: '/staff/feed' },
                { id: 'pausa', label: 'Pausa (Mini-games)', icon: Gamepad2, path: '/pausa' },
            ],
        },
        {
            title: 'Gestão',
            items: [
                { id: 'services', label: 'Serviços', icon: ClipboardList, path: '/staff/services' },
                { id: 'products', label: 'Produtos', icon: Package, path: '/staff/products' },
                { id: 'billing', label: 'Faturamento', icon: CreditCard, path: '/staff/billing' },
                { id: 'financeiro', label: 'Financeiro', icon: CreditCard, path: '/staff/billing' },
                { id: 'transport-config', label: 'Config. Transporte', icon: Settings, path: '/staff/transport-config' },
                { id: 'collaborators', label: 'Colaboradores', icon: Users, path: '/staff/hr/collaborators' },
                { id: 'management', label: 'Dashboard Gestão', icon: BarChart3, path: '/staff/management' },
                { id: 'marketing', label: 'Marketing / Avisos', icon: Bell, path: '/staff/marketing' },
                { id: 'reports', label: 'Relatórios', icon: BarChart3, path: '/staff/reports' },
                { id: 'users', label: 'Usuários', icon: Users, path: '/staff/users' },
            ],
        },
        {
            title: 'Minha Conta',
            items: [
                { id: 'profile', label: 'Meu Perfil', icon: UserCircle, path: '/staff/profile' },
                { id: 'my-hr', label: 'Meu RH', icon: Briefcase, path: '/staff/my-hr' },
                { id: 'notifications', label: 'Notificações', icon: Bell, path: '/staff/notifications', badge: unreadCount },
            ],
        },
        {
            title: 'Configurações',
            items: [
                { id: 'nav-settings', label: 'Personalizar Barra Inferior', icon: Layout, path: '#' },
                { id: 'app-settings', label: 'Parâmetros do App', icon: Settings, path: '/staff/settings' },
                { id: 'support', label: 'Suporte Técnico', icon: HelpCircle, path: '/staff/support' },
                { id: 'logout', label: 'Sair do Sistema', icon: LogOut, path: '#', color: 'text-red-500' },
            ],
        }
    ];

    const handleItemClick = (item: MenuItem) => {
        if (item.id === 'nav-settings') {
            setIsNavSettingsOpen(true);
        } else if (item.id === 'logout') {
            handleLogout();
        } else {
            navigate(item.path);
        }
    };

    return (
        <div className="pb-10 bg-[var(--color-bg-primary)] min-h-full">
            {/* User Card */}
            <button
                onClick={() => navigate('/staff/profile')}
                className="w-full mx-4 my-4 p-5 bg-gradient-to-br from-[var(--color-accent-primary)] to-blue-700 rounded-[32px] flex items-center gap-4 shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98] transition-all"
                style={{ width: 'calc(100% - 32px)' }}
            >
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shrink-0">
                    <UserCircle size={36} className="text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-black text-xl leading-tight truncate">{user?.name || 'Usuário'}</p>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-wider truncate mb-0.5">{officialRole}</p>
                    <div className="inline-flex px-2 py-0.5 bg-white/20 rounded-lg text-[8px] font-black text-white uppercase tracking-tighter">
                        Logado via 7Pet Cloud
                    </div>
                </div>
                <ChevronRight size={24} className="text-white/70" />
            </button>

            {/* Quick Access */}
            <div className="px-4 mb-6 flex gap-3">
                <button
                    onClick={() => navigate('/staff/feed')}
                    className="flex-1 py-4 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-warning)]/10 flex items-center justify-center">
                        <Star size={20} className="text-[var(--color-warning)]" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Feed</span>
                </button>
                <button
                    onClick={() => navigate('/staff/chat')}
                    className="flex-1 py-4 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                        <Bell size={20} className="text-[var(--color-accent-primary)]" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Chat</span>
                </button>
                <button
                    onClick={() => setIsNavSettingsOpen(true)}
                    className="flex-1 py-4 px-4 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-3xl flex flex-col items-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <Layout size={20} className="text-[var(--color-primary)]" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Ajustes</span>
                </button>
            </div>

            {/* Sections */}
            <div className="space-y-6 px-4">
                {sections.map((section) => (
                    <div key={section.title}>
                        <h3 className="px-2 mb-3 text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                            {section.title}
                        </h3>
                        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[32px] overflow-hidden shadow-sm divide-y divide-[var(--color-border)]">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className="w-full px-5 py-4 flex items-center gap-4 active:bg-[var(--color-fill-tertiary)] transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center group-active:scale-90 transition-transform">
                                            <Icon size={20} className={item.color || "text-[var(--color-text-secondary)]"} />
                                        </div>
                                        <span className={`flex-1 text-left font-bold text-sm ${item.color || "text-[var(--color-text-primary)]"}`}>
                                            {item.label}
                                        </span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[var(--color-error)] text-white text-[10px] font-black rounded-full">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                        <ChevronRight size={18} className="text-[var(--color-text-tertiary)]" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Version Info */}
            <div className="py-4 text-center">
                <button
                    onClick={() => setIsStatusModalOpen(true)}
                    className="text-[10px] text-[var(--color-text-tertiary)] font-mono opacity-50 active:opacity-100 transition-opacity"
                >
                    {APP_VERSION}
                </button>
            </div>

            {/* Bottom Spacer for Scrolling */}
            <div className="h-24" aria-hidden="true" />

            <AnimatePresence>
                {isNavSettingsOpen && (
                    <MobileNavSettings
                        isOpen={isNavSettingsOpen}
                        onClose={() => setIsNavSettingsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <SystemStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
            />
        </div>
    );
}
