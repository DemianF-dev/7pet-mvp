import { useState, useEffect } from 'react';
import BackButton from '../../components/BackButton';
import QuoteEditor from './QuoteEditor';
import { X, Search, Filter, Edit, Trash2, Copy, CheckSquare, Square, RefreshCcw, Archive, Share2, Calendar } from 'lucide-react';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import { getQuoteStatusColor } from '../../utils/statusColors';
import CascadeDeleteModal from '../../components/modals/CascadeDeleteModal';

interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
    serviceId?: string;
}

interface Quote {
    id: string;
    customerId: string;
    customer: { name: string };
    status: string;
    totalAmount: number;
    createdAt: string;
    seqId?: number;
    items: QuoteItem[];
    petId?: string;
    pet?: { name: string };
    desiredAt?: string;
    scheduledAt?: string;
    transportAt?: string;
    type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
    transportOrigin?: string;
    transportDestination?: string;
    transportReturnAddress?: string;
    transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
    appointments?: { id: string; category: string; status: string; startAt?: string }[];
}

export default function QuoteManager() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'active' | 'trash' | 'history'>('active');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [viewAppointmentData, setViewAppointmentData] = useState<any>(null);
    const [viewCustomerData, setViewCustomerData] = useState<string | null>(null);
    const [preFillData, setPreFillData] = useState<any>(null);
    const [appointmentSelectionQuote, setAppointmentSelectionQuote] = useState<Quote | null>(null);
    const [cascadeModalOpen, setCascadeModalOpen] = useState(false);
    const [selectedQuoteForDelete, setSelectedQuoteForDelete] = useState<string | null>(null);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredQuotes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredQuotes.map(q => q.id));
        }
    };

    const statuses = ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'AGENDADO', 'ENCERRADO'];

    useEffect(() => {
        fetchQuotes();
    }, [view]);

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const endpoint = view === 'trash' ? '/quotes/trash' : '/quotes';
            const response = await api.get(endpoint);
            setQuotes(response.data);
        } catch (error) {
            console.error('Erro ao buscar orçamentos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir PERMANENTEMENTE os ${selectedIds.length} orçamentos selecionados ? `)) return;
        try {
            await api.post('/quotes/bulk-delete', { ids: selectedIds });
            fetchQuotes();
            setSelectedIds([]);
        } catch (error) {
            alert('Erro ao excluir orçamentos');
        }
    };

    const handleDuplicate = async (id: string) => {
        if (!window.confirm('Deseja duplicar este orçamento?')) return;
        try {
            await api.post(`/quotes/${id}/duplicate`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao duplicar:', error);
        }
    };

    const handleShare = (quote: Quote) => {
        const text = `*ORÇAMENTO 7PET*\n\n` +
            `📄 *Ref:* OR-${String(quote.seqId || 0).padStart(4, '0')}\n` +
            `👤 *Cliente:* ${quote.customer.name}\n` +
            `🐶 *Pet:* ${quote.pet?.name || '-'}\n` +
            `💰 *Total:* R$ ${quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
            `📊 *Status:* ${quote.status}\n\n` +
            `_Enviado via Sistema 7Pet_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Mover orçamento para a lixeira?')) return;
        try {
            await api.delete(`/quotes/${id}`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!window.confirm('EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/quotes/${id}/permanent`);
            fetchQuotes();
        } catch (error: any) {
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                console.error('Erro ao excluir permanentemente:', error);
                alert('Erro ao tentar excluir permanentemente o orçamento');
            }
        }
    };

    const handleSchedule = (quote: Quote) => {
        console.log('🔍 handleSchedule: quote data received:', {
            id: quote.id,
            type: quote.type,
            desiredAt: quote.desiredAt,
            scheduledAt: quote.scheduledAt,
            transportAt: quote.transportAt
        });

        // Determinar categoria baseada no tipo do quote
        let category: 'SPA' | 'LOGISTICA' | 'SPA_TRANSPORTE' = 'SPA';
        if (quote.type === 'TRANSPORTE') {
            category = 'LOGISTICA';
        } else if (quote.type === 'SPA_TRANSPORTE') {
            category = 'SPA_TRANSPORTE'; // Tipo combinado
        } else if (quote.type === 'SPA') {
            category = 'SPA';
        }

        const preFill = {
            customerId: quote.customerId,
            customerName: quote.customer.name,
            quoteId: quote.id,
            items: quote.items,
            petId: quote.petId,
            serviceIds: quote.items.filter(i => i.serviceId).map(i => i.serviceId as string),
            startAt: (quote.type === 'TRANSPORTE' ? quote.transportAt : quote.scheduledAt) || quote.desiredAt || '',
            scheduledAt: quote.scheduledAt,
            transportAt: quote.transportAt,
            desiredAt: quote.desiredAt,
            category,  // Usar a categoria determinada
            transportOrigin: quote.transportOrigin,
            transportDestination: quote.transportDestination,
            transportPeriod: quote.transportPeriod
        };

        console.log('🔍 handleSchedule: PREFILL object created:', preFill);

        setPreFillData(preFill);
        setIsAppointmentModalOpen(true);
    };

    const filteredQuotes = quotes
        .filter(q => {
            if (view === 'active' && q.status === 'ENCERRADO') return false;
            if (view === 'history' && q.status !== 'ENCERRADO') return false;

            const matchesSearch = q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

    const getStatusColor = (status: string) => getQuoteStatusColor(status);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="flex-1">
                        <BackButton className="mb-4 ml-[-1rem]" />
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                            <div className="h-[2px] w-6 bg-primary"></div>
                            RECEPÇÃO & VENDAS
                        </div>
                        <h1 className="text-4xl font-black text-secondary tracking-tight">Orçamentos</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={fetchQuotes}
                            disabled={isLoading}
                            className="bg-white p-4 rounded-[20px] text-gray-400 hover:text-primary shadow-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            title="Atualizar Lista"
                        >
                            <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            className={`flex items-center gap-2 px-6 py-6 rounded-[32px] text-[10px] font-black transition-all ${isBulkMode ? 'bg-secondary text-white shadow-xl' : 'bg-white text-gray-400 hover:text-secondary shadow-sm'}`}
                        >
                            <CheckSquare size={14} strokeWidth={isBulkMode ? 3 : 2} />
                            <span className="uppercase tracking-[0.15em]">{isBulkMode ? 'Sair da Seleção' : 'Ações em Massa'}</span>
                        </button>

                        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                            <button
                                onClick={() => { setView('active'); setSelectedIds([]); }}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => { setView('history'); setSelectedIds([]); }}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                            >
                                <Archive size={14} className="inline mr-2" /> Histórico
                            </button>
                            <button
                                onClick={() => { setView('trash'); setSelectedIds([]); }}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'trash' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                            >
                                <Trash2 size={14} className="inline mr-2" /> Lixeira
                            </button>
                        </div>
                    </div>
                </header>

                <AnimatePresence>
                    {(selectedIds.length > 0 || isBulkMode) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleSelectAll}
                                    className="bg-white/10 hover:bg-white/20 text-[10px] font-black px-5 py-2 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    {selectedIds.length === filteredQuotes.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
                                </button>
                                <p className="text-sm font-black flex items-center gap-3 border-l border-white/10 pl-4">
                                    <span className="bg-primary px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary/20">{selectedIds.length}</span>
                                    itens no total
                                </p>
                            </div>
                            <div className="h-10 w-px bg-white/10 ml-auto"></div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => { setSelectedIds([]); setIsBulkMode(false); }}
                                    className="text-[10px] font-black hover:text-gray-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Trash2 size={18} /> Apagar Agora
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-[32px] pl-16 pr-8 py-5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                        />
                    </div>

                    <div className="flex bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center px-6 border-r border-gray-100 bg-gray-50/50">
                            <Filter size={18} className="text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none py-4 px-6 text-xs font-black uppercase tracking-widest text-secondary focus:ring-0 min-w-[200px] appearance-none"
                        >
                            <option value="ALL">Todos os Status</option>
                            {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-6 w-12">
                                    {(isBulkMode || selectedIds.length > 0) && (
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-gray-300 hover:text-primary transition-colors"
                                        >
                                            {selectedIds.length > 0 && selectedIds.length === filteredQuotes.length ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                        </button>
                                    )}
                                </th>
                                <th className="px-8 py-6">Cliente / Pet</th>
                                <th className="px-8 py-6 text-center">Data / Tipo</th>
                                <th className="px-8 py-6 text-center">Status</th>
                                <th className="px-8 py-6 text-right">Total</th>
                                <th className="px-8 py-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                                    </td>
                                </tr>
                            ) : filteredQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="bg-gray-50 rounded-[40px] p-20 border-2 border-dashed border-gray-100">
                                            <Archive className="mx-auto text-gray-200 mb-4" size={64} />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum orçamento encontrado nesta visualização.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (filteredQuotes || []).map(quote => quote && (
                                <tr key={quote.id} className={`hover:bg-gray-50/50 transition-all group ${selectedIds.includes(quote.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-8 py-6">
                                        {(isBulkMode || selectedIds.includes(quote.id)) && (
                                            <button
                                                onClick={(e) => toggleSelect(quote.id, e)}
                                                className={`transition-all ${selectedIds.includes(quote.id) ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'}`}
                                            >
                                                {selectedIds.includes(quote.id) ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewCustomerData(quote.customerId); }}
                                                    className="font-black text-secondary uppercase tracking-tighter text-lg hover:text-primary transition-colors text-left"
                                                >
                                                    {quote.customer.name}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedQuoteId(quote.id); }}
                                                    className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors"
                                                >
                                                    OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                                                </button>
                                            </div>
                                            {quote.pet && (
                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-widest">
                                                    Pet: {quote.pet.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[11px] font-black text-secondary uppercase tracking-widest">
                                                    {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sem data'}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400">Criado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            {quote.type && (
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${quote.type === 'SPA' ? 'bg-blue-100 text-blue-600' : quote.type === 'TRANSPORTE' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {quote.type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {quote.status === 'AGENDADO' && quote.appointments && quote.appointments.length > 0 ? (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (quote.appointments!.length === 1) {
                                                        try {
                                                            const res = await api.get(`/appointments/${quote.appointments![0].id}`);
                                                            setViewAppointmentData(res.data);
                                                            setSelectedAppointmentId(quote.appointments![0].id);
                                                        } catch (err) {
                                                            console.error('Erro ao buscar agendamento', err);
                                                            alert('Erro ao carregar detalhes do agendamento');
                                                        }
                                                    } else {
                                                        setAppointmentSelectionQuote(quote);
                                                    }
                                                }}
                                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(quote.status)} hover:ring-2 hover:ring-offset-2 hover:ring-green-500 transition-all cursor-pointer`}
                                            >
                                                {quote.status}
                                            </button>
                                        ) : (
                                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(quote.status)}`}>
                                                {quote.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-secondary text-lg">
                                        R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {view === 'trash' ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Deseja restaurar este orçamento para a lista de ativos?')) {
                                                                api.post(`/quotes/${quote.id}/restore`).then(() => fetchQuotes());
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-green-50 text-green-500 rounded-xl transition-all"
                                                        title="Restaurar"
                                                    >
                                                        <RefreshCcw size={18} />
                                                    </button>
                                                    <button onClick={() => handlePermanentDelete(quote.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all" title="Excluir Permanente"><Trash2 size={18} /></button>
                                                </>
                                            ) : view === 'history' ? (
                                                <>
                                                    <button onClick={() => handleDuplicate(quote.id)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Duplicar Orçamento"><Copy size={18} /></button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Deseja REATIVAR este orçamento? Ele voltará para a lista de ativos com status SOLICITADO.')) {
                                                                try {
                                                                    await api.patch(`/quotes/${quote.id}`, { status: 'SOLICITADO' });
                                                                    fetchQuotes();
                                                                } catch (err) {
                                                                    alert('Erro ao reativar orçamento');
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                                                        title="Reativar Orçamento"
                                                    >
                                                        <RefreshCcw size={14} /> Reativar
                                                    </button>
                                                    <button onClick={() => setSelectedQuoteId(quote.id)} className="p-2 bg-gray-50 hover:bg-gray-100 text-secondary rounded-xl transition-all" title="Ver Detalhes"><Edit size={18} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleDuplicate(quote.id)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Duplicar"><Copy size={18} /></button>
                                                    <button onClick={() => handleShare(quote)} className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Compartilhar no WhatsApp"><Share2 size={18} /></button>
                                                    <button onClick={() => handleDelete(quote.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Mover para Lixeira"><Trash2 size={18} /></button>
                                                    <button onClick={() => setSelectedQuoteId(quote.id)} className="p-2 bg-gray-50 hover:bg-gray-100 text-secondary rounded-xl transition-all" title="Ver Detalhes"><Edit size={18} /></button>
                                                    {quote.status === 'APROVADO' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSchedule(quote); }}
                                                            className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
                                                            title="Agendar Agora"
                                                        >
                                                            <Calendar size={14} /> Agendar
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal */}
                <AnimatePresence>
                    {selectedQuoteId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedQuoteId(null)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
                            >
                                <button
                                    onClick={() => setSelectedQuoteId(null)}
                                    className="absolute top-6 right-6 z-50 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                                <QuoteEditor
                                    quoteId={selectedQuoteId}
                                    onClose={() => setSelectedQuoteId(null)}
                                    onUpdate={fetchQuotes}
                                    onSchedule={(qData) => {
                                        setSelectedQuoteId(null);
                                        handleSchedule(qData);
                                    }}
                                />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AppointmentFormModal
                    isOpen={isAppointmentModalOpen}
                    onClose={() => setIsAppointmentModalOpen(false)}
                    onSuccess={fetchQuotes}
                    preFill={preFillData}
                />

                <AppointmentDetailsModal
                    isOpen={!!selectedAppointmentId}
                    onClose={() => setSelectedAppointmentId(null)}
                    onSuccess={fetchQuotes}
                    appointment={viewAppointmentData}
                    onModify={() => { }}
                    onCopy={() => { }}
                    onOpenCustomer={(customerId) => setViewCustomerData(customerId)}
                />

                <AnimatePresence>
                    {viewCustomerData && (
                        <CustomerDetailsModal
                            isOpen={!!viewCustomerData}
                            onClose={() => setViewCustomerData(null)}
                            customerId={viewCustomerData}
                            onUpdate={fetchQuotes}
                        />
                    )}
                </AnimatePresence>

                {/* Appointment Selection Modal (For Multi-Apppointment Quotes) */}
                <AnimatePresence>
                    {appointmentSelectionQuote && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setAppointmentSelectionQuote(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400"
                                >
                                    <X size={24} />
                                </button>

                                <h2 className="text-2xl font-black text-secondary mb-2">Selecionar Agendamento</h2>
                                <p className="text-gray-400 font-medium mb-8">Esta solicitação gerou múltiplos agendamentos. Qual você deseja visualizar?</p>

                                <div className="grid grid-cols-1 gap-4">
                                    {Object.values(
                                        (appointmentSelectionQuote.appointments || []).reduce((acc: any, curr) => {
                                            const existing = acc[curr.category || 'UNK'];
                                            if (!existing) {
                                                acc[curr.category || 'UNK'] = curr;
                                            } else {
                                                const score = (s: string) => s === 'CONFIRMADO' ? 3 : (s === 'PENDENTE' || s === 'AGENDADO') ? 2 : 1;
                                                const currScore = score(curr.status);
                                                const existingScore = score(existing.status);

                                                if (currScore > existingScore) {
                                                    acc[curr.category || 'UNK'] = curr;
                                                } else if (currScore === existingScore) {
                                                    if (new Date(curr.startAt || 0) > new Date(existing.startAt || 0)) {
                                                        acc[curr.category || 'UNK'] = curr;
                                                    }
                                                }
                                            }
                                            return acc;
                                        }, {})
                                    ).map((appt: any) => (
                                        <button
                                            key={appt.id}
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get(`/appointments/${appt.id}`);
                                                    setViewAppointmentData(res.data);
                                                    setSelectedAppointmentId(appt.id);
                                                    setAppointmentSelectionQuote(null);
                                                } catch (err) {
                                                    console.error('Erro ao buscar agendamento', err);
                                                    alert('Erro ao carregar detalhes do agendamento');
                                                }
                                            }}
                                            className="flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${appt.category === 'LOGISTICA' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-exrabold text-secondary text-lg group-hover:text-primary transition-colors font-black">
                                                    {appt.category === 'LOGISTICA' ? 'Transporte / Logística' : 'Banho & Tosa (SPA)'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getStatusColor(appt.status)}`}>
                                                        {appt.status}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400">
                                                        {new Date(appt.startAt!).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </main >
        </div >
    );
}
