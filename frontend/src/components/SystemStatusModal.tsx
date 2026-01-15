import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Cpu, Globe, Hash, Clock, ShieldCheck } from 'lucide-react';
import { SYSTEM_INFO } from '../constants/version';
import axios from 'axios';

interface SystemStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SystemStatusModal({ isOpen, onClose }: SystemStatusModalProps) {
    const [backendStatus, setBackendStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBackendStatus();
        }
    }, [isOpen]);

    const fetchBackendStatus = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const { data } = await axios.get(`${apiUrl}/health`);
            setBackendStatus(data);
        } catch (error) {
            console.error('Failed to fetch backend status', error);
            setBackendStatus({ error: true });
        } finally {
            setLoading(false);
        }
    };

    const isSynced = backendStatus && !backendStatus.error && backendStatus.version === SYSTEM_INFO.version;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[var(--color-bg-surface)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-border)]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-[var(--color-accent-primary)]/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center text-[var(--color-accent-primary)]">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Status do Sistema</h3>
                                    <p className="text-xs text-[var(--color-text-secondary)]">Diagnóstico de integridade</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-[var(--color-bg-primary)] transition-colors text-[var(--color-text-tertiary)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Sync Status */}
                            <div className={`p-4 rounded-2xl flex items-center gap-4 border ${isSynced
                                    ? 'bg-green-500/5 border-green-500/20 text-green-600'
                                    : backendStatus?.error
                                        ? 'bg-red-500/5 border-red-500/20 text-red-600'
                                        : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                                }`}>
                                {isSynced ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                                <div className="flex-1">
                                    <p className="text-sm font-bold">
                                        {isSynced ? 'Sistemas Sincronizados' : backendStatus?.error ? 'Falha na Conexão' : 'Versões Divergentes'}
                                    </p>
                                    <p className="text-[10px] opacity-80">
                                        {isSynced
                                            ? 'O Frontend e Backend estão rodando a mesma build.'
                                            : backendStatus?.error
                                                ? 'Não foi possível verificar a versão do servidor.'
                                                : `FE: ${SYSTEM_INFO.version} | BE: ${backendStatus?.version || 'N/A'}`}
                                    </p>
                                </div>
                                {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <div className="p-3 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-1">
                                    <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] font-medium text-[10px] uppercase tracking-wider">
                                        <Globe size={12} /> Stage
                                    </div>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{SYSTEM_INFO.stage}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-1">
                                    <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] font-medium text-[10px] uppercase tracking-wider">
                                        <Hash size={12} /> Build
                                    </div>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">#{SYSTEM_INFO.buildNumber}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-[var(--color-bg-primary)] transition-colors group">
                                    <div className="p-2 rounded-lg bg-[var(--color-bg-primary)] group-hover:bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                                        <Cpu size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Git Commit</p>
                                        <p className="text-xs font-mono text-[var(--color-accent-primary)] truncate">{SYSTEM_INFO.commit}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-[var(--color-bg-primary)] transition-colors group">
                                    <div className="p-2 rounded-lg bg-[var(--color-bg-primary)] group-hover:bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-tertiary)]">
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Gerado em</p>
                                        <p className="text-xs font-medium text-[var(--color-text-primary)]">
                                            {new Date(SYSTEM_INFO.timestamp).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {SYSTEM_INFO.releaseNotes && (
                                <div className="mt-4">
                                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider px-3 mb-2">Notas da Versão</p>
                                    <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs leading-relaxed italic">
                                        "{SYSTEM_INFO.releaseNotes}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] text-center">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
                            >
                                Fechar Diagnóstico
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
