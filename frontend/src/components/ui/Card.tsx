import React from 'react';

/**
 * Card Component
 * Apple-style card with multiple variants
 */

export type CardVariant = 'default' | 'elevated' | 'glass' | 'outline';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
    default: `
        bg-[var(--color-bg-surface)]
        border border-[var(--color-border)]
        shadow-[var(--shadow-card)]
    `,
    elevated: `
        bg-[var(--color-bg-elevated)]
        shadow-[var(--shadow-lg)]
    `,
    glass: `
        glass-surface
    `,
    outline: `
        bg-transparent
        border border-[var(--color-border)]
    `,
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export function Card({
    variant = 'default',
    padding = 'md',
    hover = false,
    children,
    className = '',
    ...props
}: CardProps) {
    const hoverStyles = hover
        ? 'transition-all duration-[var(--duration-normal)] hover:shadow-[var(--shadow-lg)] hover:scale-[1.01] hover:border-[var(--color-accent-primary)]/20 cursor-pointer'
        : '';

    return (
        <div
            className={`
                rounded-[var(--radius-xl)]
                ${variantStyles[variant]}
                ${paddingStyles[padding]}
                ${hoverStyles}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Card Header Subcomponent
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, className = '', ...props }: CardHeaderProps) {
    return (
        <div
            className={`flex items-start justify-between gap-4 mb-4 ${className}`}
            {...props}
        >
            <div>
                <h3 className="text-[var(--font-size-headline)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-[var(--font-size-footnote)] text-[var(--color-text-secondary)] mt-0.5">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

/**
 * Card Content Subcomponent
 */
export function CardContent({
    children,
    className = '',
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`${className}`} {...props}>
            {children}
        </div>
    );
}

/**
 * Card Footer Subcomponent
 */
export function CardFooter({
    children,
    className = '',
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export default Card;
