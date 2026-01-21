/**
 * FullScreenError - Consistent error state with recovery options
 * Shows friendly error message with action buttons
 */

import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { normalizeError } from '../utils/errorNormalizer';

interface FullScreenErrorProps {
    error?: any;
    onRetry?: () => void;
    onGoHome?: () => void;
}

const FullScreenError: React.FC<FullScreenErrorProps> = ({
    error,
    onRetry,
    onGoHome
}) => {
    const normalized = error ? normalizeError(error) : {
        title: 'Erro Inesperado',
        message: 'Ocorreu um erro. Tente novamente.',
        severity: 'error' as const
    };

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    };

    const handleGoHome = () => {
        if (onGoHome) {
            onGoHome();
        } else {
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-destructive/5 px-4">
            <div className="max-w-md w-full text-center">
                {/* Error Icon */}
                <div className="mb-8 flex justify-center">
                    <div className={`
                        w-20 h-20 rounded-full flex items-center justify-center
                        ${normalized.severity === 'error' ? 'bg-destructive/10' : 'bg-warning/10'}
                    `}>
                        <AlertCircle
                            className={`w-10 h-10 ${normalized.severity === 'error' ? 'text-destructive' : 'text-warning'}`}
                            strokeWidth={2}
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-foreground mb-3">
                    {normalized.title}
                </h1>

                {/* Message */}
                <p className="text-base text-foreground/70 mb-8 leading-relaxed">
                    {normalized.message}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={handleRetry}
                        className="
                            flex items-center justify-center gap-2 px-6 py-3 
                            bg-primary text-primary-foreground rounded-xl
                            font-semibold hover:bg-primary/90 
                            transition-all active:scale-95
                            shadow-lg shadow-primary/20
                        "
                    >
                        <RefreshCw className="w-4 h-4" />
                        {normalized.action || 'Tentar Novamente'}
                    </button>

                    <button
                        onClick={handleGoHome}
                        className="
                            flex items-center justify-center gap-2 px-6 py-3 
                            bg-transparent border-2 border-primary text-primary rounded-xl
                            font-semibold hover:bg-primary/5
                            transition-all active:scale-95
                        "
                    >
                        <Home className="w-4 h-4" />
                        Ir para Início
                    </button>
                </div>

                {/* Support hint */}
                <p className="mt-8 text-sm text-foreground/40">
                    Se o problema persistir, entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
};

export default FullScreenError;
