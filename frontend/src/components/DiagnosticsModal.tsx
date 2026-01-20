import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, Trash2, Terminal, Wifi, Cloud, Smartphone, Zap } from 'lucide-react';
import { useDiagnosticsStore } from '../store/diagnosticsStore';

interface DiagnosticsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
    const { logs, clearLogs } = useDiagnosticsStore();
    const [filter, setFilter] = useState<'all' | 'error' | 'request' | 'socket'>('all');

    const filteredLogs = logs.filter(log => filter === 'all' || log.type === filter);

    const getSWStatus = () => {
        if (!('serviceWorker' in navigator)) return 'No Support';
        return navigator.serviceWorker.controller ? 'Active (Controlled)' : 'Inactive';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-slate-900 rounded-[32px] shadow-2xl border border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3 text-white">
                                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Diagnósticos do Sistema</h3>
                                    <p className="text-xs text-slate-400 font-medium">Real-time mobile observability</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* System Stats Quick View */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-slate-950/50">
                            <StatBox icon={<Wifi size={14} />} label="Network" value={navigator.onLine ? 'Online' : 'Offline'} color={navigator.onLine ? 'text-green-400' : 'text-red-400'} />
                            <StatBox icon={<Cloud size={14} />} label="SW Status" value={getSWStatus()} color="text-indigo-400" />
                            <StatBox icon={<Smartphone size={14} />} label="Display" value={window.matchMedia('(display-mode: standalone)').matches ? 'PWA' : 'Browser'} color="text-amber-400" />
                            <StatBox icon={<Zap size={14} />} label="Logs" value={logs.length.toString()} color="text-primary" />
                        </div>

                        {/* Filters & Actions */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
                            <div className="flex gap-2">
                                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterBtn>
                                <FilterBtn active={filter === 'error'} onClick={() => setFilter('error')}>Errors</FilterBtn>
                                <FilterBtn active={filter === 'request'} onClick={() => setFilter('request')}>API</FilterBtn>
                            </div>
                            <button
                                onClick={clearLogs}
                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                title="Clear Logs"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Logs Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px]">
                            {filteredLogs.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-600 gap-2">
                                    <Terminal size={32} opacity={0.2} />
                                    <p>Nenhum log capturado</p>
                                </div>
                            ) : (
                                filteredLogs.map((log, idx) => (
                                    <div key={idx} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-black uppercase tracking-tighter ${log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'request' ? 'text-indigo-400' :
                                                        'text-slate-400'
                                                }`}>
                                                [{log.type}]
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-slate-300 break-words font-bold">
                                            {log.message}
                                        </div>
                                        {log.details && (
                                            <pre className="mt-2 p-2 bg-black/40 rounded text-slate-500 overflow-x-auto">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const StatBox = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
    <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/50">
        <div className="flex items-center gap-2 text-slate-500 mb-1">
            {icon}
            <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
        </div>
        <div className={`text-xs font-bold truncate ${color}`}>{value}</div>
    </div>
);

const FilterBtn = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
            }`}
    >
        {children}
    </button>
);

export default DiagnosticsModal;
