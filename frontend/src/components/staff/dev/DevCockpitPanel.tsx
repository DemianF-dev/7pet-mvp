import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Terminal,
    Database,
    ShieldAlert,
    Copy,
    ExternalLink,
    RotateCcw,
    Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useDevCockpitStore } from '../../../store/devCockpitStore';
import { useEffect } from 'react';
import { buildSystemReport } from '../../../utils/systemReport';
import { DangerousActionModal } from '../../security/DangerousActionModal';
import { TransportSimulatorWrapper } from './TransportSimulatorWrapper';

export const DevCockpitPanel: React.FC = () => {
    const { user } = useAuthStore();
    const cockpitStore = useDevCockpitStore();
    const [dangerousAction, setDangerousAction] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    const toggleDebug = () => {
        const current = localStorage.getItem('agenda_debug_enabled') === '1';
        if (current) {
            localStorage.setItem('agenda_debug_enabled', '0');
            toast.success('Debug Panel DESATIVADO. Recarregue a página.');
        } else {
            localStorage.setItem('agenda_debug_enabled', '1');
            toast.success('Debug Panel ATIVADO. Recarregue a página.');
        }
        window.location.reload();
    };

    const toggleOverflowDebug = () => {
        const isActive = document.body.classList.contains('debug-overflow');
        if (isActive) {
            document.body.classList.remove('debug-overflow');
            localStorage.setItem('debug_overflow_active', '0');
            toast.success('Audit Mode: OFF');
        } else {
            document.body.classList.add('debug-overflow');
            localStorage.setItem('debug_overflow_active', '1');
            toast.success('Audit Mode: ON (Red items = layout; Orange = fixed width)');
        }
    };

    useEffect(() => {
        if (localStorage.getItem('debug_overflow_active') === '1') {
            document.body.classList.add('debug-overflow');
        }
    }, []);

    const handleCopyReport = async () => {
        try {
            const report = await buildSystemReport();
            await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
            toast.success('System Report copiado para o clipboard!');
        } catch (error) {
            toast.error('Erro ao gerar relatório');
        }
    };

    const isLocal = import.meta.env.DEV || window.location.hostname.includes('localhost');

    return (
        <div className="space-y-8 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/95 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden w-full"
            >
                {/* Header: More Spaced and Modern */}
                <div className="p-8 md:p-12 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950/40">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-green-500/10 rounded-[28px] shadow-inner text-green-400 border border-green-500/20">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-3xl text-white tracking-tight">Developer Cockpit</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] font-bold">
                                    Master Session: {cockpitStore.unlockedAt ? new Date(cockpitStore.unlockedAt).toLocaleTimeString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="px-5 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-full tracking-widest border border-red-500/20">
                            System Unlocked
                        </span>
                        <div className="hidden lg:block h-10 w-px bg-white/10 mx-2" />
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 font-bold">
                            v1.2.0 • {user?.division}
                        </div>
                    </div>
                </div>

                {/* Main Content: Optimized Grid for large screens */}
                <div className="p-8 md:p-12 space-y-16">

                    {/* Top Section: Client & Diagnostics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-5 gap-10">

                        {/* 1. Client Debugging Section - Spans 3 columns on ultra-wide */}
                        <section className="space-y-6 2xl:col-span-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                                    <Terminal size={18} />
                                </div>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em]">Client Interface Tools</h4>
                            </div>

                            <div className="group relative bg-slate-800/20 hover:bg-slate-800/30 border border-white/5 rounded-[32px] p-8 md:p-10 transition-all duration-300">
                                <div className="flex flex-col xl:flex-row items-start justify-between gap-10">
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold text-2xl mb-4">Agenda Debug Panel</h4>
                                        <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-2xl">
                                            Habilita o monitoramento em tempo real de performance, filtros e estado global das agendas (SPA/LOG).
                                            Exibe métricas críticas diretamente na interface do usuário.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 bg-black/40 w-fit px-5 py-3 rounded-2xl border border-white/5 shadow-xl">
                                            <span className="opacity-50 font-bold uppercase tracking-widest">Shortcut:</span>
                                            <div className="flex gap-2">
                                                <kbd className="bg-slate-700/50 text-white px-2.5 py-1 rounded-lg shadow-sm border border-white/10 font-bold">CTRL</kbd>
                                                <span className="opacity-30 self-center font-bold text-lg">+</span>
                                                <kbd className="bg-slate-700/50 text-white px-2.5 py-1 rounded-lg shadow-sm border border-white/10 font-bold">SHIFT</kbd>
                                                <span className="opacity-30 self-center font-bold text-lg">+</span>
                                                <kbd className="bg-slate-700/50 text-white px-2.5 py-1 rounded-lg shadow-sm border border-white/10 font-bold">D</kbd>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center xl:items-end gap-6 shrink-0 bg-slate-950/30 p-8 rounded-[36px] border border-white/5 min-w-[160px] shadow-2xl">
                                        <button
                                            type="button"
                                            onClick={toggleDebug}
                                            className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all focus:outline-none ring-offset-slate-900 focus:ring-2 focus:ring-green-500 shadow-inner ${localStorage.getItem('agenda_debug_enabled') === '1' ? 'bg-green-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-9 w-9 transform rounded-full bg-white shadow-2xl transition-transform duration-300 ${localStorage.getItem('agenda_debug_enabled') === '1' ? 'translate-x-10' : 'translate-x-1'}`} />
                                        </button>
                                        <span className={`text-xs font-black uppercase tracking-[0.25em] ${localStorage.getItem('agenda_debug_enabled') === '1' ? 'text-green-400' : 'text-slate-500'}`}>
                                            Agendas {localStorage.getItem('agenda_debug_enabled') === '1' ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-center xl:items-end gap-6 shrink-0 bg-slate-950/30 p-8 rounded-[36px] border border-white/5 min-w-[160px] shadow-2xl">
                                        <button
                                            type="button"
                                            onClick={toggleOverflowDebug}
                                            className={`relative inline-flex h-11 w-20 items-center rounded-full transition-all focus:outline-none ring-offset-slate-900 focus:ring-2 focus:ring-orange-500 shadow-inner ${localStorage.getItem('debug_overflow_active') === '1' ? 'bg-orange-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-9 w-9 transform rounded-full bg-white shadow-2xl transition-transform duration-300 ${localStorage.getItem('debug_overflow_active') === '1' ? 'translate-x-10' : 'translate-x-1'}`} />
                                        </button>
                                        <span className={`text-xs font-black uppercase tracking-[0.25em] ${localStorage.getItem('debug_overflow_active') === '1' ? 'text-orange-400' : 'text-slate-500'}`}>
                                            Overflow {localStorage.getItem('debug_overflow_active') === '1' ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Diagnostics Section - Spans 2 columns on ultra-wide */}
                        <section className="space-y-6 2xl:col-span-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                                    <Database size={18} />
                                </div>
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.3em]">Diagnostics & Data</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <button
                                    type="button"
                                    onClick={handleCopyReport}
                                    className="flex flex-col gap-6 p-8 bg-slate-800/10 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 rounded-[36px] transition-all duration-500 group text-left shadow-lg"
                                >
                                    <div className="p-5 bg-slate-800 rounded-2xl w-fit group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all group-hover:scale-110 shadow-2xl border border-white/5">
                                        <Copy size={28} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-xl">System Report</p>
                                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2 group-hover:text-slate-300 transition-colors">JSON Diagnostic</p>
                                    </div>
                                </button>

                                {isLocal && (
                                    <a
                                        href="/dashboard.html"
                                        target="_blank"
                                        className="flex flex-col gap-6 p-8 bg-indigo-900/10 hover:bg-indigo-500/10 border border-indigo-500/10 hover:border-indigo-500/30 rounded-[36px] transition-all duration-500 group text-left shadow-lg"
                                    >
                                        <div className="p-5 bg-slate-800 rounded-2xl w-fit group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all group-hover:scale-110 shadow-2xl text-indigo-500 border border-white/5">
                                            <ExternalLink size={28} />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-xl">Tech Hub</p>
                                            <p className="text-indigo-400/60 text-[11px] font-bold uppercase tracking-widest mt-2 group-hover:text-indigo-300 transition-colors">Real-time Debug</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Transport Simulator Section */}
                    <section className="space-y-6 pt-8 border-t border-white/5">
                        <TransportSimulatorWrapper />
                    </section>

                    {/* Bottom Row: Critical Operations */}
                    <section className="space-y-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-950/20 rounded-xl text-red-500/60">
                                <ShieldAlert size={18} />
                            </div>
                            <h4 className="text-red-500 font-black text-xs uppercase tracking-[0.3em]">Critical Core Operations</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            <div className="p-10 bg-red-950/10 border border-red-500/15 rounded-[40px] relative overflow-hidden group shadow-2xl">
                                <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#ef4444_1.5px,transparent:1.5px)] [background-size:24px_24px]" />

                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h5 className="text-white font-extrabold text-2xl">Maintenance Mode</h5>
                                            <p className="text-slate-400 text-base mt-2 leading-relaxed opacity-80">
                                                Interrompe o acesso imediato de todos os usuários ao cluster de produção.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setDangerousAction({
                                            open: true,
                                            title: 'Ativar Manutenção Global',
                                            description: 'Isso impedirá o acesso de todos os colaboradores e clientes ao sistema em tempo real. Apenas usuários MASTER poderão logar.',
                                            onConfirm: () => {
                                                toast.error('Endpoint de manutenção não disponível no momento.');
                                            }
                                        })}
                                        className="w-full py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[11px] font-black uppercase rounded-[24px] border border-red-500/40 transition-all shadow-xl hover:shadow-red-600/50 tracking-[0.2em]"
                                    >
                                        Activate Global Lock
                                    </button>

                                    <div className="flex items-center gap-3 text-[10px] text-red-500/70 font-black uppercase tracking-widest bg-red-500/10 w-fit px-4 py-2 rounded-xl border border-red-500/20 shadow-lg">
                                        <Lock size={14} />
                                        <span>Triple Confirmation Required</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-800/10 hover:bg-slate-800/30 border border-white/5 rounded-[40px] flex flex-col justify-between gap-10 group transition-all shadow-xl">
                                <div>
                                    <h5 className="text-white font-extrabold text-2xl">Global Logout</h5>
                                    <p className="text-slate-400 text-base mt-2 leading-relaxed">Invalida todas as sessões ativas (JWT Flush).</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toast.error('Funcionalidade em desenvolvimento')}
                                    className="w-20 h-20 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-[28px] transition-all border border-red-500/20 group-hover:scale-105 shadow-2xl"
                                >
                                    <RotateCcw size={32} />
                                </button>
                            </div>

                            <div className="p-10 bg-slate-800/10 hover:bg-slate-800/30 border border-white/5 rounded-[40px] flex flex-col justify-between gap-10 group transition-all shadow-xl">
                                <div>
                                    <h5 className="text-white font-extrabold text-2xl">Reset App State</h5>
                                    <p className="text-slate-400 text-base mt-2 leading-relaxed">Limpa dados locais e força reload crítico do app.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.clear();
                                        toast.success('Soft reset executed successfully.');
                                        setTimeout(() => window.location.reload(), 1500);
                                    }}
                                    className="w-20 h-20 flex items-center justify-center bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-[28px] transition-all border border-orange-500/20 group-hover:scale-105 shadow-2xl"
                                >
                                    <RotateCcw size={32} />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Section: Technical Meta */}
                <div className="p-10 md:p-12 bg-black/60 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                    <div className="flex flex-wrap items-center gap-12">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite] shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs font-mono text-slate-400 font-black uppercase tracking-[0.25em]">Cluster Operational</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] border-l border-white/10 pl-10 h-5 flex items-center hidden lg:flex font-bold">
                            Region: {isLocal ? 'DEV_SA_EAST' : 'EDGE_AZURE_BR'}
                        </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 font-black uppercase tracking-[0.5em] opacity-40">
                        Shield-L4-Active
                    </div>
                </div>
            </motion.div>

            <DangerousActionModal
                isOpen={dangerousAction.open}
                onClose={() => setDangerousAction(prev => ({ ...prev, open: false }))}
                onConfirm={dangerousAction.onConfirm}
                title={dangerousAction.title}
                description={dangerousAction.description}
            />
        </div>
    );
};
