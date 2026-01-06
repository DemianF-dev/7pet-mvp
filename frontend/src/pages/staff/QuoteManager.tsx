import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
    useQuotes,
    useBulkDeleteQuotes,
    useDuplicateQuote,
    useDeleteQuote,
    usePermanentDeleteQuote,
    useRestoreQuote,
    useReactivateQuote
} from '../../hooks/useQuotes';
import BackButton from '../../components/BackButton';
import QuoteEditor from './QuoteEditor';
import { X, Search, Filter, Edit, Trash2, Copy, CheckSquare, Square, RefreshCcw, Archive, Share2, Calendar, DollarSign, Settings, Plus } from 'lucide-react';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import { getQuoteStatusColor } from '../../utils/statusColors';
import CascadeDeleteModal from '../../components/modals/CascadeDeleteModal';
import toast from 'react-hot-toast';
import QuoteTableRow from '../../components/staff/QuoteTableRow';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import Skeleton from '../../components/Skeleton';
import ManualQuoteModal from '../../components/modals/ManualQuoteModal';

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
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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
    const [selectedQuoteForDelete, setSelectedQuoteForDelete] = useState<string | null>(null);
    const [isManualQuoteModalOpen, setIsManualQuoteModalOpen] = useState(false);

    // Advanced Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [valueRange, setValueRange] = useState({ min: 0, max: 0 });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // React Query Hooks
    const { data: quotes = [], isLoading, isFetching } = useQuotes(view);
    const bulkDeleteMutation = useBulkDeleteQuotes();
    const duplicateMutation = useDuplicateQuote();
    const deleteMutation = useDeleteQuote();
    const permanentDeleteMutation = usePermanentDeleteQuote();
    const restoreMutation = useRestoreQuote();
    const reactivateMutation = useReactivateQuote();

    const handleRestore = (id: string) => {
        if (!window.confirm('Restaurar este orçamento?')) return;
        restoreMutation.mutate(id);
    };

    const handleReactivate = (id: string) => {
        if (!window.confirm('Reativar este orçamento? Especialmente útil para orçamentos encerrados.')) return;
        reactivateMutation.mutate(id);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredQuotes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredQuotes.map(q => q.id));
        }
    };

    const statuses = ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'AGENDADO', 'ENCERRADO', 'FATURAR'];

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Deseja excluir ${selectedIds.length} orçamentos?`)) return;
        bulkDeleteMutation.mutate(selectedIds, {
            onSuccess: () => setSelectedIds([])
        });
    };
    const handleDuplicate = (id: string) => {
        if (!window.confirm('Deseja duplicar este orçamento?')) return;
        duplicateMutation.mutate(id);
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

    const handleDelete = (id: string) => {
        if (!window.confirm('Mover orçamento para a lixeira?')) return;
        deleteMutation.mutate(id);
    };

    const handlePermanentDelete = (id: string) => {
        if (!window.confirm('EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.')) return;
        permanentDeleteMutation.mutate(id);
    };

    const handleBatchBill = async () => {
        try {
            const currentQuotes = Array.isArray(quotes) ? quotes : [];
            const hasFaturar = currentQuotes.some(q => q && q.status === 'FATURAR');
            if (!hasFaturar) {
                toast.error('Nenhum orçamento com status FATURAR encontrado.');
                return;
            }

            if (!window.confirm('Deseja gerar faturas individuais para todos os orçamentos com status FATURAR? Orçamentos do mesmo cliente serão agrupados em uma única fatura.')) return;

            const response = await api.post('/invoices/batch');
            toast.success(response.data.message);
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        } catch (error) {
            console.error('[QuoteManager] Error in handleBatchBill:', error);
            toast.error('Erro ao processar faturamento em lote');
        }
    };

    const handleSchedule = (quote: Quote) => {
        if (!quote) return;

        console.log('🔍 handleSchedule: quote data received:', {
            id: quote.id,
            type: quote.type,
            desiredAt: quote.desiredAt,
            scheduledAt: quote.scheduledAt,
            transportAt: quote.transportAt
        });

        // Determinar categoria baseada no tipo do quote
        let category: 'SPA' | 'LOGISTICA' | 'SPA_TRANSPORTE' = 'SPA';
        const qType = quote.type || 'SPA';
        if (qType === 'TRANSPORTE') {
            category = 'LOGISTICA';
        } else if (qType === 'SPA_TRANSPORTE') {
            category = 'SPA_TRANSPORTE';
        }

        const items = Array.isArray(quote.items) ? quote.items : [];

        const preFill = {
            customerId: quote.customerId,
            customerName: quote.customer?.name || 'Cliente',
            quoteId: quote.id,
            items: items,
            petId: quote.petId,
            serviceIds: items.filter(i => i && i.serviceId).map(i => i.serviceId as string),
            startAt: (qType === 'TRANSPORTE' ? quote.transportAt : quote.scheduledAt) || quote.desiredAt || '',
            scheduledAt: quote.scheduledAt,
            transportAt: quote.transportAt,
            desiredAt: quote.desiredAt,
            category,
            transportOrigin: quote.transportOrigin,
            transportDestination: quote.transportDestination,
            transportPeriod: quote.transportPeriod
        };

        console.log('🔍 handleSchedule: PREFILL object created:', preFill);

        setPreFillData(preFill);
        setIsAppointmentModalOpen(true);
    };

    const quotesArray = Array.isArray(quotes) ? quotes : [];
    const activeCount = quotesArray.filter(q => q && q.status !== 'ENCERRADO').length;
    const historyCount = quotesArray.filter(q => q && q.status === 'ENCERRADO').length;
    const filteredQuotes = quotesArray
        .filter(q => {
            if (!q || !q.customer) return false;

            if (view === 'active' && q.status === 'ENCERRADO') return false;
            if (view === 'history' && q.status !== 'ENCERRADO') return false;

            const name = q.customer.name || '';
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(q.id || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

            const quoteDate = new Date(q.createdAt || Date.now());
            const matchesDate = (!dateRange.start || quoteDate >= new Date(dateRange.start)) &&
                (!dateRange.end || quoteDate <= new Date(dateRange.end));

            const totalAmount = q.totalAmount || 0;
            const matchesValue = (!valueRange.min || totalAmount >= valueRange.min) &&
                (!valueRange.max || totalAmount <= valueRange.max);

            return matchesSearch && matchesStatus && matchesDate && matchesValue;
        });

    const getStatusColor = (status: string) => getQuoteStatusColor(status);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="flex-1">
                        <Breadcrumbs />
                        <BackButton className="mb-4 ml-[-1rem]" />
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                            <div className="h-[2px] w-6 bg-primary"></div>
                            RECEPÇÃO & VENDAS
                        </div>
                        <h1 className="text-4xl font-black text-secondary tracking-tight">Orçamentos</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={handleBatchBill}
                            className="bg-orange-500 text-white px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20"
                            title="Faturar Orçamentos Pendentes"
                        >
                            <DollarSign size={18} />
                            Faturamento Lote
                        </button>

                        <button
                            onClick={() => navigate('/staff/transport-config')}
                            className="bg-white p-4 rounded-[20px] text-gray-400 hover:text-indigo-600 shadow-sm hover:shadow-lg transition-all active:scale-95"
                            title="Configurações de Preços"
                        >
                            <Settings size={20} />
                        </button>

                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
                            disabled={isFetching}
                            className="bg-white p-4 rounded-[20px] text-gray-400 hover:text-primary shadow-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            title="Atualizar Lista"
                        >
                            <RefreshCcw size={20} className={isFetching ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setIsManualQuoteModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-md shadow-blue-200"
                        >
                            <Plus size={18} />
                            Novo Orçamento
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

                <div className="flex flex-col md:flex-row gap-4 mb-4">
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
                            className="bg-transparent border-none py-4 px-6 text-xs font-black uppercase tracking-widest text-secondary focus:ring-0 min-w-[200px] appearance-none cursor-pointer"
                        >
                            <option value="ALL">Todos os Status</option>
                            {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`px-6 py-4 border-l border-gray-100 transition-all ${showAdvancedFilters ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                        >
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-secondary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-secondary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor Mínimo</label>
                                    <input
                                        type="number"
                                        placeholder="R$ 0,00"
                                        value={valueRange.min || ''}
                                        onChange={(e) => setValueRange({ ...valueRange, min: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-secondary"
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <button
                                        onClick={() => {
                                            setDateRange({ start: '', end: '' });
                                            setValueRange({ min: 0, max: 0 });
                                            setSearchTerm('');
                                            setStatusFilter('ALL');
                                        }}
                                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Limpar Filtros
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-8 py-6"><Skeleton variant="rounded" className="h-6 w-6" /></td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                <Skeleton variant="text" className="h-4 w-32" />
                                                <Skeleton variant="text" className="h-3 w-48 opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-center gap-1">
                                                <Skeleton variant="text" className="h-3 w-20" />
                                                <Skeleton variant="text" className="h-3 w-16 opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <Skeleton variant="rounded" className="h-6 w-24" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end">
                                                <Skeleton variant="text" className="h-5 w-16" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                <Skeleton variant="circular" className="h-8 w-8" />
                                                <Skeleton variant="circular" className="h-8 w-8" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (filteredQuotes || []).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center">
                                        <div className="bg-gray-50 rounded-[40px] p-20 border-2 border-dashed border-gray-100">
                                            <Archive className="mx-auto text-gray-200 mb-4" size={64} />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum orçamento encontrado nesta visualização.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (filteredQuotes || []).map(quote => quote && (
                                <QuoteTableRow
                                    key={quote.id}
                                    quote={quote}
                                    view={view}
                                    isBulkMode={isBulkMode}
                                    isSelected={selectedIds.includes(quote.id)}
                                    onToggleSelect={toggleSelect}
                                    onViewCustomer={setViewCustomerData}
                                    onViewDetails={(id) => navigate(`/staff/quotes/${id}`)}
                                    onDuplicate={handleDuplicate}
                                    onShare={handleShare}
                                    onDelete={handleDelete}
                                    onPermanentDelete={handlePermanentDelete}
                                    onRestore={handleRestore}
                                    onReactivate={handleReactivate}
                                    onSchedule={handleSchedule}
                                    onViewAppointment={async (q) => {
                                        if (!q || !q.appointments) return;
                                        const appts = Array.isArray(q.appointments) ? q.appointments : [];

                                        if (appts.length === 1) {
                                            try {
                                                const res = await api.get(`/appointments/${appts[0].id}`);
                                                setViewAppointmentData(res.data);
                                                setSelectedAppointmentId(appts[0].id);
                                            } catch (err) {
                                                console.error('Erro ao buscar agendamento', err);
                                                alert('Erro ao carregar detalhes do agendamento');
                                            }
                                        } else if (appts.length > 1) {
                                            setAppointmentSelectionQuote(q);
                                        }
                                    }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit Modal (Removed to avoid nesting - now using direct page navigation) */}

                <AppointmentFormModal
                    isOpen={isAppointmentModalOpen}
                    onClose={() => setIsAppointmentModalOpen(false)}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
                    preFill={preFillData}
                />

                <AppointmentDetailsModal
                    isOpen={!!selectedAppointmentId}
                    onClose={() => setSelectedAppointmentId(null)}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
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
                            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
                        />
                    )}
                </AnimatePresence>

                {/* Manual Quote Modal */}
                <ManualQuoteModal
                    isOpen={isManualQuoteModalOpen}
                    onClose={() => setIsManualQuoteModalOpen(false)}
                    onSuccess={(newQuote) => {
                        queryClient.invalidateQueries({ queryKey: ['quotes'] });
                        setSelectedQuoteId(newQuote.id);
                    }}
                />

                <CascadeDeleteModal
                    isOpen={!!selectedQuoteForDelete}
                    onClose={() => setSelectedQuoteForDelete(null)}
                    quoteId={selectedQuoteForDelete || ''}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
                />

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
