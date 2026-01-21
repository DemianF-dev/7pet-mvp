/**
 * FullScreenLoading - Consistent loading state
 * Never shows blank screen - always has visual feedback
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface FullScreenLoadingProps {
    message?: string;
}

const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ message = 'Carregando...' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5">
            <div className="text-center px-4">
                {/* Logo/Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl">🐾</span>
                    </div>
                </div>

                {/* Spinner */}
                <div className="mb-6 flex justify-center">
                    <Loader2
                        className="w-12 h-12 text-primary animate-spin"
                        strokeWidth={2.5}
                    />
                </div>

                {/* Message */}
                <p className="text-lg font-medium text-foreground/80 mb-2">
                    {message}
                </p>

                {/* Subtle hint */}
                <p className="text-sm text-foreground/40">
                    Aguarde um momento...
                </p>
            </div>
        </div>
    );
};

export default FullScreenLoading;
