import { Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileQuickActionsProps {
    onAction?: (type: string) => void;
}

export default function MobileQuickActions({ onAction }: MobileQuickActionsProps) {
    const location = useLocation();

    // Determine if we should show FAB and what action it does
    const getActionConfig = () => {
        if (location.pathname.startsWith('/staff/quotes')) {
            return { icon: Plus, label: 'Novo Orçamento', type: 'new_quote' };
        }
        return null;
    };

    const config = getActionConfig();

    if (!config) return null;

    return (
        <AnimatePresence>
            <motion.button
                key={config.type}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAction?.(config.type)}
                className="fixed right-[var(--fab-right)] bottom-[var(--fab-bottom)] w-12 h-12 bg-[var(--color-accent-primary)] text-white rounded-full shadow-[0_8px_25px_rgba(var(--color-accent-primary-rgb),0.4)] flex items-center justify-center z-[var(--z-fab)] border-4 border-[var(--color-bg-surface)]"
                aria-label={config.label}
            >
                <config.icon size={24} strokeWidth={3} />
            </motion.button>
        </AnimatePresence>
    );
}
