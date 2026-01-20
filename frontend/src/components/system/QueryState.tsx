/**
 * QueryState - Consistent query state management wrapper
 * 
 * Provides unified handling of loading, error, and empty states.
 * Use this to wrap TanStack Query results for consistent UX.
 * 
 * Example:
 * ```tsx
 * <QueryState
 *   isLoading={query.isLoading}
 *   error={query.error}
 *   onRetry={() => query.refetch()}
 *   skeleton={<CustomSkeleton />}
 *   isEmpty={data?.length === 0}
 *   emptyState={<EmptyMessage />}
 * >
 *   {children}
 * </QueryState>
 * ```
 */

import { ReactNode } from 'react';
import RouteSkeleton from './RouteSkeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
export interface QueryStateProps {
    isLoading: boolean;
    error?: any;
    onRetry?: () => void;
    skeleton?: ReactNode;
    emptyState?: ReactNode;
    isEmpty?: boolean;
    children: ReactNode;
    loadingMessage?: string;
    errorTitle?: string;
    errorMessage?: string;
    className?: string;
}

export default function QueryState({
    isLoading,
    error,
    onRetry,
    skeleton,
    emptyState,
    isEmpty = false,
    children,
    loadingMessage = 'Carregando...',
    errorTitle = 'Erro ao carregar dados',
    errorMessage,
    className = ''
}: QueryStateProps) {
    // Loading State
    if (isLoading) {
        if (skeleton) {
            return <>{skeleton}</>;
        }
        return <RouteSkeleton />;
    }

    // Error State
    if (error) {
        const displayMessage = errorMessage || error.message || 'Ocorreu um erro inesperado';

        return (
            <div className={`min-h-[400px] flex items-center justify-center p-[var(--space-8)] ${className}`}>
                <div className="max-w-md w-full text-center">
                    {/* Error Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--color-error)]/10 mb-6 text-[var(--color-error)]">
                        <AlertCircle size={40} strokeWidth={1.5} />
                    </div>

                    {/* Error Title */}
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                        {errorTitle}
                    </h3>

                    {/* Error Message */}
                    <p className="text-base text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                        {displayMessage}
                    </p>

                    {/* Retry Button */}
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center gap-2 px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--color-accent-primary)] text-white font-[var(--font-weight-black)] text-[var(--font-size-sm)] uppercase tracking-wider hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--color-accent-primary)]/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                    )}

                    {/* Fallback link */}
                    {!onRetry && (
                        <button
                            onClick={() => window.location.reload()}
                            className="text-[var(--font-size-sm)] text-[var(--color-accent-primary)] font-[var(--font-weight-bold)] hover:underline"
                        >
                            Recarregar página
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Empty State
    if (isEmpty && emptyState) {
        return <div className={className}>{emptyState}</div>;
    }

    // Success State - render children
    return <div className={className}>{children}</div>;
}
