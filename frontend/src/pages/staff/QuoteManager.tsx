import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    CheckSquare,
    Square,
    RefreshCcw,
    Archive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

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
    items: QuoteItem[];
    petId?: string;
    pet?: { name: string };
    desiredAt?: string;
    type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
    transportOrigin?: string;
    transportDestination?: string;
    transportReturnAddress?: string;
    transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
}

export default function QuoteManager() {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'active' | 'trash' | 'history'>('active');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir PERMANENTEMENTE os ${selectedIds.length} orçamentos selecionados?`)) return;
        try {
            await api.post('/quotes/bulk-delete', { ids: selectedIds });
            fetchQuotes();
            setSelectedIds([]);
        } catch (error) {
            alert('Erro ao excluir orçamentos');
        }
    };

    const handleDuplicate = async (id: string) => {
        if (!confirm('Deseja duplicar este orçamento?')) return;
        try {
            await api.post(`/quotes/${id}/duplicate`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao duplicar:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Mover orçamento para a lixeira?')) return;
        try {
            await api.delete(`/quotes/${id}`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm('EXCLUIR PERMANENTEMENTE? Esta ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/quotes/${id}/permanent`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao excluir permanentemente:', error);
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SOLICITADO': return 'bg-blue-100 text-blue-700';
            case 'EM_PRODUCAO': return 'bg-yellow-100 text-yellow-700';
            case 'CALCULADO': return 'bg-emerald-100 text-emerald-700';
            case 'ENVIADO': return 'bg-purple-100 text-purple-700';
            case 'APROVADO': return 'bg-green-100 text-green-700';
            case 'REJEITADO': return 'bg-red-100 text-red-700';
            case 'AGENDAR': return 'bg-indigo-100 text-indigo-700';
            case 'AGENDADO': return 'bg-teal-100 text-teal-700';
            case 'ENCERRADO': return 'bg-gray-200 text-gray-500 line-through';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

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
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 min-w-[400px]"
                        >
                            <p className="text-sm font-bold flex items-center gap-2">
                                <span className="bg-primary px-3 py-1 rounded-full text-xs font-black">{selectedIds.length}</span>
                                Selecionados
                            </p>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="flex items-center gap-4 ml-auto">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-xs font-bold hover:text-gray-300 transition-colors uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl transition-all shadow-lg"
                                >
                                    <Trash2 size={20} />
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
                                    <button
                                        onClick={() => setSelectedIds(selectedIds.length === filteredQuotes.length ? [] : filteredQuotes.map(q => q.id))}
                                        className="text-gray-300 hover:text-primary transition-colors"
                                    >
                                        {selectedIds.length > 0 && selectedIds.length === filteredQuotes.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>
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
                            ) : filteredQuotes.map(quote => (
                                <tr key={quote.id} className={`hover:bg-gray-50/50 transition-all group ${selectedIds.includes(quote.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-8 py-6">
                                        <button
                                            onClick={(e) => toggleSelect(quote.id, e)}
                                            className={`transition-all ${selectedIds.includes(quote.id) ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'}`}
                                        >
                                            {selectedIds.includes(quote.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-secondary uppercase tracking-tighter text-lg">{quote.customer.name}</span>
                                            {quote.pet && (
                                                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-widest">
                                                    Pet: {quote.pet.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</span>
                                            {quote.type && (
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${quote.type === 'SPA' ? 'bg-blue-100 text-blue-600' : quote.type === 'TRANSPORTE' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {quote.type.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(quote.status)}`}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-secondary text-lg">
                                        R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {view === 'trash' ? (
                                                <>
                                                    <button onClick={() => api.post(`/quotes/${quote.id}/restore`).then(() => fetchQuotes())} className="p-2 hover:bg-green-50 text-green-500 rounded-xl transition-all" title="Restaurar"><RefreshCcw size={18} /></button>
                                                    <button onClick={() => handlePermanentDelete(quote.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all" title="Excluir Permanente"><Trash2 size={18} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleDuplicate(quote.id)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Duplicar"><Copy size={18} /></button>
                                                    <button onClick={() => handleDelete(quote.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Mover para Lixeira"><Trash2 size={18} /></button>
                                                    <button onClick={() => navigate(`/staff/quotes/${quote.id}`)} className="p-2 bg-gray-50 hover:bg-gray-100 text-secondary rounded-xl transition-all" title="Ver Detalhes"><Edit size={18} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
