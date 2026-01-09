import React from 'react';

/**
 * GlassSurface Component
 * Apple-style glassmorphism wrapper with Liquid Glass effect
 */

export type GlassIntensity = 'light' | 'medium' | 'heavy';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: GlassIntensity;
    elevated?: boolean;
    children: React.ReactNode;
}

const intensityStyles: Record<GlassIntensity, string> = {
    light: `
        backdrop-blur-[10px]
        bg-[var(--glass-bg)]/50
    `,
    medium: `
        backdrop-blur-[20px]
        bg-[var(--glass-bg)]
    `,
    heavy: `
        backdrop-blur-[40px]
        bg-[var(--glass-bg-elevated)]
    `,
};

export function GlassSurface({
    intensity = 'medium',
    elevated = false,
    children,
    className = '',
    ...props
}: GlassSurfaceProps) {
    const elevatedStyles = elevated
        ? 'shadow-[var(--shadow-xl)]'
        : 'shadow-[var(--glass-shadow)]';

    return (
        <div
            className={`
                rounded-[var(--radius-xl)]
                border border-[var(--glass-border)]
                ${intensityStyles[intensity]}
                ${elevatedStyles}
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            style={{
                WebkitBackdropFilter: `blur(${intensity === 'heavy' ? '40px' : intensity === 'medium' ? '20px' : '10px'}) saturate(180%)`,
                backdropFilter: `blur(${intensity === 'heavy' ? '40px' : intensity === 'medium' ? '20px' : '10px'}) saturate(180%)`,
            }}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * GlassModal - Specialized glass surface for modals/popovers
 */
export function GlassModal({
    children,
    className = '',
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`
                rounded-[var(--radius-2xl)]
                border border-[var(--glass-border)]
                bg-[var(--glass-bg-elevated)]
                backdrop-blur-[40px]
                shadow-[var(--shadow-xl)]
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            style={{
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                backdropFilter: 'blur(40px) saturate(180%)',
            }}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * GlassToolbar - Specialized glass surface for toolbars
 */
export function GlassToolbar({
    children,
    className = '',
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`
                px-4 py-2
                border-b border-[var(--glass-border)]
                bg-[var(--glass-bg)]
                backdrop-blur-[20px]
                ${className}
            `.replace(/\s+/g, ' ').trim()}
            style={{
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                backdropFilter: 'blur(20px) saturate(180%)',
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export default GlassSurface;
