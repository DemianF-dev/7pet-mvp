import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: 'none' | 'subtle' | 'primary' | 'secondary';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hover = false, gradient = 'none', ...props }, ref) => {

        const gradientStyles = {
            none: '',
            subtle: 'bg-gradient-to-br from-white/40 to-white/10 dark:from-gray-800/40 dark:to-gray-900/10',
            primary: 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 border-[var(--color-primary)]/20',
            secondary: 'bg-gradient-to-br from-[var(--color-secondary)]/10 to-[var(--color-secondary)]/5 border-[var(--color-secondary)]/20',
        };

        return (
            <motion.div
                ref={ref}
                className={cn(
                    'glass-panel rounded-2xl border border-white/20 dark:border-gray-700/30 p-6 shadow-xl backdrop-blur-md relative overflow-hidden',
                    gradientStyles[gradient],
                    hover && 'hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-white/40 dark:hover:border-gray-600/50',
                    className
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                {...props}
            >
                {/* Shine effect overlay */}
                {hover && (
                    <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);

GlassCard.displayName = 'GlassCard';
