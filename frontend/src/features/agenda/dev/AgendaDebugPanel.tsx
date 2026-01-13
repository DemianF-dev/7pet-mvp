
import React, { useState, useEffect } from 'react';
import { X, Activity, Server, Clock, Database, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgendaDebugPanelProps {
    module: 'SPA' | 'LOG';
    vm: {
        appointments: any[];
        view: string;
        selectedDate: Date;
        isLoading: boolean;
        searchTerm: string;
        selectedPerformerId: string;
        lastFetch: { timestamp: number; durationMs: number; error?: string } | null;
        selectedIds: string[];
        filteredCount: number; // Added this
    };
}

export default function AgendaDebugPanel({ module, vm }: AgendaDebugPanelProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Early return for Production
    if (!import.meta.env.DEV && !import.meta.env.VITE_AGENDA_DEBUG) return null;

    useEffect(() => {
        // Load initial state
        const savedState = localStorage.getItem('agenda_debug_enabled') === '1';
        if (import.meta.env.VITE_AGENDA_DEBUG) {
            setIsVisible(true);
        } else {
            setIsVisible(savedState);
        }

        // Keyboard Shortcut: Ctrl + Shift + D (Win/Linux) or Cmd + Shift + D (Mac)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setIsVisible(prev => {
                    const newState = !prev;
                    localStorage.setItem('agenda_debug_enabled', newState ? '1' : '0');
                    return newState;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`fixed z-[9999] bg-black/80 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] shadow-2xl rounded-tr-lg overflow-hidden transition-all duration-300 ${isCollapsed ? 'bottom-0 left-0 w-auto rounded-none' : 'bottom-[90px] left-4 md:right-4 md:left-auto w-[280px] rounded-xl'
                    }`}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5 cursor-pointer hover:bg-white/10"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2 font-bold text-xs">
                        <Activity size={12} className="text-green-400" />
                        AGENDA DEBUG <span className="text-[var(--color-accent-primary)] opacity-80">[{module}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="text-white/50 hover:text-white px-1">{isCollapsed ? 'EXPAND' : 'MINIMIZE'}</button>
                    </div>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 p-2 rounded">
                                <span className="block text-white/40 mb-1 flex items-center gap-1"><Eye size={10} /> View</span>
                                <span className="font-bold text-green-300">{vm.view}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded">
                                <span className="block text-white/40 mb-1 flex items-center gap-1" title="Indica se há uma requisição à API em curso">
                                    <Clock size={10} /> Loading
                                </span>
                                <span className={`font-bold ${vm.isLoading ? 'text-yellow-400' : 'text-gray-400'}`}>
                                    {vm.isLoading ? 'TRUE' : 'IDLE'}
                                </span>
                            </div>
                        </div>

                        {/* Date Info */}
                        <div className="space-y-1 border-t border-white/10 pt-2">
                            <div className="flex justify-between">
                                <span className="text-white/40">Selected Date:</span>
                                <span className="text-blue-300">{vm.selectedDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Team Filter:</span>
                                <span className="text-orange-300">{vm.selectedPerformerId}</span>
                            </div>
                            {vm.searchTerm && (
                                <div className="flex justify-between">
                                    <span className="text-white/40">Search:</span>
                                    <span className="text-yellow-300">"{vm.searchTerm}"</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-white/40">Selected Items:</span>
                                <span className="text-purple-300">{vm.selectedIds.length}</span>
                            </div>
                        </div>

                        {/* Data Stats */}
                        <div className="bg-black/30 p-2 rounded border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/60 uppercase tracking-widest border-b border-white/5 pb-1">
                                <Database size={10} /> Data Metrics
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-white/40">Filtered (Search/Team):</span>
                                    <span className="font-bold text-blue-300">{vm.filteredCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/40">Total Buffer (API):</span>
                                    <span className="font-bold">{vm.appointments.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Network Stats */}
                        <div className="bg-black/30 p-2 rounded border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-white/60 uppercase tracking-widest border-b border-white/5 pb-1">
                                <Server size={10} /> Last Request
                            </div>
                            {vm.lastFetch ? (
                                <>
                                    <div className="flex justify-between">
                                        <span>Time:</span>
                                        <span>{new Date(vm.lastFetch.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Duration:</span>
                                        <span className={`${vm.lastFetch.durationMs > 500 ? 'text-red-400' : 'text-green-400'}`}>
                                            {vm.lastFetch.durationMs.toFixed(0)} ms
                                        </span>
                                    </div>
                                    {vm.lastFetch.error && (
                                        <div className="mt-1 text-red-500 bg-red-900/20 p-1 rounded break-all">
                                            ERR: {vm.lastFetch.error}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="text-white/20 italic">No request recorded</span>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
