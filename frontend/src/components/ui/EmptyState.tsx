import { LucideIcon } from 'lucide-react';
import { Button, ButtonProps } from './Button';

/**
 * EmptyState Component
 * Consistent pattern for missing data/empty lists.
 */

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
        props?: Partial<ButtonProps>;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-[var(--space-8)] animate-in fade-in zoom-in-95 duration-500 ${className}`}>
            <div className="w-20 h-20 rounded-3xl bg-[var(--color-fill-secondary)] flex items-center justify-center mb-6 text-[var(--color-text-tertiary)]">
                {Icon ? <Icon size={40} strokeWidth={1.5} /> : <div className="w-10 h-10 rounded-full border-4 border-dashed border-current opacity-20" />}
            </div>

            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-base text-[var(--color-text-secondary)] max-w-sm mb-8 leading-relaxed">
                    {description}
                </p>
            )}

            {action && (
                <Button
                    icon={action.icon}
                    onClick={action.onClick}
                    size="lg"
                    {...action.props}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

export default EmptyState;
