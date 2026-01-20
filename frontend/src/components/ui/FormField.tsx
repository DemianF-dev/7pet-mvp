import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField Wrapper
 * Standardizes label, error, and helper text display for any input control.
 */

export interface FormFieldProps {
    label?: string;
    description?: string;
    error?: string;
    id?: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
}

export function FormField({
    label,
    description,
    error,
    id,
    children,
    className = '',
    required = false
}: FormFieldProps) {
    return (
        <div className={`space-y-1.5 w-full ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="flex text-[var(--font-size-footnote)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] px-1"
                >
                    {label}
                    {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                {children}
            </div>

            {(description || error) && (
                <div className="flex items-start gap-1 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {error ? (
                        <>
                            <AlertCircle size={12} className="text-[var(--color-error)] mt-0.5 shrink-0" />
                            <p className="text-[var(--font-size-caption1)] text-[var(--color-error)] font-medium leading-tight">
                                {error}
                            </p>
                        </>
                    ) : (
                        <p className="text-[var(--font-size-caption1)] text-[var(--color-text-tertiary)] leading-tight">
                            {description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default FormField;
