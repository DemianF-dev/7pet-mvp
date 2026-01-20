import React from 'react';

/**
 * Divider Component
 * Thin, low-opacity separator using tokens
 */

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: 'horizontal' | 'vertical';
    thickness?: number | string;
    label?: string;
}

export function Divider({
    orientation = 'horizontal',
    thickness = '1px',
    label,
    className = '',
    ...props
}: DividerProps) {
    if (orientation === 'vertical') {
        return (
            <div
                className={`w-[1px] self-stretch bg-[var(--color-border)] opacity-60 ${className}`}
                style={{ width: thickness }}
                {...props}
            />
        );
    }

    return (
        <div className={`relative w-full flex items-center ${className}`} {...props}>
            <div className="flex-grow h-[1px] bg-[var(--color-border)] opacity-60" style={{ height: thickness }} />
            {label && (
                <span className="px-3 text-[var(--font-size-caption2)] font-[var(--font-weight-semibold)] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {label}
                </span>
            )}
            {label && <div className="flex-grow h-[1px] bg-[var(--color-border)] opacity-60" style={{ height: thickness }} />}
        </div>
    );
}

export default Divider;
