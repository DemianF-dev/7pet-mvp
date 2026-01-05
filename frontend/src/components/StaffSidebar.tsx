import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard,
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
    Smartphone
} from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function StaffSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        if (!window.confirm('Deseja realmente sair do sistema?')) return;
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

            {/* 2. Orçamentos */}
            {checkPermission('quotes') && (
                <SidebarItem
                    icon={<Quote size={20} />}
                    label="Orçamentos"
                    active={location.pathname === '/staff/quotes'}
                    onClick={() => { navigate('/staff/quotes'); setIsOpen(false); }}
                />
            )}

            {/* 3. Agenda SPA */}
            {checkPermission('agenda-spa') && (
                <SidebarItem
                    icon={<Sparkles size={20} />}
                    label="Agenda SPA"
                    active={location.pathname === '/staff/agenda-spa'}
                    onClick={() => { navigate('/staff/agenda-spa'); setIsOpen(false); }}
                />
            )}

            {/* 4. Agenda LOG */}
            {checkPermission('agenda-log') && (
                <SidebarItem
                    icon={<Truck size={20} />}
                    label="Agenda LOG"
                    active={location.pathname === '/staff/agenda-log'}
                    onClick={() => { navigate('/staff/agenda-log'); setIsOpen(false); }}
                />
            )}

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
            />

            {/* 12. Meu Perfil */}
            <SidebarItem
                icon={<UserIcon size={20} />}
                label="Meu Perfil"
                active={location.pathname === '/staff/profile'}
                onClick={() => { navigate('/staff/profile'); setIsOpen(false); }}
            />

            {/* 13. Configurações PWA */}
            <SidebarItem
                icon={<Smartphone size={20} />}
                label="Configurações do App"
                active={location.pathname === '/staff/settings'}
                onClick={() => { navigate('/staff/settings'); setIsOpen(false); }}
            />
        </nav>

    );

    return (
        <>
            {/* Mobile Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden fixed top-6 left-6 z-40 p-3 bg-secondary text-white rounded-2xl shadow-xl shadow-secondary/20 hover:scale-110 active:scale-95 transition-all"
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
                            className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[50] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-80 bg-secondary z-[60] p-6 flex flex-col shadow-2xl md:hidden overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain" alt="Logo" />
                                    <span className="font-bold text-xl text-white">7Pet</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {menuItems}

                            <div className="pt-6 border-t border-white/10 mt-auto">
                                <div className="flex items-center gap-3 mb-2 p-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user?.name || user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                                        className="w-10 h-10 rounded-full cursor-pointer"
                                        alt="Avatar"
                                        onClick={() => navigate('/staff/profile')}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate cursor-pointer" onClick={() => navigate('/staff/profile')}>{user?.name || user?.customer?.name || user?.email || 'Staff'}</p>
                                        <button
                                            onClick={handleLogout}
                                            className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
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
            <aside className="w-64 bg-secondary border-r border-secondary-dark hidden md:flex flex-col p-6 fixed h-full text-white overflow-y-auto">
                <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/staff/dashboard')}>
                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain hover:rotate-12 transition-transform" alt="Logo" />
                    <span className="font-bold text-xl">7Pet Operational</span>
                </div>

                {menuItems}


                <div className="pt-6 border-t border-white/10">
                    {/* Versão do Sistema */}
                    <div className="mb-4 px-2">
                        <p className="text-[10px] text-white/40 text-center font-mono">
                            v0.1.0-beta
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mb-6 p-2 bg-white/5 rounded-2xl">

                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.name || user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform"
                            alt="Avatar"
                            onClick={() => navigate('/staff/profile')}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/staff/profile')}>{user?.name || user?.customer?.name || user?.email || 'Staff'}</p>
                            <button
                                onClick={handleLogout}
                                className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                            >
                                Sair <LogOut size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all w-full text-left ${active ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            aria-current={active ? 'page' : undefined}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
}
