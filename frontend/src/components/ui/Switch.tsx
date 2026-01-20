import React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

/**
 * Switch Toggle Component
 * Stylized iOS-like toggle using Radix Primitives for accessibility.
 * Note: If Radix is not available, we fallback to a native-like implementation.
 */

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
    label?: string;
}

export function Switch({ className = '', label, ...props }: SwitchProps) {
    return (
        <div className="flex items-center gap-3">
            <SwitchPrimitives.Root
                className={`
                    peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
                    border-2 border-transparent transition-colors 
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]/40 
                    disabled:cursor-not-allowed disabled:opacity-50 
                    data-[state=checked]:bg-[var(--color-accent-primary)] 
                    data-[state=unchecked]:bg-[var(--color-fill-secondary)]
                    ${className}
                `.trim()}
                {...props}
            >
                <SwitchPrimitives.Thumb
                    className={`
                        pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 
                        transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
                    `}
                />
            </SwitchPrimitives.Root>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--color-text-primary)]">
                    {label}
                </label>
            )}
        </div>
    );
}

export default Switch;
