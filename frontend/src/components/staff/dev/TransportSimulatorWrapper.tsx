import React, { lazy, Suspense } from 'react';

// Lazy load the simulator to avoid bloating the main bundle
const TransportSimulator = lazy(() => import('./TransportSimulator'));

export const TransportSimulatorWrapper: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="p-8 bg-slate-800/10 rounded-[32px] border border-white/5 animate-pulse">
                <div className="h-64 flex items-center justify-center">
                    <div className="text-slate-400 font-mono">Carregando simulador...</div>
                </div>
            </div>
        }>
            <TransportSimulator />
        </Suspense>
    );
};
