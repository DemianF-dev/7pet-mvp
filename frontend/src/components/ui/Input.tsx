import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { FormField } from './FormField';

/**
 * Input Component
 * Apple-style text input with variants and states
 */

export type InputVariant = 'default' | 'filled' | 'glass';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: InputVariant;
    inputSize?: InputSize;
    label?: string;
    helperText?: string;
    error?: string;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
    default: 'bg-[var(--color-bg-surface)] border-[var(--color-border)] focus:border-[var(--color-accent-primary)]',
    filled: 'bg-[var(--color-fill-secondary)] border-transparent focus:bg-[var(--color-bg-surface)] focus:border-[var(--color-accent-primary)]',
    glass: 'glass-surface border-white/20 focus:border-white/40',
};

const sizeStyles: Record<InputSize, { input: string; icon: number }> = {
    sm: {
        input: 'px-3 py-2 text-[var(--font-size-footnote)] rounded-[var(--radius-md)] min-h-[var(--tap-target-min)]',
        icon: 16,
    },
    md: {
        input: 'px-4 py-2.5 text-[var(--font-size-body)] rounded-[var(--radius-lg)] min-h-[var(--tap-target-comfortable)]',
        icon: 18,
    },
    lg: {
        input: 'px-5 py-3 text-[var(--font-size-headline)] rounded-[var(--radius-xl)] min-h-[52px]',
        icon: 20,
    },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    variant = 'default',
    inputSize = 'md',
    label,
    helperText,
    error,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = true,
    className = '',
    disabled,
    id,
    required,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    const baseInputStyles = `
        w-full
        text-[var(--color-text-primary)]
        placeholder:text-[var(--color-text-tertiary)]
        border
        transition-all duration-[var(--duration-fast)]
        focus:outline-none focus:ring-4 focus:ring-[var(--color-accent-primary)]/10
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-fill-quaternary)]
    `;

    const errorStyles = error
        ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10'
        : '';

    const iconPadding = Icon
        ? iconPosition === 'left'
            ? 'pl-11'
            : 'pr-11'
        : '';

    return (
        <FormField
            label={label}
            description={helperText}
            error={error}
            id={inputId}
            required={required}
            className={fullWidth ? 'w-full' : 'inline-block'}
        >
            <div className="relative">
                {Icon && iconPosition === 'left' && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
                        <Icon size={sizeStyles[inputSize].icon} strokeWidth={2} />
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    className={`
                        ${baseInputStyles}
                        ${variantStyles[variant]}
                        ${sizeStyles[inputSize].input}
                        ${iconPadding}
                        ${errorStyles}
                        ${className}
                    `.replace(/\s+/g, ' ').trim()}
                    {...props}
                />
                {Icon && iconPosition === 'right' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
                        <Icon size={sizeStyles[inputSize].icon} strokeWidth={2} />
                    </div>
                )}
            </div>
        </FormField>
    );
});

Input.displayName = 'Input';

/**
 * TextArea Component
 */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    helperText?: string;
    error?: string;
    fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
    label,
    helperText,
    error,
    fullWidth = true,
    className = '',
    disabled,
    id,
    rows = 4,
    ...props
}, ref) => {
    const inputId = id || `textarea-${Math.random().toString(36).substring(7)}`;

    return (
        <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block mb-1.5 text-[var(--font-size-footnote)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]"
                >
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                id={inputId}
                rows={rows}
                disabled={disabled}
                className={`
                    w-full
                    px-4 py-3
                    text-[var(--font-size-body)]
                    bg-[var(--color-bg-surface)]
                    text-[var(--color-text-primary)]
                    placeholder:text-[var(--color-text-tertiary)]
                    border border-[var(--color-border)]
                    rounded-[var(--radius-lg)]
                    transition-all duration-[var(--duration-fast)]
                    focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-[3px] focus:ring-[var(--color-accent-primary)]/20
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-fill-quaternary)]
                    resize-none
                    ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20' : ''}
                    ${className}
                `.replace(/\s+/g, ' ').trim()}
                {...props}
            />
            {(helperText || error) && (
                <p
                    className={`mt-1.5 text-[var(--font-size-caption1)] ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'
                        }`}
                >
                    {error || helperText}
                </p>
            )}
        </div>
    );
});

TextArea.displayName = 'TextArea';

export default Input;
