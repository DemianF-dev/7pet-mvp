import React from 'react';

/**
 * Badge Component
 * Apple-style status badges and tags
 */

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: `
        bg-[var(--color-accent-primary)]/10
        text-[var(--color-accent-primary)]
    `,
    success: `
        bg-[var(--color-success)]/10
        text-[var(--color-success)]
    `,
    warning: `
        bg-[var(--color-warning)]/10
        text-[var(--color-warning)]
    `,
    error: `
        bg-[var(--color-error)]/10
        text-[var(--color-error)]
    `,
    info: `
        bg-[var(--color-info)]/10
        text-[var(--color-info)]
    `,
    neutral: `
        bg-[var(--color-fill-secondary)]
        text-[var(--color-text-secondary)]
    `,
};

const sizeStyles: Record<BadgeSize, string> = {
    sm: 'px-1.5 py-0.5 text-[10px] rounded-[var(--radius-sm)]',
    md: 'px-2 py-1 text-[var(--font-size-caption1)] rounded-[var(--radius-md)]',
};

export function Badge({
    variant = 'default',
    size = 'md',
    dot = false,
    children,
    className = '',
    ...props
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5
                font-[var(--font-weight-medium)]
                whitespace-nowrap
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            {...props}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full bg-current"
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}

/**
 * Tag Component
 * Slightly different from Badge - can be removable
 */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    onRemove?: () => void;
    children: React.ReactNode;
}

export function Tag({
    variant = 'neutral',
    onRemove,
    children,
    className = '',
    ...props
}: TagProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1
                px-2 py-1
                text-[var(--font-size-caption1)]
                font-[var(--font-weight-medium)]
                rounded-[var(--radius-md)]
                ${variantStyles[variant]}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            {...props}
        >
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-0.5 hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label="Remove"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                </button>
            )}
        </span>
    );
}

/**
 * StatusDot Component
 * Simple status indicator dot
 */
export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: 'online' | 'offline' | 'busy' | 'away';
    pulse?: boolean;
}

const statusColors: Record<StatusDotProps['status'], string> = {
    online: 'bg-[var(--color-success)]',
    offline: 'bg-[var(--color-text-tertiary)]',
    busy: 'bg-[var(--color-error)]',
    away: 'bg-[var(--color-warning)]',
};

export function StatusDot({
    status,
    pulse = false,
    className = '',
    ...props
}: StatusDotProps) {
    return (
        <span
            className={`
                inline-block w-2 h-2 rounded-full
                ${statusColors[status]}
                ${pulse ? 'animate-pulse' : ''}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            aria-label={status}
            {...props}
        />
    );
}

export default Badge;
