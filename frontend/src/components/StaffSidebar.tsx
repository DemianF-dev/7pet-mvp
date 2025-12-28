import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    Truck,
    Quote,
    Users,
    ClipboardList,
    CreditCard,
    TrendingUp,
    FileText,
    LogOut,
    Menu as MenuIcon,
    X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function StaffSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const checkPermission = (module: string) => {
        if (!user) return false;

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
            case 'kanban': return true; // All staff
            case 'transport': return user.role !== 'SPA';
            case 'quotes': return user.role !== 'SPA';
            case 'customers': return user.role !== 'SPA';
            case 'services': return true; // All staff including SPA
            case 'billing': return user.role !== 'SPA';
            case 'management': return user.role === 'GESTAO' || user.role === 'ADMIN';
            case 'reports': return user.role === 'GESTAO' || user.role === 'ADMIN';
            case 'users': return user.role === 'ADMIN';
            default: return false;
        }
    };

    const menuItems = (
        <nav className="flex-1 space-y-2">
            {checkPermission('dashboard') && (
                <SidebarItem
                    icon={<LayoutDashboard size={20} />}
                    label="Dashboard"
                    active={location.pathname === '/staff/dashboard'}
                    onClick={() => { navigate('/staff/dashboard'); setIsOpen(false); }}
                />
            )}

            {checkPermission('kanban') && (
                <SidebarItem
                    icon={<Calendar size={20} />}
                    label="Agendamentos"
                    active={location.pathname === '/staff/kanban'}
                    onClick={() => { navigate('/staff/kanban'); setIsOpen(false); }}
                />
            )}

            {checkPermission('transport') && (
                <SidebarItem
                    icon={<Truck size={20} />}
                    label="Logística"
                    active={location.pathname === '/staff/transport'}
                    onClick={() => { navigate('/staff/transport'); setIsOpen(false); }}
                />
            )}

            {checkPermission('quotes') && (
                <SidebarItem
                    icon={<Quote size={20} />}
                    label="Orçamentos"
                    active={location.pathname === '/staff/quotes'}
                    onClick={() => { navigate('/staff/quotes'); setIsOpen(false); }}
                />
            )}

            {checkPermission('customers') && (
                <SidebarItem
                    icon={<Users size={20} />}
                    label="Clientes"
                    active={location.pathname === '/staff/customers'}
                    onClick={() => { navigate('/staff/customers'); setIsOpen(false); }}
                />
            )}

            {checkPermission('services') && (
                <SidebarItem
                    icon={<ClipboardList size={20} />}
                    label="Serviços"
                    active={location.pathname === '/staff/services'}
                    onClick={() => { navigate('/staff/services'); setIsOpen(false); }}
                />
            )}

            {checkPermission('billing') && (
                <SidebarItem
                    icon={<CreditCard size={20} />}
                    label="Financeiro"
                    active={location.pathname === '/staff/billing'}
                    onClick={() => { navigate('/staff/billing'); setIsOpen(false); }}
                />
            )}

            {checkPermission('management') && (
                <SidebarItem
                    icon={<TrendingUp size={20} />}
                    label="Gestão"
                    active={location.pathname === '/staff/management'}
                    onClick={() => { navigate('/staff/management'); setIsOpen(false); }}
                />
            )}

            {checkPermission('reports') && (
                <SidebarItem
                    icon={<FileText size={20} />}
                    label="Relatórios"
                    active={location.pathname === '/staff/reports'}
                    onClick={() => { navigate('/staff/reports'); setIsOpen(false); }}
                />
            )}

            {checkPermission('users') && (
                <SidebarItem
                    icon={<Users size={20} />}
                    label="Usuários"
                    active={location.pathname === '/staff/users'}
                    onClick={() => { navigate('/staff/users'); setIsOpen(false); }}
                />
            )}
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
                            className="fixed inset-y-0 left-0 w-80 bg-secondary z-[60] p-6 flex flex-col shadow-2xl md:hidden"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">7</div>
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
                                        src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                                        className="w-10 h-10 rounded-full"
                                        alt="Avatar"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{user?.customer?.name || user?.email || 'Staff'}</p>
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
            <aside className="w-64 bg-secondary border-r border-secondary-dark hidden md:flex flex-col p-6 fixed h-full text-white">
                <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/staff/dashboard')}>
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold hover:rotate-12 transition-transform">7</div>
                    <span className="font-bold text-xl">7Pet Operational</span>
                </div>

                {menuItems}

                <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-6 p-2 bg-white/5 rounded-2xl">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email || 'Staff'}&background=00D664&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-primary/20"
                            alt="Avatar"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.customer?.name || user?.email || 'Staff'}</p>
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
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </div>
    );
}
