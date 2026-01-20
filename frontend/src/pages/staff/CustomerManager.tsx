import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
    Search,
    Plus,
    User,
    Phone,
    MapPin,
    CheckSquare,
    Square,
    RefreshCcw,
    Edit,
    Trash2,
    LayoutGrid,
    List,
    Calendar,
    Star,
    MoreHorizontal,
    Trash
} from 'lucide-react';
import { useServices } from '../../context/ServicesContext';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge, IconButton, EmptyState, GlassSurface } from '../../components/ui';
import QueryState from '../../components/system/QueryState';
import VirtualList from '../../components/system/VirtualList';
import { Container } from '../../components/layout/LayoutHelpers';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type: 'AVULSO' | 'RECORRENTE';
    legacyBitrixId?: string;
    internalNotes?: string;
    recurrenceDiscount?: number;
    user: {
        seqId: number;
        staffId?: number;
        email: string;
        staff?: { name: string };
    };
    _count: {
        appointments: number;
        quotes: number;
        pets: number;
    };
    pets?: Array<{ name: string }>;
}

type TabType = 'active' | 'trash';

// fetchCustomers removed as it's now handled by the service in the component closure

export default function CustomerManager() {
    const { customers: customersService } = useServices();

    // Register mobile FAB action
    useRegisterMobileAction('new_customer', () => setSelectedCustomerId('new'));

    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [tab, setTab] = useState<TabType>('active');

    const { data: customers = [], isLoading, isFetching } = useQuery({
        queryKey: ['customers', tab],
        queryFn: () => tab === 'trash' ? customersService.listTrash() : customersService.list(),
        staleTime: 5 * 60 * 1000,
    });

    // Explicitly define Customer type for the mutation callback
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => customersService.bulkDelete(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedIds([]);
            setIsBulkMode(false);
            toast.success('Clientes movidos para a lixeira');
        }
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: (id: string) => customersService.deletePermanent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente excluído permanentemente');
        }
    });

    const bulkRestoreMutation = useMutation({
        mutationFn: (ids: string[]) => customersService.bulkRestore(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedIds([]);
            setIsBulkMode(false);
            toast.success('Clientes restaurados com sucesso');
        }
    });

    const handleSelectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c.id));
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        const action = tab === 'trash' ? 'excluir PERMANENTEMENTE' : 'mover para a lixeira';
        if (!window.confirm(`ATENÇÃO: Deseja realmente ${action} os ${selectedIds.length} clientes selecionados?`)) return;

        if (tab === 'trash') {
            // Sequential deletion for permanent delete (backend might not have bulk permanent delete)
            for (const id of selectedIds) {
                await permanentDeleteMutation.mutateAsync(id);
            }
            setSelectedIds([]);
        } else {
            bulkDeleteMutation.mutate(selectedIds);
        }
    };

    const handleBulkRestore = async () => {
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} clientes da lixeira?`)) return;
        bulkRestoreMutation.mutate(selectedIds);
    };

    const filteredCustomers = (customers || []).filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.legacyBitrixId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container as="main" className="pb-32">
            <header className="mb-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <Breadcrumbs />
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] tracking-tight">
                                Clientes
                            </h1>
                            <Badge variant="neutral" className="h-6 px-2 font-bold opacity-60">
                                {filteredCustomers.length} TOTAL
                            </Badge>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-[var(--radius-xl)] border border-[var(--color-border)]">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-[var(--radius-lg)] transition-all ${viewMode === 'table' ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`p-2 rounded-[var(--radius-lg)] transition-all ${viewMode === 'cards' ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-xl">
                        <Input
                            placeholder="Buscar por nome, telefone ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                            variant="filled"
                            className="h-13"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-[var(--radius-xl)] border border-[var(--color-border)]">
                            <button
                                onClick={() => { setTab('active'); setSelectedIds([]); }}
                                className={`px-5 py-2 rounded-[var(--radius-lg)] text-[10px] font-[var(--font-weight-black)] uppercase tracking-wider transition-all ${tab === 'active' ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                ATIVOS
                            </button>
                            <button
                                onClick={() => { setTab('trash'); setSelectedIds([]); }}
                                className={`px-5 py-2 rounded-[var(--radius-lg)] text-[10px] font-[var(--font-weight-black)] uppercase tracking-wider transition-all flex items-center gap-1.5 ${tab === 'trash' ? 'bg-[var(--color-error)] text-white shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                            >
                                <Trash2 size={12} /> LIXEIRA
                            </button>
                        </div>

                        <Button
                            onClick={() => setSelectedCustomerId('new')}
                            variant="primary"
                            icon={Plus}
                            className="shadow-[var(--shadow-xl)] shadow-[var(--color-accent-primary-alpha)] h-12"
                        >
                            NOVO
                        </Button>
                    </div>
                </div>
            </header>

            {/* Bulk Actions Bar */}
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
                                {selectedIds.length === filteredCustomers.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
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

            {/* Search Bar */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-[32px] pl-16 pr-8 py-5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    />
                    {isFetching && !isLoading && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <RefreshCcw size={16} className="animate-spin text-primary opacity-50" />
                        </div>
                    )}
                </div>
            </div>


            {/* Content */}
            <QueryState
                isLoading={isLoading}
                isEmpty={filteredCustomers.length === 0}
                emptyState={
                    <EmptyState
                        icon={User}
                        title="Nenhum cliente"
                        description={searchTerm ? `Não encontramos clientes para "${searchTerm}". Tente outros termos.` : "Sua lista de clientes está vazia. Comece cadastrando um novo tutor."}
                        action={!searchTerm ? {
                            label: "CRIAR PRIMEIRO CLIENTE",
                            onClick: () => setSelectedCustomerId('new'),
                            icon: Plus
                        } : undefined}
                    />
                }
            >
                {viewMode === 'table' ? (
                    <div className="bg-[var(--color-bg-surface)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--color-bg-tertiary)]/50 text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)] w-12 text-center">
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] transition-colors"
                                        >
                                            <div className={`w-5 h-5 rounded-[var(--radius-md)] border-2 flex items-center justify-center transition-all ${selectedIds.length > 0 ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]' : 'border-[var(--color-border-opaque)]'}`}>
                                                {selectedIds.length > 0 && <CheckSquare size={14} className="text-white" strokeWidth={3} />}
                                            </div>
                                        </button>
                                    </th>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)]">NOME / IDENTIFICAÇÃO</th>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)]">CONTATO</th>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)] text-center">TIPO</th>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)] text-center">ATIVIDADE</th>
                                    <th className="px-[var(--space-6)] py-[var(--space-4)] text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCustomers.map(customer => (
                                    <tr
                                        key={customer.id}
                                        className={`hover:bg-gray-50/50 transition-all group cursor-pointer ${selectedIds.includes(customer.id) ? 'bg-primary/5' : ''}`}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                    >
                                        <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                            {(isBulkMode || selectedIds.includes(customer.id)) && (
                                                <button
                                                    onClick={(e) => toggleSelect(customer.id, e)}
                                                    className={`transition-all ${selectedIds.includes(customer.id) ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'}`}
                                                >
                                                    {selectedIds.includes(customer.id) ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black text-secondary uppercase tracking-tighter text-lg">{customer.name}</span>
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                        CL-{String((customer.user.staffId ?? customer.user.seqId) || 1000).padStart(4, '0')}
                                                    </span>
                                                </div>
                                                {customer.pets && customer.pets.length > 0 && (
                                                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-widest">
                                                        {customer._count.pets} Pet{customer._count.pets > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone size={14} />
                                                    <span className="font-bold">{customer.phone || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="font-medium">{customer.user.email || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col gap-2 items-center">
                                                <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${customer.type === 'RECORRENTE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {customer.type === 'RECORRENTE' ? (
                                                        <span className="flex items-center gap-1">
                                                            <Star size={12} className="fill-current" />
                                                            VIP
                                                        </span>
                                                    ) : 'AVULSO'}
                                                </span>
                                                {customer.recurrenceDiscount && customer.recurrenceDiscount > 0 && (
                                                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        {customer.recurrenceDiscount}% OFF
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        <Calendar size={12} className="inline mr-1" />
                                                        {customer._count.appointments}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {customer._count.quotes} orç.
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedCustomerId(customer.id)}
                                                    className="p-2 bg-gray-50 hover:bg-gray-100 text-secondary rounded-xl transition-all"
                                                    title="Ver Detalhes"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="w-full">
                        <VirtualList
                            items={filteredCustomers}
                            estimateSize={180}
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[var(--space-4)]"
                            renderItem={(customer) => (
                                <Card
                                    onClick={() => setSelectedCustomerId(customer.id)}
                                    className={`group transition-all hover:border-[var(--color-accent-primary)]/30 ${selectedIds.includes(customer.id) ? 'ring-2 ring-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/50' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] group-hover:bg-[var(--color-accent-primary)]/10 group-hover:text-[var(--color-accent-primary)] transition-all">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-[var(--font-weight-black)] text-[var(--color-text-primary)] text-base tracking-tight leading-tight group-hover:text-[var(--color-accent-primary)] transition-colors">{customer.name}</h3>
                                                <p className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-widest mt-0.5">
                                                    CL-{String((customer.user.staffId ?? customer.user.seqId) || 1000).padStart(4, '0')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                            {(isBulkMode || selectedIds.includes(customer.id)) ? (
                                                <button
                                                    onClick={(e) => toggleSelect(customer.id, e)}
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(customer.id) ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]' : 'border-[var(--color-border-opaque)]'}`}
                                                >
                                                    {selectedIds.includes(customer.id) && <CheckSquare size={14} className="text-white" strokeWidth={3} />}
                                                </button>
                                            ) : (
                                                <IconButton
                                                    icon={MoreHorizontal}
                                                    aria-label="Ver Menu"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        {customer.phone && (
                                            <div className="flex items-center gap-2.5 text-[var(--font-size-sm)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)]">
                                                <Phone size={14} className="text-[var(--color-text-tertiary)] opacity-60" />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-start gap-2.5 text-[var(--font-size-xs)] text-[var(--color-text-tertiary)] font-[var(--font-weight-medium)]">
                                                <MapPin size={14} className="text-[var(--color-text-tertiary)] opacity-60 mt-0.5 shrink-0" />
                                                <span className="line-clamp-1">{customer.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]/50">
                                        <Badge variant={customer.type === 'RECORRENTE' ? 'default' : 'neutral'} className="px-2 py-0.5 font-[var(--font-weight-black)]">
                                            {customer.type === 'RECORRENTE' ? 'VIP' : 'AVULSO'}
                                        </Badge>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[var(--font-size-xs)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">{customer._count.appointments}</span>
                                                <span className="text-[9px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-tighter">AGENTES</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[var(--font-size-xs)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">{customer._count.pets}</span>
                                                <span className="text-[9px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-tighter">PETS</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        />
                    </div>
                )}
            </QueryState>

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
                                {tab === 'trash' ? (
                                    <>
                                        <Button
                                            onClick={handleBulkRestore}
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

            {/* Customer Detail Modal */}
            <AnimatePresence>
                {selectedCustomerId && (
                    <CustomerDetailsModal
                        isOpen={!!selectedCustomerId}
                        onClose={() => setSelectedCustomerId(null)}
                        customerId={selectedCustomerId}
                        onUpdate={() => {
                            setSelectedCustomerId(null);
                            queryClient.invalidateQueries({ queryKey: ['customers'] });
                        }}
                    />
                )}
            </AnimatePresence>
        </Container>
    );
}
