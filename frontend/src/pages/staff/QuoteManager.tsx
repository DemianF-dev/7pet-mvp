import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    useQuotes,
    useBulkDeleteQuotes,
    useDuplicateQuote,
    useDeleteQuote,
    usePermanentDeleteQuote,
    useRestoreQuote,
    useReactivateQuote
} from '../../hooks/useQuotes';
import {
    X,
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    CheckSquare,
    Square,
    RefreshCcw,
    Archive,
    Share2,
    Calendar,
    DollarSign,
    Settings,
    Plus,
    Trash
} from 'lucide-react';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getQuoteStatusColor } from '../../utils/statusColors';
import CascadeDeleteModal from '../../components/modals/CascadeDeleteModal';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import ManualQuoteModal from '../../components/modals/ManualQuoteModal';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import QueryState from '../../components/system/QueryState';
import ResponsiveTable, { Column } from '../../components/system/ResponsiveTable';
import { Container, Stack } from '../../components/layout/LayoutHelpers';
import { Button, Input, Badge, IconButton, EmptyState, Card } from '../../components/ui';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileQuotes } from './MobileQuotes';

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

    // Register mobile FAB action
    useRegisterMobileAction('new_quote', () => setIsManualQuoteModalOpen(true));

    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'active' | 'trash' | 'history'>('active');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { isMobile } = useIsMobile();
    void useState(false); // isBulkMode, setIsBulkMode - reserved for bulk selection mode
    const [, setSelectedQuoteId] = useState<string | null>(null); // selectedQuoteId - reserved for quick view
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

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // React Query Hooks
    const { data: quotes = [], isLoading } = useQuotes(view);
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
    void quotesArray.filter(q => q && q.status !== 'ENCERRADO').length; // activeCount - reserved for tab badge
    void quotesArray.filter(q => q && q.status === 'ENCERRADO').length; // historyCount - reserved for tab badge
    const filteredQuotes = quotesArray
        .filter(q => {
            if (!q || !q.customer) return false;

            if (view === 'active' && q.status === 'ENCERRADO') return false;
            if (view === 'history' && q.status !== 'ENCERRADO') return false;

            const term = searchTerm.toLowerCase();
            const name = (q.customer.name || '').toLowerCase();
            const petName = (q.pet?.name || '').toLowerCase();
            const id = String(q.id || '').toLowerCase();
            const seqId = String(q.seqId || '');
            const formattedSeqId = String((q.seqId || 0) + 1000); // OC-xxxx format
            const customerId = String(q.customerId || '').toLowerCase();

            const matchesSearch =
                name.includes(term) ||
                petName.includes(term) ||
                id.includes(term) ||
                seqId.includes(term) ||
                formattedSeqId.includes(term) ||
                customerId.includes(term);

            const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

            const quoteDate = new Date(q.createdAt || Date.now());
            const matchesDate = (!dateRange.start || quoteDate >= new Date(dateRange.start)) &&
                (!dateRange.end || quoteDate <= new Date(dateRange.end));

            const totalAmount = q.totalAmount || 0;
            const matchesValue = (!valueRange.min || totalAmount >= valueRange.min) &&
                (!valueRange.max || totalAmount <= valueRange.max);

            return matchesSearch && matchesStatus && matchesDate && matchesValue;
        });

    const sortedQuotes = [...filteredQuotes].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const getValue = (obj: any, path: string) => {
            return path.split('.').reduce((o, i) => (o as any)?.[i], obj);
        };

        let aValue = getValue(a, key);
        let bValue = getValue(b, key);

        // Handle nulls/undefined - always put them last
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Handle specific types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        // Default comparison (numbers, dates, etc)
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (isMobile) {
        return (
            <MobileQuotes
                quotes={sortedQuotes}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                view={view}
                onViewChange={setView}
                onNewQuote={() => setIsManualQuoteModalOpen(true)}
                onOpenDetails={(id) => navigate(`/staff/quotes/edit/${id}`)}
            />
        );
    }

    const columns: Column<Quote>[] = [
        {
            header: 'Ref',
            key: 'seqId',
            sortable: true,
            className: 'w-24', // Fixed width for alignment
            render: (quote) => (
                <span className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-widest">
                    OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                </span>
            )
        },
        {
            header: 'Cliente / Pet',
            key: 'customer.name', // Used for sorting
            sortable: true,
            sortKey: 'customer.name',
            render: (quote) => (
                <div className="flex flex-col">
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewCustomerData(quote.customerId); }}
                        className="font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-tight text-sm hover:text-[var(--color-accent-primary)] transition-colors text-left truncate"
                    >
                        {quote.customer?.name || 'Cliente'}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                        {quote.pet && (
                            <Badge variant="neutral" size="sm" className="bg-[var(--color-accent-primary-alpha)] text-[var(--color-accent-primary)] border-transparent leading-none py-0.5 px-1.5 h-auto font-bold">
                                {quote.pet.name}
                            </Badge>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Data / Tipo',
            key: 'desiredAt',
            sortable: true,
            className: 'text-center',
            render: (quote) => (
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-widest">
                        {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sem data'}
                    </span>
                    {quote.type && (
                        <Badge
                            variant="neutral"
                            size="sm"
                            className={`mt-1 font-[var(--font-weight-black)] text-[9px] uppercase tracking-wider ${quote.type === 'SPA' ? 'text-blue-500' : quote.type === 'TRANSPORTE' ? 'text-orange-500' : 'text-purple-500'}`}
                        >
                            {quote.type.replace('_', ' ')}
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            sortable: true,
            className: 'text-center',
            render: (quote) => (
                quote.status === 'AGENDADO' && quote.appointments && quote.appointments.length > 0 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleViewAppointment(quote); }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest ${getQuoteStatusColor(quote.status)} hover:ring-2 hover:ring-[var(--color-accent-primary-alpha)] transition-all cursor-pointer`}

                    >
                        {quote.status}
                    </button>
                ) : (
                    <Badge
                        variant="neutral"
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest ${getQuoteStatusColor(quote.status)}`}

                    >
                        {quote.status}
                    </Badge>
                )
            )
        },
        {
            header: 'Total',
            key: 'totalAmount',
            sortable: true,
            className: 'text-right',
            render: (quote) => (
                <span className="font-[var(--font-weight-black)] text-[var(--color-text-primary)] text-lg">
                    R$ {(quote.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: '',
            key: 'actions',
            className: 'text-right',
            render: (quote) => (
                <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    {view === 'trash' ? (
                        <>
                            <IconButton icon={RefreshCcw} onClick={() => handleRestore(quote.id)} variant="ghost" size="sm" className="text-green-500" aria-label="Restaurar" />
                            <IconButton icon={Trash2} onClick={() => handlePermanentDelete(quote.id)} variant="ghost" size="sm" className="text-red-500" aria-label="Excluir Permanente" />
                        </>
                    ) : view === 'history' ? (
                        <>
                            <IconButton icon={Copy} onClick={() => handleDuplicate(quote.id)} variant="ghost" size="sm" aria-label="Duplicar" />
                            <Button
                                onClick={() => handleReactivate(quote.id)}
                                variant="outline"
                                size="sm"
                                className="text-green-600 font-[var(--font-weight-black)] text-[10px] py-1 px-3 h-9"
                                icon={RefreshCcw}
                            >
                                REATIVAR
                            </Button>
                            <IconButton icon={Edit} onClick={() => navigate(`/staff/quotes/${quote.id}`)} variant="ghost" size="sm" aria-label="Editar" />
                        </>
                    ) : (
                        <>
                            <IconButton icon={Copy} onClick={() => handleDuplicate(quote.id)} variant="ghost" size="sm" className="hidden md:flex" aria-label="Duplicar" />
                            <IconButton icon={Share2} onClick={() => handleShare(quote)} variant="ghost" size="sm" className="text-green-600 hidden md:flex" aria-label="Compartilhar" />
                            <IconButton icon={Trash2} onClick={() => handleDelete(quote.id)} variant="ghost" size="sm" className="text-red-500 hidden md:flex" aria-label="Mover para Lixeira" />
                            <IconButton icon={Edit} onClick={() => navigate(`/staff/quotes/${quote.id}`)} variant="ghost" size="sm" aria-label="Editar" />
                            {quote.status === 'APROVADO' && (
                                <Button
                                    onClick={(e) => { e.stopPropagation(); handleSchedule(quote); }}
                                    variant="primary"
                                    size="sm"
                                    className="h-9 px-3 font-[var(--font-weight-black)] text-[10px]"
                                    icon={Calendar}
                                >
                                    AGENDAR
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )
        }
    ];

    const handleViewAppointment = async (q: Quote) => {
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
    };

    return (
        <Container>
            <Stack gap={10} className="py-10 pb-32">
                <header>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col gap-1">
                            <Breadcrumbs />
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] tracking-tight">
                                    Orçamentos
                                </h1>
                                <Badge variant="neutral" className="h-6 px-2 font-bold opacity-60">
                                    {filteredQuotes.length} REF
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <IconButton
                                icon={DollarSign}
                                aria-label="Faturamento em Lote"
                                variant="secondary"
                                onClick={handleBatchBill}
                                className="bg-orange-500/10 text-orange-600 border-orange-500/20"
                            />
                            <IconButton
                                icon={Settings}
                                aria-label="Configurações"
                                variant="secondary"
                                onClick={() => navigate('/staff/transport-config')}
                            />
                            <Button
                                onClick={() => setIsManualQuoteModalOpen(true)}
                                variant="primary"
                                icon={Plus}
                                className="shadow-[var(--shadow-xl)] shadow-[var(--color-accent-primary-alpha)] h-12"
                            >
                                NOVO
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-2xl flex gap-3">
                            <Input
                                placeholder="Buscar por cliente, pet ou ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={Search}
                                variant="filled"
                                className="flex-1"
                            />
                            <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-[var(--radius-xl)] border border-[var(--color-border)]">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-none py-1 px-4 text-[10px] font-[var(--font-weight-black)] uppercase tracking-wider text-[var(--color-text-secondary)] focus:ring-0 appearance-none cursor-pointer"
                                >
                                    <option value="ALL">TODOS</option>
                                    {statuses.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <IconButton
                                    icon={Filter}
                                    aria-label="Filtros"
                                    size="sm"
                                    variant={showAdvancedFilters ? 'primary' : 'ghost'}
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                />
                            </div>
                        </div>

                        <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-[var(--radius-xl)] border border-[var(--color-border)] self-end md:self-auto">
                            <button
                                onClick={() => { setView('active'); setSelectedIds([]); }}
                                className={`px-5 py-2 rounded-[var(--radius-lg)] text-[10px] font-[var(--font-weight-black)] uppercase tracking-wider transition-all ${view === 'active' ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                ATIVOS
                            </button>
                            <button
                                onClick={() => { setView('trash'); setSelectedIds([]); }}
                                className={`px-5 py-2 rounded-[var(--radius-lg)] text-[10px] font-[var(--font-weight-black)] uppercase tracking-wider transition-all flex items-center gap-1.5 ${view === 'trash' ? 'bg-[var(--color-error)] text-white shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                <Trash2 size={12} /> LIXEIRA
                            </button>
                        </div>
                    </div>
                </header>

                {/* Floating Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <div className="fixed bottom-10 left-0 right-0 z-50 px-[var(--space-6)] flex justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                                className="bg-[var(--color-text-primary)] text-white px-6 py-4 rounded-[var(--radius-3xl)] shadow-[var(--shadow-2xl)] border border-white/10 flex items-center justify-between gap-8 md:min-w-[480px] max-w-full backdrop-blur-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <Badge variant="default" className="bg-white text-[var(--color-text-primary)] h-8 px-4 font-black">
                                        {selectedIds.length}
                                    </Badge>
                                    <span className="text-xs font-[var(--font-weight-black)] text-white/50 uppercase tracking-widest">
                                        SELECIONADOS
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {view === 'trash' ? (
                                        <>
                                            <Button
                                                onClick={() => {
                                                    if (window.confirm('Restaurar os orçamentos selecionados?')) {
                                                        selectedIds.forEach(id => restoreMutation.mutate(id));
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="h-10 px-4 bg-white/10 border-white/10 hover:bg-white/20 text-white"
                                                icon={RefreshCcw}
                                            >
                                                RESTAURAR
                                            </Button>
                                            <Button
                                                onClick={handleBulkDelete}
                                                variant="destructive"
                                                size="sm"
                                                className="h-10 px-4"
                                                icon={Trash}
                                            >
                                                EXCLUIR
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setSelectedIds([])}
                                                className="text-[10px] font-[var(--font-weight-black)] text-white/50 hover:text-white transition-colors"
                                            >
                                                CANCELAR
                                            </button>
                                            <Button
                                                onClick={handleBulkDelete}
                                                variant="destructive"
                                                size="sm"
                                                className="h-10 px-4"
                                                icon={Trash}
                                            >
                                                LIXEIRA
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>


                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <Card className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Input
                                    label="Data Inicial"
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                                <Input
                                    label="Data Final"
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                                <Input
                                    label="Valor Mínimo"
                                    type="number"
                                    placeholder="R$ 0,00"
                                    value={valueRange.min || ''}
                                    onChange={(e) => setValueRange({ ...valueRange, min: parseFloat(e.target.value) || 0 })}
                                />
                                <div className="flex flex-col justify-end pb-1">
                                    <Button
                                        onClick={() => {
                                            setDateRange({ start: '', end: '' });
                                            setValueRange({ min: 0, max: 0 });
                                            setSearchTerm('');
                                            setStatusFilter('ALL');
                                        }}
                                        variant="outline"
                                        className="w-full h-11 font-[var(--font-weight-black)] text-[10px] uppercase tracking-widest"
                                    >
                                        Limpar Filtros
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <QueryState
                    isLoading={isLoading}
                    isEmpty={filteredQuotes.length === 0}
                    emptyState={
                        <EmptyState
                            icon={Archive}
                            title="Nenhum orçamento"
                            description={searchTerm ? `Não encontramos orçamentos para "${searchTerm}".` : "Tudo limpo por aqui. Aguardando novas solicitações dos clientes."}
                            action={!searchTerm ? {
                                label: "CRIAR NOVO ORÇAMENTO",
                                onClick: () => setIsManualQuoteModalOpen(true),
                                icon: Plus
                            } : undefined}
                        />
                    }
                >
                    <div className="bg-[var(--color-bg-surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] overflow-hidden p-4 md:p-8">
                        <ResponsiveTable
                            columns={columns}
                            data={sortedQuotes}
                            isLoading={isLoading}
                            keyExtractor={(q) => q.id}
                            onRowClick={(q) => navigate(`/staff/quotes/${q.id}`)}
                            selectable={true}
                            selectedIds={selectedIds}
                            onSelectRow={toggleSelect}
                            onSelectAll={handleSelectAll}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            emptyMessage={searchTerm ? "Nenhum orçamento encontrado para os termos da busca." : "Nenhum orçamento encontrado."}
                            renderMobileCard={(quote) => (
                                <Card
                                    variant="glass"
                                    className={`p-5 rounded-[32px] border transition-all relative overflow-hidden ${selectedIds.includes(quote.id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                    OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                                                </span>
                                                <Badge variant="neutral" size="sm" className={getQuoteStatusColor(quote.status)}>{quote.status}</Badge>
                                            </div>
                                            <h3 className="text-base font-black text-secondary uppercase truncate max-w-[200px]">{quote.customer?.name || 'Cliente'}</h3>
                                            {quote.pet && <p className="text-[10px] font-bold text-gray-400">🐶 {quote.pet.name}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(quote.id, e); }}
                                                className={`p-2 rounded-xl transition-all shadow-sm border ${selectedIds.includes(quote.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100'}`}
                                            >
                                                {selectedIds.includes(quote.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{quote.type?.replace('_', ' ') || 'SPA'}</span>
                                            <span className="text-xs font-bold text-secondary">
                                                {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-primary">R$ {(quote.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        />
                    </div>
                </QueryState>

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
                                className="bg-white dark:bg-gray-800 rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setAppointmentSelectionQuote(null)}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400"
                                >
                                    <X size={24} />
                                </button>

                                <h2 className="text-2xl font-black text-secondary dark:text-white mb-2">Selecionar Agendamento</h2>
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
                                                <h4 className="font-extrabold text-secondary dark:text-white text-lg group-hover:text-primary transition-colors font-black">
                                                    {appt.category === 'LOGISTICA' ? 'Transporte / Logística' : 'Banho & Tosa (SPA)'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getQuoteStatusColor(appt.status)}`}>
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

            </Stack>
        </Container>
    );
}
