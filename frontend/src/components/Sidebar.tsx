import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
    Bell
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutConfirm = () => {
        logout();
        navigate('/');
    };

    const menuItems = (
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
            />
        </nav>
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
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-80 bg-white z-[60] p-6 flex flex-col shadow-2xl md:hidden"
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
            <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col p-6 fixed h-full">
                <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => navigate('/client/dashboard')}>
                    <img src="/logo.png" className="w-8 h-8 rounded-lg object-contain hover:rotate-12 transition-transform" alt="Logo" />
                    <span className="font-bold text-xl text-secondary">7Pet</span>
                </div>

                {menuItems}

                <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-6 p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.customer?.name || user?.email}&background=00D664&color=fff`}
                            className="w-10 h-10 rounded-full border-2 border-primary/20"
                            alt="Avatar"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-secondary truncate">{user?.customer?.name || 'Cliente'}</p>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                            >
                                Sair da conta <LogOut size={12} />
                            </button>
                        </div>
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

function SidebarItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all w-full text-left ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'}`}
            aria-label={`Navegar para ${label}`}
            aria-current={active ? 'page' : undefined}
        >
            {icon}
            <span className="font-semibold">{label}</span>
        </button>
    );
}
