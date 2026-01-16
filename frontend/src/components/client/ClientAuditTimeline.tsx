import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Clock,
    User,
    FileText,
    AlertCircle,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Shield,
    Calendar,
    Scissors,
    AlertTriangle
} from 'lucide-react';

interface AuditEvent {
    id: string;
    createdAt: string;
    actorNameSnapshot: string;
    actorRoleSnapshot: string;
    action: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    summary: string;
    diff: any;
    revertible: boolean;
    revertedAt: string | null;
}

interface ClientAuditTimelineProps {
    clientId: string;
}

const ClientAuditTimeline: React.FC<ClientAuditTimelineProps> = ({ clientId }) => {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const response = await api.get(`/audit/clients/${clientId}/audit`);
                setEvents(response.data.data || []);
            } catch (error) {

                console.error('Erro ao buscar histórico auditável:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, [clientId]);

    const getIcon = (action: string) => {
        if (action.includes('CLIENT')) return <User size={16} />;
        if (action.includes('QUOTE')) return <FileText size={16} />;
        if (action.includes('APPOINTMENT')) return <Calendar size={16} />;
        if (action.includes('PET')) return <Scissors size={16} />;
        if (action.includes('PERMISSION') || action.includes('USER')) return <Shield size={16} />;
        return <Clock size={16} />;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-500 bg-red-50 dark:bg-red-900/10';
            case 'WARNING': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/10';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/10';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-secondary">Carregando histórico...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="p-12 text-center">
                <Clock size={48} className="mx-auto mb-4 text-secondary opacity-20" />
                <h3 className="text-secondary">Nenhum evento registrado</h3>
                <p className="text-sm text-secondary opacity-60">Alterações importantes aparecerão aqui.</p>
            </div>
        );
    }

    return (
        <div className="p-4 overflow-y-auto max-h-[600px] audit-timeline">
            {events.map((event) => (
                <div key={event.id} className={`audit-item severity-${event.severity.toLowerCase()}`}>
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                            {getIcon(event.action)}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold">{event.summary}</span>
                                <span className="text-xs text-secondary">
                                    {format(new Date(event.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-secondary mb-2">
                                <span className="flex items-center gap-1">
                                    <User size={12} /> {event.actorNameSnapshot || 'Sistema'}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 uppercase font-medium">
                                    {event.actorRoleSnapshot || 'N/A'}
                                </span>
                                {event.revertedAt && (
                                    <span className="flex items-center gap-1 text-red-500 font-medium">
                                        <RotateCcw size={12} /> REVERTIDO
                                    </span>
                                )}
                            </div>

                            {event.diff && (
                                <button
                                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                                >
                                    {expandedEvent === event.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    {expandedEvent === event.id ? 'Ocultar detalhes' : 'Ver alterações'}
                                </button>
                            )}

                            {expandedEvent === event.id && event.diff && (
                                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-left text-secondary opacity-60 border-b border-black/5">
                                                <th className="pb-1 font-medium">Campo</th>
                                                <th className="pb-1 font-medium">De</th>
                                                <th className="pb-1 font-medium">Para</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(event.diff).map(([key, value]: [string, any]) => (
                                                <tr key={key} className="border-b border-black/5 last:border-0">
                                                    <td className="py-1.5 font-medium text-primary uppercase tracking-tight" style={{ fontSize: '10px' }}>{key}</td>
                                                    <td className="py-1.5 text-secondary truncate max-w-[100px]" title={String(value.old)}>
                                                        <span className="line-through opacity-50">{String(value.old || '—')}</span>
                                                    </td>
                                                    <td className="py-1.5 text-secondary font-medium">
                                                        <span className="text-green-600 dark:text-green-400">{String(value.new || '—')}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClientAuditTimeline;
