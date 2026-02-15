import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Haptics } from '../../utils/haptics';

/**
 * FormField Wrapper
 * Standardizes label, error, and helper text display for any input control.
 * Supports multiple statuses, animations, and premium layout options.
 */

export type FormFieldStatus = 'default' | 'error' | 'success' | 'warning' | 'info';

export interface FormFieldProps {
    label?: string;
    description?: string;
    error?: string;
    id?: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
    status?: FormFieldStatus;
    info?: string;
    rightLabel?: React.ReactNode;
}

export function FormField({
    label,
    description,
    error,
    id,
    children,
    className = '',
    required = false,
    status = 'default',
    info,
    rightLabel
}: FormFieldProps) {
    // Current active status logic
    const currentStatus: FormFieldStatus = error ? 'error' : status;
    const message = error || description;

    const statusConfig = {
        default: {
            color: 'text-[var(--color-text-tertiary)]',
            icon: null
        },
        error: {
            color: 'text-[var(--color-error)]',
            icon: <AlertCircle size={12} className="mt-0.5 shrink-0" />
        },
        success: {
            color: 'text-[var(--color-success)]',
            icon: <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
        },
        warning: {
            color: 'text-[var(--color-warning)]',
            icon: <AlertTriangle size={12} className="mt-0.5 shrink-0" />
        },
        info: {
            color: 'text-[var(--color-accent-primary)]',
            icon: <Info size={12} className="mt-0.5 shrink-0" />
        }
    };

    const config = statusConfig[currentStatus];

    // Tactical feedback on error/warning
    React.useEffect(() => {
        if (error) {
            Haptics.error();
        } else if (status === 'warning') {
            Haptics.warning();
        }
    }, [error, status]);

    return (
        <div className={cn("space-y-1.5 w-full group", className)}>
            {(label || rightLabel) && (
                <div className="flex items-center justify-between px-1">
                    {label && (
                        <label
                            htmlFor={id}
                            className="flex items-center gap-1.5 text-[var(--font-size-footnote)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] transition-colors group-focus-within:text-[var(--color-text-primary)]"
                        >
                            {label}
                            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
                            {info && (
                                <span title={info} className="cursor-help">
                                    <Info size={12} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors" />
                                </span>
                            )}
                        </label>
                    )}
                    {rightLabel && (
                        <div className="text-[var(--font-size-caption1)] text-[var(--color-text-tertiary)] font-medium">
                            {rightLabel}
                        </div>
                    )}
                </div>
            )}

            <div className="relative">
                {children}
            </div>

            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        key={`${currentStatus}-${message}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                        className={cn("flex items-start gap-1 px-1", config.color)}
                    >
                        {config.icon}
                        <p className="text-[var(--font-size-caption1)] font-medium leading-tight">
                            {message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default FormField;
