import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useContext, createContext } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
    ChevronRight,
    History,
    Target,
    Shield,
    ShoppingCart,
    Wand2
} from 'lucide-react';

import { DEFAULT_PERMISSIONS_BY_ROLE } from '../constants/permissions';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from './ThemeToggle';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from './ConfirmModal';
import { useInMobileShell } from '../context/MobileShellContext';
import { APP_VERSION } from '../constants/version';
import { prefetchRoute } from '../utils/routePrefetch';
import SystemInfoModal from './SystemInfoModal';


const SidebarContext = createContext({ isCollapsed: false });

export default function StaffSidebar() {
    // If we're inside MobileShell, don't render the sidebar
    const inMobileShell = useInMobileShell();
    if (inMobileShell) return null;

    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { unreadCount } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSystemInfo, setShowSystemInfo] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('staff-sidebar-collapsed');
        return saved === 'true';
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem('staff-sidebar-collapsed', String(isCollapsed));
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }, [isCollapsed]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const savedScroll = sessionStorage.getItem('staff-sidebar-scroll');
        if (savedScroll) container.scrollTop = parseInt(savedScroll, 10);
        const handleScroll = () => {
            sessionStorage.setItem('staff-sidebar-scroll', String(container.scrollTop));
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);
    const handleLogoutConfirm = () => {
        logout();
        navigate('/');
    };

    const checkPermission = (module: string) => {
        if (!user) return false;
        if ((user.role as any) === 'MASTER' || user.division === 'MASTER' || user.email === 'oidemianf@gmail.com') return true;
        let perms: string[] | null = null;
        if (user.permissions) {
            if (Array.isArray(user.permissions)) perms = user.permissions;
            else if (typeof user.permissions === 'string') {
                try { perms = JSON.parse(user.permissions); } catch (e) { perms = null; }
            }
        }
        if (perms !== null) return perms.includes(module);

        // Check both role and division for permissions
        const userKey = user.division || user.role || 'CLIENTE';
        const roleDefaults = DEFAULT_PERMISSIONS_BY_ROLE[userKey] || [];
        return roleDefaults.includes(module);
    };

    const navItems = (
        <SidebarContext.Provider value={{ isCollapsed }}>
            <div className="flex flex-col">
                <SidebarGroup label="Geral" isCollapsed={isCollapsed}>
                    {checkPermission('dashboard') && (
                        <SidebarItem
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                            active={location.pathname === '/staff/dashboard'}
                            onClick={() => { navigate('/staff/dashboard'); setIsOpen(false); }}
                            routeKey="dashboard"
                        />
                    )}
                    {checkPermission('chat') && (
                        <SidebarItem
                            icon={<MessageCircle size={18} />}
                            label="Bate-papo"
                            active={location.pathname === '/staff/chat'}
                            onClick={() => { navigate('/staff/chat'); setIsOpen(false); }}
                            routeKey="chat"
                        />
                    )}
                    {checkPermission('feed') && (
                        <SidebarItem
                            icon={<MessageSquare size={18} />}
                            label="Mural"
                            active={location.pathname === '/staff/feed'}
                            onClick={() => { navigate('/staff/feed'); setIsOpen(false); }}
                            routeKey="feed"
                        />
                    )}
                    {checkPermission('quotes') && (
                        <SidebarItem
                            icon={<Quote size={18} />}
                            label="Orçamentos"
                            active={location.pathname === '/staff/quotes'}
                            onClick={() => { navigate('/staff/quotes'); setIsOpen(false); }}
                            routeKey="quotes"
                        />
                    )}
                    {checkPermission('quotes') && import.meta.env.VITE_SCHEDULING_WIZARD_V2_ENABLED === 'true' && (
                        <SidebarItem
                            icon={<Wand2 size={18} />}
                            label="Wizard de Agenda"
                            active={location.pathname.startsWith('/staff/scheduling-wizard')}
                            onClick={() => { navigate('/staff/scheduling-wizard'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('agenda-spa') && (
                        <SidebarItem
                            icon={<Sparkles size={18} />}
                            label="Agenda SPA"
                            active={location.pathname === '/staff/agenda-spa'}
                            onClick={() => { navigate('/staff/agenda-spa'); setIsOpen(false); }}
                            routeKey="agenda-spa"
                        />
                    )}
                    {checkPermission('agenda-log') && (
                        <SidebarItem
                            icon={<Truck size={18} />}
                            label="Agenda LOG"
                            active={location.pathname === '/staff/agenda-log'}
                            onClick={() => { navigate('/staff/agenda-log'); setIsOpen(false); }}
                            routeKey="agenda-log"
                        />
                    )}
                    {checkPermission('customers') && (
                        <SidebarItem
                            icon={<Users size={18} />}
                            label="Clientes"
                            active={location.pathname.startsWith('/staff/customers')}
                            onClick={() => { navigate('/staff/customers'); setIsOpen(false); }}
                            routeKey="customers"
                        />
                    )}
                    {checkPermission('recurrence') && (
                        <SidebarItem
                            icon={<History size={18} />}
                            label="Recorrentes"
                            active={location.pathname.startsWith('/staff/recurrence')}
                            onClick={() => { navigate('/staff/recurrence'); setIsOpen(false); }}
                        />
                    )}
                    {(user?.role === 'MASTER' || user?.role === 'ADMIN') && (
                        <SidebarItem
                            icon={<Shield size={18} />}
                            label="Auditoria"
                            active={location.pathname === '/staff/audit'}
                            onClick={() => { navigate('/staff/audit'); setIsOpen(false); }}
                        />
                    )}
                </SidebarGroup>

                <SidebarGroup label="Operacional" isCollapsed={isCollapsed}>
                    {checkPermission('services') && (
                        <SidebarItem
                            icon={<ClipboardList size={18} />}
                            label="Serviços"
                            active={location.pathname === '/staff/services'}
                            onClick={() => { navigate('/staff/services'); setIsOpen(false); }}
                            routeKey="services"
                        />
                    )}
                    {checkPermission('management') && (
                        <SidebarItem
                            icon={<Package size={18} />}
                            label="Produtos"
                            active={location.pathname === '/staff/products'}
                            onClick={() => { navigate('/staff/products'); setIsOpen(false); }}
                            routeKey="products"
                        />
                    )}
                    {checkPermission('billing') && (
                        <SidebarItem
                            icon={<CreditCard size={18} />}
                            label="Financeiro"
                            active={location.pathname === '/staff/billing'}
                            onClick={() => { navigate('/staff/billing'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('pos') && (
                        <SidebarItem
                            icon={<ShoppingCart size={18} />}
                            label="Caixa (PDV)"
                            active={location.pathname === '/staff/pos'}
                            onClick={() => { navigate('/staff/pos'); setIsOpen(false); }}
                            routeKey="pos"
                        />
                    )}
                    {checkPermission('reports') && (
                        <SidebarItem
                            icon={<FileText size={18} />}
                            label="Relatórios"
                            active={location.pathname === '/staff/reports'}
                            onClick={() => { navigate('/staff/reports'); setIsOpen(false); }}
                        />
                    )}
                </SidebarGroup>

                <SidebarGroup label="Gestão" isCollapsed={isCollapsed}>
                    {checkPermission('management') && (
                        <SidebarItem
                            icon={<TrendingUp size={18} />}
                            label="Gestão"
                            active={location.pathname === '/staff/management'}
                            onClick={() => { navigate('/staff/management'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('strategy') && (
                        <SidebarItem
                            icon={<Target size={18} />}
                            label="Estratégia"
                            active={location.pathname === '/staff/strategy'}
                            onClick={() => { navigate('/staff/strategy'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('transport') && (
                        <SidebarItem
                            icon={<Truck size={18} />}
                            label="Transporte"
                            active={location.pathname === '/staff/transport'}
                            onClick={() => { navigate('/staff/transport'); setIsOpen(false); }}
                            routeKey="agenda-log"
                        />
                    )}
                    {checkPermission('transport-config') && (
                        <SidebarItem
                            icon={<Settings size={18} />}
                            label="Config. Transporte"
                            active={location.pathname === '/staff/transport-config'}
                            onClick={() => { navigate('/staff/transport-config'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('users') && (
                        <SidebarItem
                            icon={<Users size={18} />}
                            label="Usuários / Cargos"
                            active={location.pathname === '/staff/users'}
                            onClick={() => { navigate('/staff/users'); setIsOpen(false); }}
                            routeKey="users"
                        />
                    )}
                </SidebarGroup>

                {(checkPermission('hr-collaborators') || checkPermission('hr-pay-periods')) && (
                    <SidebarGroup label="RH" isCollapsed={isCollapsed}>
                        {checkPermission('hr-collaborators') && (
                            <SidebarItem
                                icon={<Users size={18} />}
                                label="Colaboradores"
                                active={location.pathname === '/staff/hr/collaborators'}
                                onClick={() => { navigate('/staff/hr/collaborators'); setIsOpen(false); }}
                            />
                        )}
                        {checkPermission('hr-pay-periods') && (
                            <SidebarItem
                                icon={<Briefcase size={18} />}
                                label="Fechamentos"
                                active={location.pathname === '/staff/hr/pay-periods'}
                                onClick={() => { navigate('/staff/hr/pay-periods'); setIsOpen(false); }}
                            />
                        )}
                    </SidebarGroup>
                )}

                <SidebarGroup label="Sistema" isCollapsed={isCollapsed}>
                    {checkPermission('support') && (
                        <SidebarItem
                            icon={<AlertTriangle size={18} />}
                            label="Chamados Técnicos"
                            active={location.pathname === '/staff/support'}
                            onClick={() => { navigate('/staff/support'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('notifications') && (
                        <SidebarItem
                            icon={<Bell size={18} />}
                            label="Notificações"
                            active={location.pathname === '/staff/notifications'}
                            onClick={() => { navigate('/staff/notifications'); setIsOpen(false); }}
                            badge={unreadCount}
                        />
                    )}
                    {checkPermission('profile') && (
                        <SidebarItem
                            icon={<UserIcon size={18} />}
                            label="Meu Perfil"
                            active={location.pathname === '/staff/profile'}
                            onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('my-hr') && (
                        <SidebarItem
                            icon={<Clock size={18} />}
                            label="Meu RH"
                            active={location.pathname === '/staff/my-hr'}
                            onClick={() => { navigate('/staff/my-hr'); setIsOpen(false); }}
                        />
                    )}
                    {user?.pauseMenuEnabled && (
                        <SidebarItem
                            icon={<Gamepad2 size={18} />}
                            label="Pausa"
                            active={location.pathname.startsWith('/pausa')}
                            onClick={() => { navigate('/pausa'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('settings') && (
                        <SidebarItem
                            icon={<Smartphone size={18} />}
                            label="Configurações do App"
                            active={location.pathname === '/staff/settings'}
                            onClick={() => { navigate('/staff/settings'); setIsOpen(false); }}
                        />
                    )}
                </SidebarGroup>
            </div>
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

            {/* Mobile Drawer (Keep as is, but clean up structure if needed) */}
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
                            {navItems}
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

            {/* Desktop Sidebar Redesign - Floating Glass Style (Restored) */}
            <aside
                className={`hidden md:flex flex-col relative h-full shrink-0 
                bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-white/20 dark:border-zinc-800
                rounded-r-[var(--radius-2xl)] overflow-hidden shadow-2xl z-20 
                mr-0 pr-0
                ${isCollapsed ? 'w-20' : 'w-[250px]'
                    }`}
            >
                {/* Sheen effect is handled via CSS ::before on .sidebar-glass-panel */}

                {/* Header fixo - Premium Capsule style */}
                <div className="shrink-0 p-5 flex items-center justify-between z-10">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/5 rounded-2xl shadow-sm cursor-pointer hover:bg-white/10 transition-colors select-none"
                            onClick={(e) => {
                                if (e.detail === 3) {
                                    import('react-hot-toast').then(({ toast }) => {
                                        toast.success(`Build: ${import.meta.env.VITE_COMMIT_HASH || 'DEV'} (${import.meta.env.MODE})`, {
                                            icon: '🔒',
                                            duration: 5000
                                        });
                                    });
                                } else {
                                    navigate('/staff/dashboard');
                                }
                            }}
                        >
                            <img src="/logo.png" className="w-8 h-8 rounded-xl shadow-inner" alt="Logo" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xs text-heading leading-tight tracking-tight uppercase">Operational</span>
                                <span className="text-[10px] font-medium text-accent opacity-80">7Pet Terminal</span>
                            </div>
                        </motion.div>
                    )}
                    {isCollapsed && (
                        <div className="mx-auto p-2 bg-white/5 rounded-xl border border-white/5 shadow-sm cursor-pointer hover:bg-white/10 transition-all" onClick={() => navigate('/staff/dashboard')}>
                            <img src="/logo.png" className="w-7 h-7 rounded-lg" alt="Logo" />
                        </div>
                    )}
                </div>

                {/* Nav com scroll interno */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar scroll-smooth relative z-10"
                >
                    {navItems}

                    {/* Floating Toggle Button - Glass style */}
                    <button
                        onClick={toggleCollapse}
                        className="absolute -right-3 top-12 w-6 h-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-body-secondary hover:text-accent shadow-lg transition-all z-50 hover:scale-110 active:scale-90"
                        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Footer fixo - Elegant 3-block Footer Dock */}
                <div className="shrink-0 p-4 space-y-4 z-10 border-t border-white/10 bg-black/10 backdrop-blur-sm">
                    {/* Block 1: StatusStrip (Date, Time, Version) */}
                    {!isCollapsed && (
                        <div className="grid grid-cols-2 items-center px-1">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-heading/90 leading-none">
                                    {format(currentTime, "EEE, dd MMM", { locale: ptBR })}
                                </p>
                                <p className="text-[14px] font-bold text-accent font-mono leading-none mt-1">
                                    {format(currentTime, "HH:mm")}
                                </p>
                            </div>
                            <div className="text-right">
                                <p
                                    onClick={() => setShowSystemInfo(true)}
                                    className="text-[9px] font-mono text-body-secondary/40 hover:text-accent transition-colors cursor-pointer hover:underline"
                                    title="Clique para ver informações do sistema"
                                >
                                    v{APP_VERSION.split('-')[0]}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Block 2: ThemeDock (Switch) */}
                    <div className={isCollapsed ? "flex justify-center" : ""}>
                        <ThemeToggle variant={isCollapsed ? 'compact' : 'default'} />
                    </div>

                    {/* Block 3: UserCard */}
                    <div className={`p-2 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-3 shadow-inner relative group ${isCollapsed ? 'justify-center border-none bg-transparent shadow-none p-0' : ''}`}>
                        <div className="relative shrink-0">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                                className="w-8 h-8 rounded-xl border border-accent/10 cursor-pointer group-hover:scale-105 transition-transform"
                                alt="Avatar"
                                onClick={() => navigate('/staff/profile')}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-[var(--sidebar-surface)] shadow-sm" />
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-heading truncate leading-tight cursor-pointer" onClick={() => navigate('/staff/profile')}>
                                    {user?.name?.split(' ')[0] || 'Staff'}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[9px] text-body-secondary/60 uppercase tracking-tighter truncate max-w-[60px]">{user?.role}</span>
                                    <span className="text-body-secondary/20">•</span>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="text-[9px] text-body-secondary/60 hover:text-error transition-colors font-medium"
                                    >
                                        Sair
                                    </button>
                                </div>
                            </div>
                        )}

                        {isCollapsed && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="absolute -top-1 -right-1 bg-white/20 backdrop-blur-lg border border-white/20 rounded-full p-1 text-body-secondary hover:text-error transition-all opacity-0 group-hover:opacity-100 shadow-xl z-20"
                            >
                                <LogOut size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogoutConfirm}
                title="Sair do Sistema"
                description="Tem certeza que deseja sair do sistema?"
                confirmText="Sair"
                confirmColor="bg-red-500"
                cancelText="Cancelar"
            />

            <SystemInfoModal
                isOpen={showSystemInfo}
                onClose={() => setShowSystemInfo(false)}
            />
        </>
    );
}

function SidebarGroup({ label, children, isCollapsed }: { label: string, children: React.ReactNode, isCollapsed: boolean }) {
    if (!children) return null;
    const hasVisibleChildren = Array.isArray(children) ? children.some(c => c) : !!children;
    if (!hasVisibleChildren) return null;

    return (
        <div className="mb-6 last:mb-2 relative z-10">
            {!isCollapsed && (
                <h3 className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--sidebar-group-label)] opacity-70">
                    {label}
                </h3>
            )}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active = false, onClick, badge, id, routeKey }: { icon: any, label: string, active?: boolean, onClick: () => void, badge?: number, id?: string, routeKey?: string }) {
    const { isCollapsed } = useContext(SidebarContext);

    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
            onMouseEnter={() => routeKey && prefetchRoute(routeKey as any)}
            className={`flex items-center relative h-[var(--sidebar-item-height)] rounded-xl transition-all duration-200 group w-full ${isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                } ${active
                    ? 'bg-[var(--sidebar-item-bg-active)] text-[var(--sidebar-item-text-active)] font-bold sidebar-item-active-glow'
                    : 'text-[var(--sidebar-item-text-muted)] hover:bg-white/5 hover:text-[var(--sidebar-item-text)]'
                }`}
            aria-current={active ? 'page' : undefined}
            title={isCollapsed ? label : undefined}
        >

            {/* Active Accent Bar - Glassy gradient style */}
            {active && (
                <motion.div
                    layoutId="sidebar-accent"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-white/60 rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}

            <div className={`shrink-0 transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:text-accent'}`}>
                {icon}
            </div>

            {!isCollapsed && (
                <span className="text-sm truncate flex-1 text-left opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {label}
                </span>
            )}

            {badge !== undefined && badge > 0 && (
                <span className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold shadow-sm ${active ? 'bg-white/20' : 'bg-red-500 text-white'
                    } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );
}
