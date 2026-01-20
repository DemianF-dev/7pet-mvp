import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Button Component
 * Apple-style button with multiple variants, sizes, and states
 */

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
        bg-[var(--color-accent-primary)] text-white
        hover:opacity-90 
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]
    `,
    secondary: `
        bg-[var(--color-fill-secondary)] text-[var(--color-text-primary)]
        hover:bg-[var(--color-fill-primary)]
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    tertiary: `
        bg-transparent text-[var(--color-accent-primary)]
        hover:bg-[var(--color-fill-quaternary)]
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outline: `
        bg-transparent text-[var(--color-text-primary)]
        border border-[var(--color-border)]
        hover:bg-[var(--color-fill-quaternary)] hover:border-[var(--color-border-opaque)]
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
    destructive: `
        bg-[var(--color-error)] text-white
        hover:opacity-90
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-[var(--shadow-sm)]
    `,
    ghost: `
        bg-transparent text-[var(--color-text-secondary)]
        hover:text-[var(--color-text-primary)] hover:bg-[var(--color-fill-quaternary)]
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed
    `,
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-[var(--font-size-footnote)] rounded-[var(--radius-md)] gap-1.5 min-h-[44px]',
    md: 'px-4 py-2 text-[var(--font-size-body)] rounded-[var(--radius-lg)] gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-[var(--font-size-headline)] rounded-[var(--radius-xl)] gap-2.5 min-h-[52px]',
};

export function Button({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
        inline-flex items-center justify-center
        font-[var(--font-weight-semibold)]
        transition-all duration-[var(--duration-fast)]
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-accent-primary)]/40
        select-none
    `;

    const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 20;

    return (
        <button
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg
                    className="animate-spin"
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={iconSize} />}
                    {children && <span>{children}</span>}
                    {Icon && iconPosition === 'right' && <Icon size={iconSize} />}
                </>
            )}
        </button>
    );
}

export default Button;
