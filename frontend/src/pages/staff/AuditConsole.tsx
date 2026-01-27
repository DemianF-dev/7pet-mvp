import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Search, Filter,
    RotateCcw, Eye, Download, ChevronLeft, ChevronRight,
    CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import RevertModal from '../../components/modals/RevertModal';

const AuditConsole: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        severity: '',
        targetType: '',
        action: '',
        search: ''
    });

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [showRevertModal, setShowRevertModal] = useState(false);

    useEffect(() => {
        fetchAuditLogs();
    }, [page, filters]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...filters
            };
            const response = await api.get('/audit/admin/audit', { params });
            setEvents(response.data?.data || []);
            setTotalPages(response.data?.pagination?.pages || 1);
        } catch (error) {
            toast.error('Erro ao carregar log de auditoria');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-500 text-white';
            case 'WARNING': return 'bg-amber-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    return (
        <div className="p-8">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary tracking-tight">Console de <span className="text-primary">Auditoria</span></h1>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Monitoramento de segurança e integridade</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-secondary hover:bg-gray-50 transition-all uppercase tracking-widest shadow-sm">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Buscar por ator, resumo..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                    />
                </div>
                <select
                    name="severity"
                    value={filters.severity}
                    onChange={handleFilterChange}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                >
                    <option value="">Severidade (Todas)</option>
                    <option value="INFO">Informativo</option>
                    <option value="WARNING">Aviso</option>
                    <option value="CRITICAL">Crítico</option>
                </select>
                <select
                    name="targetType"
                    value={filters.targetType}
                    onChange={handleFilterChange}
                    className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                >
                    <option value="">Tipo de Alvo (Todos)</option>
                    <option value="CLIENT">Clientes</option>
                    <option value="SERVICE">Serviços</option>
                    <option value="APPOINTMENT">Agendamentos</option>
                    <option value="QUOTE">Orçamentos</option>
                    <option value="USER">Staff/Segurança</option>
                </select>
                <button
                    onClick={() => { setFilters({ severity: '', targetType: '', action: '', search: '' }); setPage(1); }}
                    className="bg-secondary text-white rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90"
                >
                    <Filter size={16} /> Limpar Filtros
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data / Hora</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ator</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação / Resumo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Severidade</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-secondary font-bold">Carregando eventos...</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold">Nenhum evento encontrado.</td></tr>
                        ) : events.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-secondary">
                                            {format(new Date(event.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold tracking-tight">
                                            {format(new Date(event.createdAt), "HH:mm:ss", { locale: ptBR })}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                            {event.actorNameSnapshot?.substring(0, 2).toUpperCase() || 'SYS'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-secondary">{event.actorNameSnapshot || 'Sistema'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{event.actorRoleSnapshot || 'AGENT'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col max-w-md">
                                        <span className="text-xs font-black text-secondary uppercase tracking-tight" style={{ fontSize: '10px' }}>{event.action}</span>
                                        <span className="text-xs text-gray-500 font-medium truncate" title={event.summary}>{event.summary}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${getSeverityBadge(event.severity)}`}>
                                        {event.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {event.revertible && !event.revertedAt && (
                                            <button
                                                onClick={() => { setSelectedEvent(event); setShowRevertModal(true); }}
                                                className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                title="Reverter Alteração"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        )}
                                        {event.revertedAt && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg" title={`Revertido por ID: ${event.revertedByUserId}`}>
                                                <CheckCircle size={10} /> Revertido
                                            </div>
                                        )}
                                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-200 transition-all">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-6 bg-gray-50/30 flex items-center justify-between border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showRevertModal && selectedEvent && (
                <RevertModal
                    isOpen={showRevertModal}
                    onClose={() => { setShowRevertModal(false); setSelectedEvent(null); }}
                    event={selectedEvent}
                    onSuccess={() => { fetchAuditLogs(); setShowRevertModal(false); }}
                />
            )}
        </div>
    );
};

export default AuditConsole;
