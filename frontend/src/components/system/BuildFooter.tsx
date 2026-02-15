import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, ShieldCheck, GitCommit } from 'lucide-react';
import { Badge } from '../../components/ui';

export default function BuildFooter() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    // Fallback if env vars are missing
    const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString().split('T')[0];
    const commitHash = import.meta.env.VITE_COMMIT_HASH || 'dev';
    const envMode = import.meta.env.MODE;

    return (
        <div className="fixed bottom-2 right-2 z-50 flex items-center gap-2 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            {needRefresh && (
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="pointer-events-auto bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce"
                >
                    <RefreshCcw size={12} />
                    Nova versão disponível! Atualizar
                </button>
            )}

            <div className="bg-black/80 backdrop-blur-md text-white/80 px-2 py-1 rounded-md text-[9px] font-mono flex items-center gap-2 border border-white/10 shadow-sm pointer-events-auto">
                <span className="flex items-center gap-1">
                    <ShieldCheck size={10} className="text-green-400" />
                    {envMode.toUpperCase()}
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span className="flex items-center gap-1 text-blue-300">
                    <GitCommit size={10} />
                    {commitHash.slice(0, 7)}
                </span>
                {needRefresh ? null : (
                    <>
                        <span className="w-px h-3 bg-white/20" />
                        <span className="text-gray-400">{buildTime}</span>
                    </>
                )}
            </div>
        </div>
    );
}
