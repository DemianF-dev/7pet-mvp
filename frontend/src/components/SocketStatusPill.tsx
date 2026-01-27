import React, { useState } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import { socketManager } from '../services/socketManager';
import { Wifi, WifiOff, RefreshCw, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SocketStatusPill: React.FC = () => {
    const { status, transport, lastError, attempts, disabledUntil, socketId } = useSocketStore();
    const { user } = useAuthStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Only show pill for STAFF or MASTER roles (or in dev)
    const isStaff = user?.role && ['MASTER', 'ADMIN', 'GESTAO', 'OPERACIONAL', 'SPA', 'COMERCIAL'].includes(user.role);
    const shouldShow = isStaff || import.meta.env.DEV;

    if (!shouldShow) return null;

    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    label: 'Conectado',
                    icon: <Wifi className="w-3 h-3 text-green-500" />,
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/20'
                };
            case 'connecting':
                return {
                    label: 'Conectando...',
                    icon: <RefreshCw className="w-3 h-3 text-primary animate-spin" />,
                    bg: 'bg-primary/10',
                    border: 'border-primary/20'
                };
            case 'paused':
                return {
                    label: 'Pausado',
                    icon: <Info className="w-3 h-3 text-orange-500" />,
                    bg: 'bg-orange-500/10',
                    border: 'border-orange-500/20'
                };
            case 'error':
                return {
                    label: 'Offline',
                    icon: <WifiOff className="w-3 h-3 text-destructive" />,
                    bg: 'bg-destructive/10',
                    border: 'border-destructive/20'
                };
            default:
                return {
                    label: 'Desconectado',
                    icon: <WifiOff className="w-3 h-3 text-muted-foreground" />,
                    bg: 'bg-muted/10',
                    border: 'border-muted/20'
                };
        }
    };

    const config = getStatusConfig();
    const isDisabled = disabledUntil && disabledUntil > Date.now();

    return (
        <div className="fixed bottom-4 md:bottom-4 right-4 z-[var(--z-status-indicator)] md:z-[5]">
            <AnimatePresence>
                {!isExpanded ? (
                    <motion.button
                        layoutId="status-pill"
                        onClick={() => setIsExpanded(true)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg
                            ${config.bg} ${config.border} transition-colors
                        `}
                    >
                        {config.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-primary)] opacity-70">
                            Socket: {config.label}
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        layoutId="status-pill"
                        className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 w-72 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {config.icon}
                                <h3 className="text-sm font-bold uppercase tracking-tighter">Status do Servidor</h3>
                            </div>
                            <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-muted rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Estado:</span>
                                <span className="font-bold uppercase tracking-widest">{status}</span>
                            </div>

                            {socketId && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Session ID:</span>
                                    <span className="font-mono text-[10px] opacity-70 truncate max-w-[140px]">{socketId}</span>
                                </div>
                            )}

                            {transport && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground font-medium">Transporte:</span>
                                    <span className="font-bold opacity-80">{transport}</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="p-2 bg-destructive/10 rounded-lg border border-destructive/20 mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-3 h-3 text-destructive" />
                                        <span className="text-[10px] font-bold text-destructive uppercase">Erro de Conexão</span>
                                    </div>
                                    <p className="text-[11px] leading-tight opacity-80">{lastError || 'Falha ao conectar ao servidor'}</p>
                                    <div className="mt-1 flex justify-between text-[9px] opacity-60">
                                        <span>Tentativas: {attempts}</span>
                                        {isDisabled && (
                                            <span className="text-destructive font-black">Circuit Breaker ATIVO</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isDisabled && (
                                <p className="text-[10px] text-destructive bg-destructive/5 p-2 rounded border border-destructive/10 animate-pulse">
                                    Reconexão pausada. Tentaremos novamente em alguns minutos devido a falhas repetidas.
                                </p>
                            )}

                            <div className="pt-2 border-t border-border flex gap-2">
                                <button
                                    onClick={() => socketManager.resume()}
                                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all"
                                >
                                    Forçar Reconexão
                                </button>
                                {import.meta.env.DEV && (
                                    <button
                                        onClick={() => socketManager.disconnect('test')}
                                        className="px-2 bg-muted text-muted-foreground rounded-lg text-[11px] font-bold"
                                    >
                                        Parar
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocketStatusPill;
