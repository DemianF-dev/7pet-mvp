import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useMobileNav } from '../../hooks/useMobileNav';

interface MobileNavSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileNavSettings({ isOpen, onClose }: MobileNavSettingsProps) {
    const { availableTabs, pinnedIds, togglePin } = useMobileNav();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full bg-[var(--color-bg-surface)] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            >
                {/* Handle */}
                <div
                    className="w-12 h-1.5 bg-[var(--color-border)] rounded-full mx-auto my-3 shrink-0"
                    onClick={onClose}
                />

                {/* Header */}
                <div className="px-6 pb-4 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Personalizar Barra</h2>
                        <p className="text-sm text-[var(--color-text-secondary)]">Selecione até 6 abas principais</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)]"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {availableTabs.map((tab) => {
                        const isPinned = pinnedIds.includes(tab.id);
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => togglePin(tab.id)}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${isPinned
                                        ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)] border-2'
                                        : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] opacity-60'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPinned ? 'bg-[var(--color-accent-primary)] text-white' : 'bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)]'
                                    }`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className={`font-bold ${isPinned ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                        {tab.label}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-secondary)]">{tab.path}</p>
                                </div>
                                {isPinned ? (
                                    <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white">
                                        <Check size={16} />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border border-[var(--color-border)]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-[var(--color-accent-primary)] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
