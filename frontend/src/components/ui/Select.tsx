import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FormField } from './FormField';

/**
 * Select Component
 * Apple-style select using native picker for best mobile usability,
 * but styled to match the design system.
 */

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    options: SelectOption[];
    fullWidth?: boolean;
}

export function Select({
    label,
    helperText,
    error,
    options,
    fullWidth = true,
    className = '',
    id,
    required,
    ...props
}: SelectProps) {
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;

    return (
        <FormField
            label={label}
            description={helperText}
            error={error}
            id={selectId}
            required={required}
            className={fullWidth ? 'w-full' : 'inline-block'}
        >
            <div className="relative group">
                <select
                    id={selectId}
                    className={`
                        w-full appearance-none
                        bg-[var(--color-bg-surface)]
                        text-[var(--color-text-primary)]
                        border border-[var(--color-border)]
                        rounded-[var(--radius-lg)]
                        px-4 py-2.5 pr-10
                        text-[var(--font-size-body)]
                        transition-all duration-[var(--duration-fast)]
                        focus:outline-none focus:ring-4 focus:ring-[var(--color-accent-primary)]/10
                        focus:border-[var(--color-accent-primary)]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10' : ''}
                        ${className}
                    `.replace(/\s+/g, ' ').trim()}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent-primary)] transition-colors">
                    <ChevronDown size={18} strokeWidth={2} />
                </div>
            </div>
        </FormField>
    );
}

export default Select;
