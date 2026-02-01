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
    useBulkRestoreQuotes,
    useReactivateQuote
} from '../../hooks/useQuotes';
import {
    X,
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    RefreshCcw,
    Archive,
    Share2,
    Calendar,
    DollarSign,
    Settings,
    Plus,
    CheckSquare,
    Square
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
import QueryState from '../../components/system/QueryState';
import ResponsiveTable, { Column } from '../../components/system/ResponsiveTable';
import { Container, Stack } from '../../components/layout/LayoutHelpers';
import { Button, Input, Badge, IconButton, EmptyState, Card } from '../../components/ui';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileQuotes } from './MobileQuotes';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';

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
    const { isMobile } = useIsMobile();

    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'active' | 'trash' | 'history'>('active');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Register Mobile FAB Action
    useRegisterMobileAction('new_quote', () => setIsManualQuoteModalOpen(true));

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
    const bulkRestoreMutation = useBulkRestoreQuotes();
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

    const handleBulkDelete = async (ids: string[]) => {
        if (!window.confirm(`Deseja excluir ${ids.length} orçamentos?`)) return;
        bulkDeleteMutation.mutate(ids, {
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

        setPreFillData(preFill);
        setIsAppointmentModalOpen(true);
    };

    const quotesArray = Array.isArray(quotes) ? quotes : [];
    const filteredQuotes = quotesArray
        .filter(q => {
            if (!q || !q.customer) return false;

            if (view === 'active' && q.status === 'ENCERRADO') return false;
            if (view === 'history' && q.status !== 'ENCERRADO') return false;

            const term = searchTerm.toLowerCase();
            const name = (q.customer.name || '').toLowerCase();
            const petName = (q.pet?.name || '').toLowerCase();
            const id = String(q.id || '').toLowerCase();
            const formattedSeqId = String((q.seqId || 0) + 1000);

            const matchesSearch =
                name.includes(term) ||
                petName.includes(term) ||
                id.includes(term) ||
                formattedSeqId.includes(term);

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

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const columns: Column<Quote>[] = [
        {
            header: 'Ref',
            key: 'seqId',
            sortable: true,
            className: 'w-24',
            render: (quote) => (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                </span>
            )
        },
        {
            header: 'Cliente / Pet',
            key: 'customer.name',
            sortable: true,
            render: (quote) => (
                <div className="flex flex-col">
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewCustomerData(quote.customerId); }}
                        className="font-black text-secondary uppercase tracking-tight text-sm hover:text-primary transition-colors text-left truncate"
                    >
                        {quote.customer?.name || 'Cliente'}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                        {quote.pet && (
                            <Badge variant="neutral" size="sm" className="bg-primary/10 text-primary border-transparent leading-none py-0.5 px-1.5 h-auto font-bold lowercase">
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
            render: (quote) => (
                <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-secondary uppercase tracking-widest">
                        {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Sem data'}
                    </span>
                    <Badge variant="neutral" size="sm" className="mt-1 font-black text-[9px] uppercase">
                        {quote.type?.replace('_', ' ') || 'SPA'}
                    </Badge>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            sortable: true,
            className: 'text-center',
            render: (quote) => (
                <Badge
                    variant="neutral"
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getQuoteStatusColor(quote.status)}`}
                >
                    {quote.status}
                </Badge>
            )
        },
        {
            header: 'Total',
            key: 'totalAmount',
            sortable: true,
            className: 'text-right',
            render: (quote) => (
                <span className="font-black text-secondary text-base">
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
                    <IconButton icon={Edit} onClick={() => navigate(`/staff/quotes/${quote.id}`)} variant="ghost" size="sm" />
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
            }
        } else if (appts.length > 1) {
            setAppointmentSelectionQuote(q);
        }
    };

    const handleBulkRestore = async (ids: string[]) => {
        if (!window.confirm(`Deseja restaurar ${ids.length} orçamentos?`)) return;
        bulkRestoreMutation.mutate(ids, {
            onSuccess: () => setSelectedIds([])
        });
    };

    const handleBulkDuplicate = async (ids: string[]) => {
        if (!window.confirm(`Deseja duplicar ${ids.length} orçamentos?`)) return;
        // Implement bulk duplicate logic
        for (const id of ids) {
            duplicateMutation.mutate(id);
        }
    };

    const renderContent = () => {
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
                    onBulkDelete={handleBulkDelete}
                    onBulkRestore={handleBulkRestore}
                    onBatchBill={handleBatchBill}
                    onBulkDuplicate={handleBulkDuplicate}
                    onShare={handleShare}
                    onDuplicate={handleDuplicate}
                />
            );
        }

        return (
            <Container>
                <Stack gap={10} className="py-10 pb-32">
                    <header>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col gap-1">
                                <Breadcrumbs />
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black text-secondary tracking-tight">Orçamentos</h1>
                                    <Badge variant="neutral" className="h-6 px-2 font-bold opacity-60">
                                        {filteredQuotes.length} REF
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <IconButton icon={DollarSign} onClick={handleBatchBill} variant="secondary" className="bg-orange-500/10 text-orange-600" />
                                <IconButton icon={Settings} onClick={() => navigate('/staff/transport-config')} variant="secondary" />
                                <Button
                                    onClick={() => setIsManualQuoteModalOpen(true)}
                                    variant="primary"
                                    icon={Plus}
                                    className="shadow-xl shadow-primary/20 h-12"
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
                                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-transparent border-none py-1 px-4 text-[10px] font-black uppercase tracking-wider text-gray-500 focus:ring-0 appearance-none cursor-pointer"
                                    >
                                        <option value="ALL">TODOS</option>
                                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <IconButton icon={Filter} size="sm" variant={showAdvancedFilters ? 'primary' : 'ghost'} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} />
                                </div>
                            </div>

                            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 self-end md:self-auto">
                                <button
                                    onClick={() => setView('active')}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${view === 'active' ? 'bg-white text-secondary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => setView('trash')}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${view === 'trash' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Trash2 size={12} /> Lixeira
                                </button>
                            </div>
                        </div>
                    </header>

                    <QueryState
                        isLoading={isLoading}
                        isEmpty={filteredQuotes.length === 0}
                        emptyMessage="Nenhum orçamento encontrado."
                    >
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <ResponsiveTable
                                columns={columns}
                                data={sortedQuotes}
                                onRowClick={(quote) => navigate(`/staff/quotes/edit/${quote.id}`)}
                                selectable={true}
                                selectedIds={selectedIds}
                                onSelectRow={toggleSelect}
                                onSelectAll={handleSelectAll}
                                keyExtractor={(quote) => quote.id}
                            />
                        </div>
                    </QueryState>
                </Stack>
            </Container>
        );
    };

    return (
        <>
            {renderContent()}

            {/* Modals shared by both views */}
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

            <ManualQuoteModal
                isOpen={isManualQuoteModalOpen}
                onClose={() => setIsManualQuoteModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
            />

            <CascadeDeleteModal
                isOpen={!!selectedQuoteForDelete}
                onClose={() => setSelectedQuoteForDelete(null)}
                quoteId={selectedQuoteForDelete || ''}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['quotes'] })}
            />

            {/* Simplified appointment detail view for this example */}
            <AnimatePresence>
                {viewAppointmentData && (
                    <AppointmentDetailsModal
                        isOpen={!!viewAppointmentData}
                        onClose={() => setViewAppointmentData(null)}
                        appointmentId={selectedAppointmentId || ''}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
