import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOBILE_MORE, CLIENT_MOBILE_MORE } from '../../navigation/mobileNav';
import { useAuthStore } from '../../store/authStore';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const items = user?.role === 'CLIENTE' ? CLIENT_MOBILE_MORE : MOBILE_MORE;

    // Filter by role
    const visibleItems = items.filter(item => {
        if (!item.rolesAllowed) return true;
        return item.rolesAllowed.includes(user?.role || '');
    });

    const handleItemClick = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-surface)] rounded-t-[32px] z-[80] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-[var(--color-border-subtle)]"
                        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 24px))' }}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center py-4">
                            <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full opacity-50" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pb-6 pt-2">
                            <div>
                                <h3 className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                                    Mais Opções
                                </h3>
                                <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-[0.1em] font-bold mt-0.5">
                                    7Pet Platform
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] active:scale-90 transition-transform"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Items Grid/List */}
                        <div className="flex-1 overflow-y-auto px-4 space-y-2">
                            {visibleItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => handleItemClick(item.path)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-fill-secondary)] active:scale-[0.98] transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)] flex items-center justify-center transition-colors group-hover:text-[var(--color-accent-primary)]">
                                            <Icon size={24} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <span className="block font-bold text-[var(--color-text-primary)]">
                                                {item.label}
                                            </span>
                                            <span className="text-xs text-[var(--color-text-tertiary)]">
                                                Acessar recurso
                                            </span>
                                        </div>

                                        <ChevronRight size={18} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
