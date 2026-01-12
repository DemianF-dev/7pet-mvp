import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileOverflowMenuProps {
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

/**
 * Bottom sheet overlay menu for secondary actions.
 * Bitrix-like pattern: Slide up from bottom, backdrop click to close.
 */
export default function MobileOverflowMenu({ isOpen, onClose, children }: MobileOverflowMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-surface)] rounded-t-[20px] z-50 max-h-[70vh] flex flex-col"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center py-2">
                            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--color-border)]">
                            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                                Opções
                            </h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-fill-tertiary)] text-[var(--color-text-secondary)]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {children || (
                                <div className="text-center text-[var(--color-text-secondary)] py-8">
                                    Nenhuma opção disponível
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
