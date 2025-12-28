import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    RefreshCcw,
    CalendarPlus,
    XCircle,
    MessageCircle,
    Printer,
    ChevronUp,
    ChevronDown,
    Trash,
    User,
    Plus,
    CheckCircle2,
    Archive
} from 'lucide-react';
import { motion } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';

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
}

interface Customer {
    id: string;
    name: string;
    pets: { id: string; name: string }[];
}

export default function QuoteManager() {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [view, setView] = useState<'active' | 'trash' | 'history'>('active');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Quote | 'customer.name'; direction: 'asc' | 'desc' } | null>(null);
    const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

    // Create Mode State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [newQuoteData, setNewQuoteData] = useState<{
        customerId: string;
        petId: string;
        items: { description: string; quantity: number; price: number }[];
    }>({
        customerId: '',
        petId: '',
        items: [{ description: '', quantity: 1, price: 0 }]
    });

    const statuses = ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'ENCERRADO'];

    useEffect(() => {
        fetchQuotes();
        fetchCustomers();
    }, [view]);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    };

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

    const handleRestore = async (id: string) => {
        try {
            await api.post(`/quotes/${id}/restore`);
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao restaurar:', error);
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

    const handleCreateQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/quotes', newQuoteData);
            setIsCreateModalOpen(false);
            setNewQuoteData({ customerId: '', petId: '', items: [{ description: '', quantity: 1, price: 0 }] });
            fetchQuotes();
            alert('Orçamento criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar orçamento:', error);
            alert('Erro ao criar orçamento.');
        }
    };

    const addCreateItem = () => {
        setNewQuoteData({
            ...newQuoteData,
            items: [...newQuoteData.items, { description: '', quantity: 1, price: 0 }]
        });
    };

    const removeCreateItem = (index: number) => {
        const newItems = newQuoteData.items.filter((_, i) => i !== index);
        setNewQuoteData({ ...newQuoteData, items: newItems });
    };

    const updateCreateItem = (index: number, field: string, value: any) => {
        const newItems = [...newQuoteData.items];
        (newItems[index] as any)[field] = value;
        setNewQuoteData({ ...newQuoteData, items: newItems });
    };

    const handleConvertToAppointment = (quote: Quote) => {
        // Navigate to kanban/booking with state
        navigate('/staff/kanban', {
            state: {
                prefill: {
                    customerId: quote.customerId,
                    customerName: quote.customer.name,
                    quoteId: quote.id,
                    petId: quote.petId,
                    serviceIds: quote.items.map(i => i.serviceId).filter(id => !!id),
                    startAt: quote.desiredAt ? new Date(quote.desiredAt).toISOString().slice(0, 16) : ''
                }
            }
        });
    };

    const handleWhatsApp = (quote: Quote) => {
        const url = `https://wa.me/?text=${encodeURIComponent(
            `Olá, ${quote.customer.name}! Aqui está o seu orçamento da 7Pet:\n\n` +
            quote.items.map(i => `- ${i.description}: ${i.quantity}x R$ ${i.price.toFixed(2)}`).join('\n') +
            `\n\nTotal: R$ ${quote.totalAmount.toFixed(2)}\n\nPor favor, retorne para aprovação.`
        )}`;
        window.open(url, '_blank');
    };

    const handlePrint = (quote: Quote) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
            <html>
                <head>
                    <title>Orçamento - 7Pet</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { border-bottom: 2px solid #ed64a6; padding-bottom: 20px; margin-bottom: 20px; }
                        h1 { color: #ed64a6; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
                        .total { text-align: right; font-size: 24px; font-weight: bold; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>7Pet - Orçamento</h1>
                        <p>Cliente: ${quote.customer.name}</p>
                        <p>Data: ${new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd</th>
                                <th>Preço Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quote.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td>${item.quantity}</td>
                                    <td>R$ ${item.price.toFixed(2)}</td>
                                    <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Total: R$ ${quote.totalAmount.toFixed(2)}</div>
                </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const handleUpdateQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedQuote) return;

        try {
            await api.patch(`/quotes/${selectedQuote.id}`, {
                items: selectedQuote.items,
                status: selectedQuote.status,
                totalAmount: selectedQuote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            });
            fetchQuotes();
            setIsEditModalOpen(false);
            setSelectedQuote(null);
        } catch (error) {
            console.error('Erro ao atualizar orçamento:', error);
            alert('Erro ao atualizar orçamento');
        }
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
        if (!selectedQuote) return;
        const newItems = [...selectedQuote.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setSelectedQuote({ ...selectedQuote, items: newItems });
    };

    const addItem = () => {
        if (!selectedQuote) return;
        setSelectedQuote({
            ...selectedQuote,
            items: [...selectedQuote.items, { id: 'temp-' + Date.now(), description: '', quantity: 1, price: 0 }]
        });
    };

    const removeItem = (index: number) => {
        if (!selectedQuote) return;
        const newItems = selectedQuote.items.filter((_, i) => i !== index);
        setSelectedQuote({ ...selectedQuote, items: newItems });
    };

    const handleSort = (key: keyof Quote | 'customer.name') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/quotes/${id}/status`, { status: newStatus });
            fetchQuotes();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };


    const filteredQuotes = quotes
        .filter(q => {
            // View filtering
            if (view === 'active' && q.status === 'ENCERRADO') return false;
            if (view === 'history' && q.status !== 'ENCERRADO') return false;
            // Trash handled by endpoint switch

            const matchesSearch = q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            let aValue: any = a[key as keyof Quote];
            let bValue: any = b[key as keyof Quote];

            if (key === 'customer.name') {
                aValue = a.customer.name;
                bValue = b.customer.name;
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
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
            case 'ENCERRADO': return 'bg-gray-200 text-gray-500 line-through';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Gestão de <span className="text-primary">Orçamentos</span></h1>
                        <p className="text-gray-500">Analise solicitações, defina preços e envie para aprovação.</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-3 ml-auto mr-4 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                        Criar Orçamento
                    </button>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'active' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'history' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Archive size={16} /> Histórico
                        </button>
                        <button
                            onClick={() => setView('trash')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'trash' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Trash2 size={16} /> Lixeira
                        </button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center px-4 border-r border-gray-100 bg-gray-50/50">
                            <Filter size={18} className="text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none py-4 px-4 text-sm font-bold text-secondary focus:ring-0 min-w-[150px]"
                        >
                            <option value="ALL">Todos os Status</option>
                            {statuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('customer.name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Cliente
                                        {sortConfig?.key === 'customer.name' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        Data
                                        {sortConfig?.key === 'createdAt' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        Status
                                        {sortConfig?.key === 'status' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('totalAmount')}
                                >
                                    <div className="flex items-center gap-2">
                                        Total
                                        {sortConfig?.key === 'totalAmount' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredQuotes.map(quote => (
                                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-secondary">{quote.customer.name}</span>
                                            {quote.pet && (
                                                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1">
                                                    Pet: {quote.pet.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">ID: {quote.id.substring(0, 8)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <span>Criado: {new Date(quote.createdAt).toLocaleDateString('pt-BR')}</span>
                                            {quote.desiredAt && (
                                                <span className="text-xs text-orange-600 font-bold">
                                                    Para: {new Date(quote.desiredAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {openStatusMenu === quote.id && view === 'active' ? (
                                                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                    {statuses.map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateStatus(quote.id, s);
                                                                setOpenStatusMenu(null);
                                                            }}
                                                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border-2 ${quote.status === s ? getStatusColor(s) + ' border-current' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(null); }}
                                                        className="p-1 text-gray-300 hover:text-gray-500"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(quote.id); }}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-2 hover:ring-2 hover:ring-offset-2 hover:ring-primary/20 ${getStatusColor(quote.status)}`}
                                                >
                                                    {quote.status}
                                                    {view === 'active' && <Edit size={12} className="opacity-50" />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-secondary">
                                        R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {view === 'active' ? (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedQuote(quote); setIsEditModalOpen(true); }}
                                                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                                        title="Editar / Precificar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(quote.id)}
                                                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                        title="Duplicar Orçamento"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    {quote.status === 'APROVADO' && (
                                                        <button
                                                            onClick={() => handleConvertToAppointment(quote)}
                                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                                                            title="Criar Agendamento"
                                                        >
                                                            <CalendarPlus size={18} />
                                                        </button>
                                                    )}
                                                    {['CALCULADO', 'ENVIADO', 'APROVADO', 'AGENDAR'].includes(quote.status) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleWhatsApp(quote)}
                                                                className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                                                title="Enviar WhatsApp"
                                                            >
                                                                <MessageCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePrint(quote)}
                                                                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                                                                title="Imprimir"
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(quote.id)}
                                                        className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                                                        title="Mover para Lixeira"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleRestore(quote.id)}
                                                        className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                                        title="Restaurar"
                                                    >
                                                        <RefreshCcw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(quote.id)}
                                                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                                        title="Excluir Permanentemente"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                {isEditModalOpen && selectedQuote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-2xl relative z-10 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
                                <Edit className="text-primary" />
                                Precificação: {selectedQuote.customer.name}
                            </h2>

                            <form onSubmit={handleUpdateQuote} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Status do Orçamento</label>
                                        <select
                                            value={selectedQuote.status}
                                            onChange={(e) => setSelectedQuote({ ...selectedQuote, status: e.target.value })}
                                            className="input-field py-2"
                                        >
                                            {statuses.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Cliente</label>
                                        <input value={selectedQuote.customer.name} disabled className="input-field py-2 bg-gray-50 opacity-60" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Pet Solicitado</label>
                                        <input
                                            value={selectedQuote.pet?.name || 'Não informado'}
                                            disabled
                                            className="input-field py-2 bg-gray-50 opacity-60"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Data Desejada</label>
                                        <input
                                            value={selectedQuote.desiredAt ? new Date(selectedQuote.desiredAt).toLocaleDateString('pt-BR') : 'Sem data'}
                                            disabled
                                            className="input-field py-2 bg-gray-50 opacity-60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {selectedQuote.items.map((item, index) => (
                                        <div key={item.id} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl relative group">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                                                <input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    className="input-field py-2"
                                                    required
                                                />
                                            </div>
                                            <div className="w-20 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Qtd</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                    className="input-field py-2"
                                                    required
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Preço Unit.</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                                                        className="input-field py-2 pl-9"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="mt-8 p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-primary font-bold text-sm flex items-center gap-2 hover:underline"
                                >
                                    + Adicionar Item
                                </button>

                                <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-400">Total calculado:</p>
                                        <p className="text-3xl font-bold text-secondary">
                                            R$ {selectedQuote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancelar</button>
                                        <button type="submit" className="btn-primary">Salvar Orçamento</button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Create Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-2xl relative z-10 shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
                                <Plus className="text-primary" />
                                Novo Orçamento
                            </h2>

                            <form onSubmit={handleCreateQuote} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Cliente</label>
                                        <select
                                            value={newQuoteData.customerId}
                                            onChange={(e) => setNewQuoteData({ ...newQuoteData, customerId: e.target.value, petId: '' })}
                                            className="input-field py-2"
                                            required
                                        >
                                            <option value="">Selecione um cliente...</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Pet</label>
                                        <select
                                            value={newQuoteData.petId}
                                            onChange={(e) => setNewQuoteData({ ...newQuoteData, petId: e.target.value })}
                                            className="input-field py-2"
                                            disabled={!newQuoteData.customerId}
                                        >
                                            <option value="">Selecione um pet (opcional)...</option>
                                            {customers.find(c => c.id === newQuoteData.customerId)?.pets.map(pet => (
                                                <option key={pet.id} value={pet.id}>{pet.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                    {newQuoteData.items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl relative group">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                                                <input
                                                    value={item.description}
                                                    onChange={(e) => updateCreateItem(index, 'description', e.target.value)}
                                                    className="input-field py-2"
                                                    required
                                                    placeholder="Ex: Banho completo"
                                                />
                                            </div>
                                            <div className="w-20 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Qtd</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateCreateItem(index, 'quantity', parseInt(e.target.value))}
                                                    className="input-field py-2"
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase">Preço Unit.</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => updateCreateItem(index, 'price', parseFloat(e.target.value))}
                                                        className="input-field py-2 pl-9"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            {newQuoteData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCreateItem(index)}
                                                    className="mt-8 p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={addCreateItem}
                                    className="text-primary font-bold text-sm flex items-center gap-2 hover:underline"
                                >
                                    + Adicionar Item
                                </button>

                                <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-400">Total calculado:</p>
                                        <p className="text-3xl font-bold text-secondary">
                                            R$ {newQuoteData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                                        <button type="submit" className="btn-primary">Criar Orçamento</button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
