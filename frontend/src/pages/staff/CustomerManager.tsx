import { useState } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import toast from 'react-hot-toast';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type: 'AVULSO' | 'RECORRENTE';
    internalNotes?: string;
    recurrenceDiscount?: number;
    user: {
        seqId: number;
        staffId?: number;
        email: string;
    };
    _count: {
        appointments: number;
        quotes: number;
        pets: number;
    };
    pets?: Array<{ name: string }>;
}

type TabType = 'active' | 'trash';

const fetchCustomers = async (tab: TabType): Promise<Customer[]> => {
    const endpoint = tab === 'trash' ? '/customers/trash' : '/customers';
    const response = await api.get(endpoint);
    // Handle both paginated response { data: [...], meta: ... } and direct array
    return Array.isArray(response.data) ? response.data : (response.data.data || []);
};

export default function CustomerManager() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [tab, setTab] = useState<TabType>('active');

    const { data: customers = [], isLoading, isFetching } = useQuery({
        queryKey: ['customers', tab],
        queryFn: () => fetchCustomers(tab),
        staleTime: 5 * 60 * 1000,
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.post('/customers/bulk-delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setSelectedIds([]);
            setIsBulkMode(false);
            toast.success('Clientes movidos para a lixeira');
        }
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/customers/${id}/permanent`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente excluído permanentemente');
        }
    });

    const bulkRestoreMutation = useMutation({
        mutationFn: (ids: string[]) => api.post('/customers/bulk-restore', { ids }),
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

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                                <div className="h-[2px] w-6 bg-primary"></div>
                                GESTÃO DE CLIENTES
                            </div>
                            <h1 className="text-4xl font-black text-secondary tracking-tight">
                                Clientes
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Tabs Active/Trash */}
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                <button
                                    onClick={() => { setTab('active'); setSelectedIds([]); }}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'active' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => { setTab('trash'); setSelectedIds([]); }}
                                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab === 'trash' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    <Trash2 size={14} /> Lixeira
                                </button>
                            </div>

                            {/* View Toggle */}
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                    title="Visualização em Lista"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                    title="Visualização em Cards"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsBulkMode(!isBulkMode)}
                                className={`flex items-center gap-2 px-6 py-6 rounded-[32px] text-[10px] font-black transition-all ${isBulkMode ? 'bg-secondary text-white shadow-xl' : 'bg-white text-gray-400 hover:text-secondary shadow-sm'}`}
                            >
                                <CheckSquare size={14} strokeWidth={isBulkMode ? 3 : 2} />
                                <span className="uppercase tracking-[0.15em]">{isBulkMode ? 'Sair da Seleção' : 'Ações em Massa'}</span>
                            </button>

                            {tab === 'active' && (
                                <button
                                    onClick={() => setSelectedCustomerId('new')}
                                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-8 py-6 rounded-[32px] text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    Novo Cliente
                                </button>
                            )}
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
                {viewMode === 'table' ? (
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
                                                {selectedIds.length > 0 && selectedIds.length === filteredCustomers.length ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                            </button>
                                        )}
                                    </th>
                                    <th className="px-8 py-6">Cliente</th>
                                    <th className="px-8 py-6">Contato</th>
                                    <th className="px-8 py-6 text-center">Tipo / Status</th>
                                    <th className="px-8 py-6 text-center">Histórico</th>
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
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-32 text-center">
                                            <div className="bg-gray-50 rounded-[40px] p-20 border-2 border-dashed border-gray-100">
                                                <User className="mx-auto text-gray-200 mb-4" size={64} />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum cliente encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.map(customer => (
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center">
                                <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                                <User className="mx-auto text-gray-200 mb-4" size={64} />
                                <p className="text-gray-400 font-bold">Nenhum cliente encontrado.</p>
                            </div>
                        ) : filteredCustomers.map(customer => (
                            <motion.div
                                layout
                                key={customer.id}
                                onClick={() => setSelectedCustomerId(customer.id)}
                                className={`group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all relative overflow-hidden cursor-pointer ${selectedIds.includes(customer.id) ? 'ring-2 ring-primary' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-secondary text-lg mb-1">{customer.name}</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                ID-{String(customer.user.seqId || 0).padStart(4, '0')}
                                            </p>
                                        </div>
                                    </div>
                                    {(isBulkMode || selectedIds.includes(customer.id)) && (
                                        <button
                                            onClick={(e) => toggleSelect(customer.id, e)}
                                            className={`transition-all ${selectedIds.includes(customer.id) ? 'text-primary' : 'text-gray-200'}`}
                                        >
                                            {selectedIds.includes(customer.id) ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3 mb-6">
                                    {customer.phone && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Phone size={16} className="text-gray-400" />
                                            <span className="font-bold">{customer.phone}</span>
                                        </div>
                                    )}
                                    {customer.user.email && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <span className="text-xs font-medium">{customer.user.email}</span>
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div className="flex items-start gap-3 text-sm text-gray-600">
                                            <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                            <span className="text-xs font-medium line-clamp-2">{customer.address}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${customer.type === 'RECORRENTE' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {customer.type === 'RECORRENTE' ? '⭐ VIP' : 'AVULSO'}
                                    </span>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <span className="font-bold">{customer._count.appointments} agend.</span>
                                        <span className="font-bold">{customer._count.quotes} orç.</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

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
                                    className="bg-white/10 hover:bg-white/20 text-[10px] font-black px-5 py-2 rounded-xl transition-all uppercase tracking-widest"
                                >
                                    {selectedIds.length === filteredCustomers.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
                                </button>
                                <p className="text-sm font-black flex items-center gap-3 border-l border-white/10 pl-4">
                                    <span className="bg-purple-600 px-4 py-1.5 rounded-full text-xs font-black shadow-lg">{selectedIds.length}</span>
                                    selecionados
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
                                {tab === 'trash' ? (
                                    <>
                                        <button
                                            onClick={handleBulkRestore}
                                            disabled={selectedIds.length === 0}
                                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <RefreshCcw size={18} /> Restaurar
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={selectedIds.length === 0}
                                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={18} /> Excluir Permanente
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedIds.length === 0}
                                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <Trash2 size={18} /> Mover para Lixeira
                                    </button>
                                )}
                            </div>
                        </motion.div>
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
            </main>
        </div>
    );
}
