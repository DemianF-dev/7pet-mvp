
import React, { useEffect, useState } from 'react';
import api from '../../../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Clock,
    User,
    AlertCircle,
    CheckCircle2,
    Info,
    ArrowLeft,
    FileText,
    CreditCard,
    Settings,
    RotateCcw,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../../../store/authStore';
import RevertModal from '../../../../components/modals/RevertModal';

interface AuditEvent {
    id: string;
    createdAt: string;
    actorUserId: string;
    actorNameSnapshot: string;
    action: string;
    summary: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    diff: any;
    meta: any;
    revertible: boolean;
    revertedAt: string | null;
}

interface Props {
    clientId: string;
}

const CustomerHistory: React.FC<Props> = ({ clientId }) => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
    const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const resp = await api.get(`/audit/clients/${clientId}/audit`);
            // The existing endpoint might return { data: [...] } or just [...]
            setEvents(Array.isArray(resp.data) ? resp.data : (resp.data.data || []));
        } catch (err) {
            console.error('Error fetching customer history:', err);
            setError('Falha ao carregar o histórico.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) fetchHistory();
    }, [clientId]);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedEvents);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedEvents(next);
    };

    const getIcon = (action: string, severity: string) => {
        if (severity === 'CRITICAL') return <AlertCircle className="w-5 h-5 text-red-500" />;
        if (severity === 'WARNING') return <AlertCircle className="w-5 h-5 text-amber-500" />;

        if (action.includes('AUTH') || action.includes('USER')) return <User className="w-5 h-5 text-blue-500" />;
        if (action.includes('INVOICE') || action.includes('BILLING')) return <FileText className="w-5 h-5 text-zinc-500" />;
        if (action.includes('CREDIT') || action.includes('LEDGER')) return <CreditCard className="w-5 h-5 text-emerald-500" />;
        if (action.includes('CONFIG') || action.includes('SYSTEM')) return <Settings className="w-5 h-5 text-indigo-500" />;

        return <Info className="w-5 h-5 text-zinc-400" />;
    };

    if (loading) return <div className="p-8 text-center text-zinc-500 font-bold animate-pulse">Carregando trilha de auditoria...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (events.length === 0) return (
        <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800">
            <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <div className="text-zinc-400 font-medium">Nenhum evento registrado para este cliente.</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Histórico de Alterações</h3>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Trilha de Auditoria Compliance</p>
                    </div>
                </div>
            </div>

            <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 space-y-8 pb-4">
                {events.map((event) => (
                    <div key={event.id} className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300">
                        {/* Dot */}
                        <div className="absolute -left-[11px] top-1 bg-white dark:bg-zinc-950 rounded-full p-1 z-10 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            {getIcon(event.action, event.severity)}
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {event.summary}
                                    </span>
                                    {event.revertedAt && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold rounded uppercase tracking-tighter">
                                            <RotateCcw className="w-2.5 h-2.5" /> Revertido
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded">
                                    {format(new Date(event.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                <span className="flex items-center gap-1 font-bold italic">
                                    <User className="w-3 h-3" /> {event.actorNameSnapshot || 'Sistema'}
                                </span>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-bold uppercase tracking-tighter">
                                    {event.action}
                                </span>
                            </div>

                            {/* Buttons Area */}
                            <div className="flex items-center gap-3 mt-2">
                                {event.diff && (
                                    <button
                                        onClick={() => toggleExpand(event.id)}
                                        className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-primary transition-colors uppercase tracking-widest"
                                    >
                                        {expandedEvents.has(event.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {expandedEvents.has(event.id) ? 'Ocultar Detalhes' : 'Ver Alterações'}
                                    </button>
                                )}

                                {isAdmin && event.revertible && !event.revertedAt && (
                                    <button
                                        onClick={() => { setSelectedEvent(event); setIsRevertModalOpen(true); }}
                                        className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Desfazer Ação
                                    </button>
                                )}
                            </div>

                            {/* Diff Display */}
                            {expandedEvents.has(event.id) && event.diff && (
                                <div className="mt-3 p-4 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-[11px] font-mono shadow-inner animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-12 gap-2 mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                        <div className="col-span-4 font-bold text-zinc-400 uppercase tracking-tighter">Campo</div>
                                        <div className="col-span-4 font-bold text-zinc-400 uppercase tracking-tighter">Anterior</div>
                                        <div className="col-span-4 font-bold text-zinc-400 uppercase tracking-tighter">Novo</div>
                                    </div>
                                    {Object.entries(event.diff).map(([key, change]: [string, any]) => (
                                        <div key={key} className="grid grid-cols-12 gap-2 py-1 items-center group">
                                            <div className="col-span-4 text-zinc-500 font-bold truncate" title={key}>{key}</div>
                                            <div className="col-span-4 text-red-400 line-through truncate opacity-60">
                                                {String(change.old ?? '—')}
                                            </div>
                                            <div className="col-span-4 text-emerald-600 dark:text-emerald-400 font-bold truncate">
                                                {String(change.new ?? '—')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {event.meta?.reason && (
                                <div className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                                    <span>Justificativa: <span className="font-medium italic">"{event.meta.reason}"</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isRevertModalOpen && selectedEvent && (
                <RevertModal
                    isOpen={isRevertModalOpen}
                    onClose={() => { setIsRevertModalOpen(false); setSelectedEvent(null); }}
                    event={selectedEvent}
                    onSuccess={() => { fetchHistory(); setIsRevertModalOpen(false); }}
                />
            )}
        </div>
    );
};

export default CustomerHistory;
