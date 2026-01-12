import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
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
import { createContext, useContext } from 'react';
import { APP_VERSION } from '../constants/version';

const SidebarContext = createContext({ isCollapsed: false });

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const mobileAsideRef = useRef<HTMLElement>(null);
    const { unreadCount } = useNotification();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('client-sidebar-collapsed');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('client-sidebar-collapsed', String(isCollapsed));
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

    useModalFocusTrap(isOpen, mobileAsideRef);

    const handleLogoutConfirm = () => {
        logout();
        navigate('/');
    };

    const menuItems = (
        <SidebarContext.Provider value={{ isCollapsed }}>
            <nav className="flex-1 space-y-2">
                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={location.pathname === '/client/dashboard'}
                    onClick={() => { navigate('/client/dashboard'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<Dog size={20} />}
                    label="Meus Pets"
                    active={location.pathname === '/client/pets'}
                    onClick={() => { navigate('/client/pets'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<Calendar size={20} />}
                    label="Agendamentos"
                    active={location.pathname === '/client/appointments'}
                    onClick={() => { navigate('/client/appointments'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<FileText size={20} />}
                    label="Orçamentos"
                    active={location.pathname === '/client/quotes'}
                    onClick={() => { navigate('/client/quotes'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<User size={20} />}
                    label="Meu Perfil"
                    active={location.pathname === '/client/profile'}
                    onClick={() => { navigate('/client/profile'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<CreditCard size={20} />}
                    label="Pagamentos"
                    active={location.pathname === '/client/payments'}
                    onClick={() => { navigate('/client/payments'); setIsOpen(false); }}
                />
                <SidebarItem
                    icon={<Bell size={20} />}
                    label="Notificações"
                    active={location.pathname === '/client/notifications'}
                    onClick={() => { navigate('/client/notifications'); setIsOpen(false); }}
                    badge={unreadCount}
                />
                <SidebarItem
                    icon={<Gamepad2 size={20} />}
                    label="Pausa"
                    active={location.pathname.startsWith('/pausa')}
                    onClick={() => { navigate('/pausa'); setIsOpen(false); }}
                />
            </nav>
        </SidebarContext.Provider>
    );

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-6 right-6 z-40 p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                aria-label="Abrir menu de navegação"
                aria-expanded={isOpen}
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
                            className="fixed inset-y-0 right-0 w-80 bg-white z-[60] p-6 flex flex-col shadow-2xl md:hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Menu Lateral"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain" alt="Logo" />
                                    <span className="font-bold text-xl text-secondary">7Pet</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-gray-400 hover:text-secondary"
                                    aria-label="Fechar menu de navegação"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {menuItems}

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
                                            aria-label="Sair da conta"
                                        >
                                            Sair da conta <LogOut size={12} />
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
                    } bg-white border-r border-gray-100 hidden md:flex flex-col ${isCollapsed ? 'p-4' : 'p-6'} fixed h-full transition-all duration-300 ease-out`}
            >
                <div className={`flex items-center ${isCollapsed ? 'justify-center mb-6' : 'gap-2 mb-10'} cursor-pointer`} onClick={() => navigate('/client/dashboard')}>
                    <img
                        src="/logo.png"
                        className="w-8 h-8 rounded-lg object-contain hover:rotate-12 transition-transform"
                        alt="Logo"
                    />
                    {!isCollapsed && (
                        <span className="font-bold text-xl text-secondary whitespace-nowrap overflow-hidden">
                            7Pet
                        </span>
                    )}
                </div>

                {/* Toggle Collapse Button */}
                <div className="mb-4">
                    <button
                        onClick={toggleCollapse}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-primary/10 text-gray-400 hover:text-primary transition-all"
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

                {menuItems}


                <div className="pt-6 border-t border-gray-100">
                    {/* Versão do Sistema */}
                    {!isCollapsed && (
                        <div className="mb-4 px-2">
                            <ThemeToggle />
                            <p className="text-[10px] text-gray-400 text-center font-mono mt-2">
                                {APP_VERSION}
                            </p>
                        </div>
                    )}

                    <div className={`flex items-center gap-3 mb-6 p-2 hover:bg-gray-50 rounded-2xl transition-colors ${isCollapsed ? 'justify-center' : ''
                        }`}>

                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email}&background=00D664&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-primary/20"
                            alt="Avatar"
                            title={user?.customer?.name || 'Cliente'}
                        />
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-secondary truncate">{user?.customer?.name || 'Cliente'}</p>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                                    aria-label="Sair da conta"
                                >
                                    Sair da conta <LogOut size={12} aria-hidden="true" />
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
                description="Tem certeza que deseja encerrar sua sessão? Você precisará fazer login novamente para acessar seus dados."
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
            onClick={onClick}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl cursor-pointer transition-all w-full text-left relative ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'
                }`}
            aria-label={`Navegar para ${label}`}
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
                    <span className="font-semibold flex-1">{label}</span>
                    {badge !== undefined && badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {badge > 99 ? '99+' : badge}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
