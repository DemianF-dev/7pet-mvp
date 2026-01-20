import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * IconButton Component
 * Specialized button for icons with standard tap targets
 */

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'glass';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    loading?: boolean;
    'aria-label': string; // Mandatory for accessibility
}

const variantStyles: Record<IconButtonVariant, string> = {
    primary: 'bg-[var(--color-accent-primary)] text-white shadow-sm hover:brightness-110',
    secondary: 'bg-[var(--color-fill-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-fill-primary)]',
    tertiary: 'bg-transparent text-[var(--color-accent-primary)] hover:bg-[var(--color-fill-quaternary)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-fill-quaternary)]',
    danger: 'bg-[var(--color-error)] text-white shadow-sm hover:brightness-110',
    glass: 'glass-surface text-[var(--color-text-primary)] hover:bg-white/20',
};

const sizeStyles: Record<IconButtonSize, string> = {
    sm: 'p-1.5 min-w-[44px] min-h-[44px] rounded-[var(--radius-md)]',
    md: 'p-2.5 min-w-[44px] min-h-[44px] rounded-[var(--radius-lg)]',
    lg: 'p-3.5 min-w-[52px] min-h-[52px] rounded-[var(--radius-xl)]',
};

export function IconButton({
    icon: Icon,
    variant = 'secondary',
    size = 'md',
    loading = false,
    className = '',
    disabled,
    ...props
}: IconButtonProps) {
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

    return (
        <button
            className={`
                inline-flex items-center justify-center
                transition-all duration-[var(--duration-fast)]
                active:scale-90
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]/40
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="animate-spin rounded-full border-2 border-current border-t-transparent w-[1em] h-[1em]" />
            ) : (
                <Icon size={iconSize} strokeWidth={1.75} />
            )}
        </button>
    );
}

export default IconButton;
