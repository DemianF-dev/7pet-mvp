import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    MessageCircle,
    MessageSquare,
    Truck,
    Quote,
    Users,
    ClipboardList,
    CreditCard,
    TrendingUp,
    FileText,
    LogOut,
    Menu as MenuIcon,
    Bell,
    User as UserIcon,
    X,
    Sparkles,
    Package,
    AlertTriangle,
    Settings,
    Smartphone,
    Clock,
    Briefcase,
    Gamepad2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from './ThemeToggle';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from './ConfirmModal';
import { createContext, useContext } from 'react';
import { useInMobileShell } from '../context/MobileShellContext';

const SidebarContext = createContext({ isCollapsed: false });

export default function StaffSidebar() {
    // If we're inside MobileShell, don't render the sidebar
    const inMobileShell = useInMobileShell();
    if (inMobileShell) return null;

    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { unreadCount } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('staff-sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('staff-sidebar-collapsed', String(isCollapsed));
        // Toggle body class for CSS transitions
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }, [isCollapsed]);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleLogoutConfirm = () => {
        logout();
        navigate('/');
    };

    const checkPermission = (module: string) => {
        if (!user) return false;

        // Master user has access to everything
        if (user.role === 'MASTER') return true;

        // 1. If user has specific permission override, use it
        if (user.permissions) {
            let perms: string[] = [];
            if (Array.isArray(user.permissions)) {
                perms = user.permissions;
            } else if (typeof user.permissions === 'string') {
                try {
                    perms = JSON.parse(user.permissions);
                } catch (e) { perms = []; }
            }

            if (perms.includes(module)) return true;
            // If granular permissions exist (and are not empty) but this module isn't in it, strictly deny.
            if (perms.length > 0) return false;
        }

        // 3. Fallback to Role Defaults
        switch (module) {
            case 'dashboard': return user.role !== 'SPA';
            case 'quotes': return user.role !== 'SPA';
            case 'agenda-spa': return true; // All staff can access
            case 'agenda-log': return true; // All staff can access
            case 'kanban': return true; // All staff - keeping for compatibility
            case 'transport': return user.role !== 'SPA';
            case 'customers': return user.role !== 'SPA';
            case 'services': return true; // All staff including SPA
            case 'billing': return user.role !== 'SPA';
            case 'reports': return user.role === 'GESTAO' || user.role === 'ADMIN';
            case 'management': return user.role === 'GESTAO' || user.role === 'ADMIN';
            case 'users': return user.role === 'ADMIN';
            case 'transport-config': return user.role === 'GESTAO' || user.role === 'ADMIN';
            default: return false;
        }
    };

    const menuItems = (
        <SidebarContext.Provider value={{ isCollapsed }}>
            <nav className="flex-1 space-y-2">
                {/* 1. Dashboard */}
                {checkPermission('dashboard') && (
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={location.pathname === '/staff/dashboard'}
                        onClick={() => { navigate('/staff/dashboard'); setIsOpen(false); }}
                    />
                )}

                {/* 1.1 Bate-papo */}
                <SidebarItem
                    icon={<MessageCircle size={20} />}
                    label="Bate-papo"
                    active={location.pathname === '/staff/chat'}
                    onClick={() => { navigate('/staff/chat'); setIsOpen(false); }}
                />

                {/* 1.2 Mural */}
                <SidebarItem
                    icon={<MessageSquare size={20} />}
                    label="Mural"
                    active={location.pathname === '/staff/feed'}
                    onClick={() => { navigate('/staff/feed'); setIsOpen(false); }}
                />

                {/* 2. Orçamentos */}
                {checkPermission('quotes') && (
                    <SidebarItem
                        icon={<Quote size={20} />}
                        label="Orçamentos"
                        active={location.pathname === '/staff/quotes'}
                        onClick={() => { navigate('/staff/quotes'); setIsOpen(false); }}
                    />
                )}

                {/* 3. Agenda SPA - Always visible to all staff */}
                <SidebarItem
                    icon={<Sparkles size={20} />}
                    label="Agenda SPA"
                    active={location.pathname === '/staff/agenda-spa'}
                    onClick={() => { navigate('/staff/agenda-spa'); setIsOpen(false); }}
                />

                {/* 4. Agenda LOG - Always visible to all staff */}
                <SidebarItem
                    icon={<Truck size={20} />}
                    label="Agenda LOG"
                    active={location.pathname === '/staff/agenda-log'}
                    onClick={() => { navigate('/staff/agenda-log'); setIsOpen(false); }}
                />

                {/* 5. Clientes */}
                {checkPermission('customers') && (
                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Clientes"
                        active={location.pathname === '/staff/customers'}
                        onClick={() => { navigate('/staff/customers'); setIsOpen(false); }}
                    />
                )}

                {/* 6. Serviços */}
                {checkPermission('services') && (
                    <SidebarItem
                        icon={<ClipboardList size={20} />}
                        label="Serviços"
                        active={location.pathname === '/staff/services'}
                        onClick={() => { navigate('/staff/services'); setIsOpen(false); }}
                    />
                )}

                {/* 6.1 Produtos */}
                {checkPermission('management') && (
                    <SidebarItem
                        icon={<Package size={20} />}
                        label="Produtos"
                        active={location.pathname === '/staff/products'}
                        onClick={() => { navigate('/staff/products'); setIsOpen(false); }}
                    />
                )}

                {/* 7. Financeiro */}
                {checkPermission('billing') && (
                    <SidebarItem
                        icon={<CreditCard size={20} />}
                        label="Financeiro"
                        active={location.pathname === '/staff/billing'}
                        onClick={() => { navigate('/staff/billing'); setIsOpen(false); }}
                    />
                )}

                {/* 8. Relatórios */}
                {checkPermission('reports') && (
                    <SidebarItem
                        icon={<FileText size={20} />}
                        label="Relatórios"
                        active={location.pathname === '/staff/reports'}
                        onClick={() => { navigate('/staff/reports'); setIsOpen(false); }}
                    />
                )}

                {/* 9. Gestão */}
                {checkPermission('management') && (
                    <SidebarItem
                        icon={<TrendingUp size={20} />}
                        label="Gestão"
                        active={location.pathname === '/staff/management'}
                        onClick={() => { navigate('/staff/management'); setIsOpen(false); }}
                    />
                )}



                {/* 9.1 Config Transporte */}
                {checkPermission('transport-config') && (
                    <SidebarItem
                        icon={<Settings size={20} />}
                        label="Config. Transporte"
                        active={location.pathname === '/staff/transport-config'}
                        onClick={() => { navigate('/staff/transport-config'); setIsOpen(false); }}
                    />
                )}

                {/* 10. Usuários */}
                {checkPermission('users') && (
                    <SidebarItem
                        icon={<Users size={20} />}
                        label="Usuários"
                        active={location.pathname === '/staff/users'}
                        onClick={() => { navigate('/staff/users'); setIsOpen(false); }}
                    />
                )}

                {/* 10.1 RH - Gestão/Admin only */}
                {checkPermission('management') && (
                    <>
                        <div className="mt-4 mb-2 px-4">
                            <p className="text-xs font-black text-muted uppercase tracking-widest">RH</p>
                        </div>
                        <SidebarItem
                            icon={<Users size={20} />}
                            label="Colaboradores"
                            active={location.pathname === '/staff/hr/collaborators'}
                            onClick={() => { navigate('/staff/hr/collaborators'); setIsOpen(false); }}
                        />
                        <SidebarItem
                            icon={<Briefcase size={20} />}
                            label="Fechamentos"
                            active={location.pathname === '/staff/hr/pay-periods'}
                            onClick={() => { navigate('/staff/hr/pay-periods'); setIsOpen(false); }}
                        />
                    </>
                )}

                {/* 11. Chamados Técnicos */}
                <SidebarItem
                    icon={<AlertTriangle size={20} />}
                    label="Chamados Técnicos"
                    active={location.pathname === '/staff/support'}
                    onClick={() => { navigate('/staff/support'); setIsOpen(false); }}
                />

                {/* 11. Notificações */}
                <SidebarItem
                    icon={<Bell size={20} />}
                    label="Notificações"
                    active={location.pathname === '/staff/notifications'}
                    onClick={() => { navigate('/staff/notifications'); setIsOpen(false); }}
                    badge={unreadCount}
                />

                {/* 12. Meu Perfil */}
                <SidebarItem
                    icon={<UserIcon size={20} />}
                    label="Meu Perfil"
                    active={location.pathname === '/staff/profile'}
                    onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
                />

                {/* 12.1 Meu RH - Self-service ponto/produção */}
                <SidebarItem
                    icon={<Clock size={20} />}
                    label="Meu RH"
                    active={location.pathname === '/staff/my-hr'}
                    onClick={() => { navigate('/staff/my-hr'); setIsOpen(false); }}
                />

                {/* 12.2 Pausa - Mini-games */}
                <SidebarItem
                    icon={<Gamepad2 size={20} />}
                    label="Pausa"
                    active={location.pathname.startsWith('/pausa')}
                    onClick={() => { navigate('/pausa'); setIsOpen(false); }}
                />

                {/* 13. Configurações PWA */}
                <SidebarItem
                    icon={<Smartphone size={20} />}
                    label="Configurações do App"
                    active={location.pathname === '/staff/settings'}
                    onClick={() => { navigate('/staff/settings'); setIsOpen(false); }}
                />
            </nav>
        </SidebarContext.Provider>
    );

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-6 left-6 z-40 p-3 bg-bg-surface text-accent rounded-2xl shadow-xl border border-border hover:scale-110 active:scale-95 transition-all glass-surface"
            >
                <MenuIcon size={24} />
            </button>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-80 sidebar-surface glass-elevated z-[60] p-6 flex flex-col shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain" alt="Logo" />
                                    <span className="font-bold text-xl text-heading">7Pet</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-body-secondary hover:text-heading transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {menuItems}

                            <div className="pt-6 border-t border-white/10 mt-auto">
                                <div className="mb-4">
                                    <ThemeToggle />
                                </div>
                                <div className="flex items-center gap-3 mb-2 p-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user?.name || user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                                        className="w-10 h-10 rounded-full cursor-pointer"
                                        alt="Avatar"
                                        onClick={() => navigate('/staff/profile')}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-heading truncate cursor-pointer" onClick={() => navigate('/staff/profile')}>{user?.name || user?.customer?.name || user?.email || 'Staff'}</p>
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="text-xs text-body-secondary hover:text-accent flex items-center gap-1 transition-colors"
                                        >
                                            Sair <LogOut size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside
                className={`${isCollapsed ? 'w-20' : 'w-64'
                    } sidebar-surface glass-surface hidden md:flex flex-col fixed h-full border-r border-white/5 transition-all duration-300 ease-out`}
            >
                {/* Fixed Header */}
                <div className={`flex-none ${isCollapsed ? 'p-4 pb-2' : 'p-6 pb-2'}`}>
                    <div
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} cursor-pointer`}
                        onClick={() => navigate('/staff/dashboard')}
                    >
                        <img
                            src="/logo.png"
                            className="w-8 h-8 rounded-lg object-contain hover:rotate-12 transition-transform"
                            alt="Logo"
                        />
                        {!isCollapsed && (
                            <span className="font-bold text-xl text-heading whitespace-nowrap overflow-hidden">
                                7Pet Operational
                            </span>
                        )}
                    </div>
                </div>

                {/* Toggle Collapse Button */}
                <div className={`flex-none ${isCollapsed ? 'px-4 pb-2' : 'px-6 pb-2'}`}>
                    <button
                        onClick={toggleCollapse}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-fill-secondary hover:bg-accent/20 text-body-secondary hover:text-accent transition-all"
                        aria-label={isCollapsed ? 'Expandir menu' : 'Retrair menu'}
                    >
                        {isCollapsed ? (
                            <ChevronRight size={18} />
                        ) : (
                            <>
                                <ChevronLeft size={18} />
                                <span className="text-xs font-medium">Retrair</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Scrollable Menu Area */}
                <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'px-6 py-4'} custom-scrollbar`}>
                    {menuItems}
                </div>

                {/* Fixed Footer */}
                <div className="flex-none p-6 pt-2 border-t border-white/10 bg-inherit z-10">
                    {!isCollapsed && (
                        <div className="mb-4 px-2">
                            <ThemeToggle />
                            <p className="text-[10px] text-white/40 text-center font-mono mt-2">
                                v0.1.0-beta
                            </p>
                        </div>
                    )}

                    <div className={`flex items-center gap-3 p-2 surface-input rounded-2xl ${isCollapsed ? 'justify-center' : ''
                        }`}>
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name || user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-accent/20 cursor-pointer hover:scale-105 transition-transform"
                            alt="Avatar"
                            onClick={() => navigate('/staff/profile')}
                            title={user?.name || user?.customer?.name || user?.email || 'Staff'}
                        />
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-heading truncate cursor-pointer hover:text-accent transition-colors" onClick={() => navigate('/staff/profile')}>
                                    {user?.name || user?.customer?.name || user?.email || 'Staff'}
                                </p>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-xs text-body-secondary hover:text-accent flex items-center gap-1 transition-colors"
                                >
                                    Sair <LogOut size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Sair do Sistema?"
                description="Tem certeza que deseja encerrar sua sessão? Você precisará fazer login novamente para acessar o sistema."
                confirmText="Sair Agora"
                confirmColor="bg-red-500"
            />
        </>
    );
}

function SidebarItem({ icon, label, active = false, onClick, badge }: { icon: any, label: string, active?: boolean, onClick: () => void, badge?: number }) {
    const { isCollapsed } = useContext(SidebarContext);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl cursor-pointer transition-all w-full text-left relative ${active ? 'bg-accent text-white shadow-lg shadow-accent/20 font-bold' : 'text-body-secondary hover:bg-fill-secondary hover:text-heading'
                }`}
            aria-current={active ? 'page' : undefined}
            title={isCollapsed ? label : undefined}
        >
            <div className="relative flex-shrink-0">
                {icon}
                {isCollapsed && badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            {!isCollapsed && (
                <>
                    <span className="text-sm flex-1">{label}</span>
                    {badge !== undefined && badge > 0 && (
                        <span className="status-error-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
