import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect, useContext, createContext } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar,
    Dog,
    User,
    FileText,
    CreditCard,
    LogOut,
    Menu as MenuIcon,
    X,
    LayoutDashboard,
    Bell,
    Gamepad2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useModalFocusTrap } from '../hooks/useModalKeyboard';
import ConfirmModal from './ConfirmModal';
import ThemeToggle from './ThemeToggle';
import { useNotification } from '../context/NotificationContext';
import { DEFAULT_PERMISSIONS_BY_ROLE } from '../constants/permissions';
import { APP_VERSION } from '../constants/version';
import SystemStatusModal from './SystemStatusModal';

const SidebarContext = createContext({ isCollapsed: false });

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const mobileAsideRef = useRef<HTMLElement>(null);
    const { unreadCount } = useNotification();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('client-sidebar-collapsed');
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
        localStorage.setItem('client-sidebar-collapsed', String(isCollapsed));
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }, [isCollapsed]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const savedScroll = sessionStorage.getItem('client-sidebar-scroll');
        if (savedScroll) container.scrollTop = parseInt(savedScroll, 10);
        const handleScroll = () => {
            sessionStorage.setItem('client-sidebar-scroll', String(container.scrollTop));
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);
    useModalFocusTrap(isOpen, mobileAsideRef);

    const handleLogoutConfirm = () => {
        logout();
        navigate('/');
    };

    const checkPermission = (module: string) => {
        if (!user) return false;
        if (user.role === 'MASTER' || user.division === 'MASTER') return true;
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
                <SidebarGroup label="Principal" isCollapsed={isCollapsed}>
                    {checkPermission('client-dashboard') && (
                        <SidebarItem
                            id="sidemenu-dashboard"
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                            active={location.pathname === '/client/dashboard'}
                            onClick={() => { navigate('/client/dashboard'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('client-pets') && (
                        <SidebarItem
                            id="sidemenu-pets"
                            icon={<Dog size={18} />}
                            label="Meus Pets"
                            active={location.pathname === '/client/pets'}
                            onClick={() => { navigate('/client/pets'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('client-appointments') && (
                        <SidebarItem
                            id="sidemenu-agendamentos"
                            icon={<Calendar size={18} />}
                            label="Agendamentos"
                            active={location.pathname === '/client/appointments'}
                            onClick={() => { navigate('/client/appointments'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('client-quotes') && (
                        <SidebarItem
                            id="sidemenu-orçamentos"
                            icon={<FileText size={18} />}
                            label="Orçamentos"
                            active={location.pathname === '/client/quotes'}
                            onClick={() => { navigate('/client/quotes'); setIsOpen(false); }}
                        />
                    )}
                    {checkPermission('client-payments') && (
                        <SidebarItem
                            id="sidemenu-pagamentos"
                            icon={<CreditCard size={18} />}
                            label="Pagamentos"
                            active={location.pathname === '/client/payments'}
                            onClick={() => { navigate('/client/payments'); setIsOpen(false); }}
                        />
                    )}
                </SidebarGroup>

                <SidebarGroup label="Sistema" isCollapsed={isCollapsed}>
                    {checkPermission('notifications') && (
                        <SidebarItem
                            icon={<Bell size={18} />}
                            label="Notificações"
                            active={location.pathname === '/client/notifications'}
                            onClick={() => { navigate('/client/notifications'); setIsOpen(false); }}
                            badge={unreadCount}
                        />
                    )}
                    <SidebarItem
                        icon={<Gamepad2 size={18} />}
                        label="Pausa"
                        active={location.pathname.startsWith('/pausa')}
                        onClick={() => { navigate('/pausa'); setIsOpen(false); }}
                    />
                    {checkPermission('profile') && (
                        <SidebarItem
                            id="sidemenu-meu-perfil"
                            icon={<User size={18} />}
                            label="Meu Perfil"
                            active={location.pathname === '/client/profile'}
                            onClick={() => { navigate('/client/profile'); setIsOpen(false); }}
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
                className="md:hidden fixed top-6 right-6 z-40 p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                aria-label="Abrir menu de navegação"
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
                            className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[50] md:hidden"
                        />
                        <motion.aside
                            ref={mobileAsideRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-80 bg-white z-[60] p-6 flex flex-col shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain" alt="Logo" />
                                    <span className="font-bold text-xl text-secondary">7Pet</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-secondary">
                                    <X size={24} />
                                </button>
                            </div>
                            {navItems}
                            <div className="pt-6 border-t border-gray-100 mt-auto">
                                <div className="mb-4">
                                    <ThemeToggle />
                                </div>
                                <div className="flex items-center gap-3 mb-2 p-2 bg-gray-50 rounded-2xl">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email}&background=00D664&color=fff`}
                                        className="w-10 h-10 rounded-full"
                                        alt="Avatar"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-secondary truncate">{user?.customer?.name || 'Cliente'}</p>
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
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

            {/* Desktop Sidebar Redesign - Floating Glass */}
            <aside
                className={`hidden md:flex flex-col relative h-full shrink-0 sidebar-glass-panel rounded-[var(--radius-2xl)] overflow-hidden ${isCollapsed ? 'w-20' : 'w-[250px]'
                    }`}
            >
                {/* Header fixo - Premium Capsule style */}
                <div className="shrink-0 p-5 flex items-center justify-between z-10">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/5 rounded-2xl shadow-sm cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => navigate('/client/dashboard')}
                        >
                            <img src="/logo.png" className="w-8 h-8 rounded-xl shadow-inner" alt="Logo" />
                            <div className="flex flex-col">
                                <span className="font-bold text-xs text-heading leading-tight tracking-tight uppercase">Terminal</span>
                                <span className="text-[10px] font-medium text-accent opacity-80">My7Pet Client</span>
                            </div>
                        </motion.div>
                    )}
                    {isCollapsed && (
                        <div className="mx-auto p-2 bg-white/5 rounded-xl border border-white/5 shadow-sm cursor-pointer hover:bg-white/10 transition-all" onClick={() => navigate('/client/dashboard')}>
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
                                    className="text-[9px] font-mono text-body-secondary/40 hover:text-accent transition-colors cursor-pointer"
                                    onClick={() => setIsStatusModalOpen(true)}
                                >
                                    v{APP_VERSION.split('-')[0]}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Block 2: ThemeDock (Switch) */}
                    <div className={isCollapsed ? "flex justify-center" : ""}>
                        <ThemeToggle />
                    </div>

                    {/* Block 3: UserCard */}
                    <div className={`p-2 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-3 shadow-inner relative group ${isCollapsed ? 'justify-center border-none bg-transparent shadow-none p-0' : ''}`}>
                        <div className="relative shrink-0">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email}&background=00D664&color=fff`}
                                className="w-8 h-8 rounded-xl border border-accent/10 cursor-pointer group-hover:scale-105 transition-transform"
                                alt="Avatar"
                                onClick={() => navigate('/client/profile')}
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-[var(--sidebar-surface)] shadow-sm" />
                        </div>

                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-heading truncate leading-tight cursor-pointer" onClick={() => navigate('/client/profile')}>
                                    {user?.customer?.name || 'Cliente'}
                                </p>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-[9px] text-body-secondary/60 hover:text-error transition-colors font-medium mt-0.5"
                                >
                                    Sair da conta
                                </button>
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
                title="Sair do Sistema?"
                description="Tem certeza que deseja encerrar sua sessão?"
                confirmText="Sair Agora"
                confirmColor="bg-red-500"
            />

            <SystemStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
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
                <h3 className="px-4 mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--sidebar-group-label)] opacity-70">
                    {label}
                </h3>
            )}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active = false, onClick, badge, id }: { icon: any, label: string, active?: boolean, onClick: () => void, badge?: number, id?: string }) {
    const { isCollapsed } = useContext(SidebarContext);

    return (
        <button
            id={id}
            type="button"
            onClick={onClick}
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
                    layoutId="sidebar-accent-client"
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
