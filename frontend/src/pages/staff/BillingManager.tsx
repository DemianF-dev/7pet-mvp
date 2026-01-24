import { useState, useEffect } from 'react';
import {
    Search,
    CheckCircle,
    FileText,
    DollarSign,
    MoreVertical,
    Calendar,
    X,
    Filter,
    RefreshCw,
    ArrowUpDown,
    AlertCircle,
    Copy,
    Trash2
} from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import PaymentReceiptModal from '../../components/PaymentReceiptModal';
import InvoiceDetailsModal from '../../components/staff/InvoiceDetailsModal';

interface Invoice {
    id: string;
    customerId: string;
    customer: { name: string; balance?: number };
    amount: number;
    status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'MONITORAR' | 'NEGOCIADO' | 'ENCERRADO' | 'FATURAR';
    dueDate: string;
    createdAt: string;
    quoteId?: string;
    quote?: { seqId: number };
    appointmentId?: string;
    appointment?: { seqId: number };
    paymentRecords: Array<{
        id: string;
        amount: number;
        method: string;
        paidAt: string;
    }>;
}

export default function BillingManager() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchInvoices();

        const handleFocus = () => {
            fetchInvoices();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/invoices');
            setInvoices(response.data);
        } catch (error) {
            console.error('Erro ao buscar faturas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            await api.post('/invoices/sync');
            await fetchInvoices();
        } catch (error) {
            console.error('Erro ao sincronizar:', error);
        } finally {
            setIsLoading(false);
        }
    };








    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredInvoices.map(i => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkPayment = async () => {
        if (selectedIds.length === 0) return;

        const method = window.prompt('Informe a forma de pagamento para este lote (PIX, DINHEIRO, CARTAO_CREDITO):', 'PIX');
        if (!method) return;

        if (!window.confirm(`Deseja marcar como RECEBIDAS as ${selectedIds.length} faturas selecionadas? (Total aproximado: R$ ${filteredInvoices.filter(i => selectedIds.includes(i.id)).reduce((acc, i) => acc + i.amount, 0).toFixed(2)})`)) return;

        try {
            setIsLoading(true);
            await api.post('/invoices/bulk-payments', {
                ids: selectedIds,
                method: method.toUpperCase(),
                settle: true // Force settle for bulk
            });
            alert(`${selectedIds.length} pagamentos processados com sucesso!`);
            setSelectedIds([]);
            fetchInvoices();
        } catch (error) {
            console.error('Erro no pagamento em massa:', error);
            alert('Erro ao processar pagamentos em massa');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (invoiceId: string) => {
        if (!window.confirm('ATENÇÃO: Deseja realmente excluir esta fatura/orçamento?\n\nNota: Só é possível excluir faturas sem pagamentos registrados.')) return;

        try {
            await api.delete(`/invoices/${invoiceId}`);
            await fetchInvoices();
            setSelectedInvoice(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir fatura');
        }
    };

    const handleDuplicate = async (invoiceId: string) => {
        if (!window.confirm('Deseja duplicar esta fatura/orçamento?\n\nA nova fatura terá vencimento em +30 dias.')) return;

        try {
            await api.post(`/invoices/${invoiceId}/duplicate`);
            await fetchInvoices();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao duplicar fatura');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja excluir ${selectedIds.length} fatura(s)?\n\nNota: Só serão excluídas faturas sem pagamentos registrados.`)) return;

        try {
            const results = await Promise.allSettled(
                selectedIds.map(id => api.delete(`/invoices/${id}`))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                alert(`${succeeded} fatura(s) excluída(s) com sucesso.\n${failed} fatura(s) não puderam ser excluídas (possuem pagamentos).`);
            } else {
                alert(`${succeeded} fatura(s) excluída(s) com sucesso!`);
            }

            await fetchInvoices();
            setSelectedIds([]);
        } catch (error: any) {
            alert('Erro ao excluir faturas em massa');
        }
    };

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredInvoices = Array.isArray(invoices) ? invoices.filter(i => {
        const matchesSearch = i.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;

        const invoiceDate = i.dueDate.substring(0, 7); // YYYY-MM
        const matchesDate = !monthFilter || invoiceDate === monthFilter;

        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        const aValue = sortConfig.key === 'amount' ? a.amount :
            sortConfig.key === 'paid' ? (Array.isArray(a.paymentRecords) ? a.paymentRecords.reduce((acc, p) => acc + p.amount, 0) : 0) :
                sortConfig.key === 'dueDate' ? new Date(a.dueDate).getTime() :
                    0;

        const bValue = sortConfig.key === 'amount' ? b.amount :
            sortConfig.key === 'paid' ? (Array.isArray(b.paymentRecords) ? b.paymentRecords.reduce((acc, p) => acc + p.amount, 0) : 0) :
                sortConfig.key === 'dueDate' ? new Date(b.dueDate).getTime() :
                    0;

        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }) : [];

    const totalAmount = filteredInvoices.reduce((acc, i) => acc + i.amount, 0);
    const totalReceived = filteredInvoices.reduce((acc, i) => acc + (Array.isArray(i.paymentRecords) ? i.paymentRecords.reduce((pAcc, p) => pAcc + p.amount, 0) : 0), 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGO': return 'bg-green-100 text-green-700';
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-700 font-black';
            case 'VENCIDO': return 'bg-red-100 text-red-700 font-extrabold ring-1 ring-red-200';
            case 'ATRASADO': return 'bg-red-100 text-red-700 font-extrabold ring-1 ring-red-200'; // Mapping VENCIDO
            case 'MONITORAR': return 'bg-blue-100 text-blue-700';
            case 'NEGOCIADO': return 'bg-purple-100 text-purple-700';
            case 'ENCERRADO': return 'bg-gray-200 text-gray-600';
            case 'RECEBIDO': return 'bg-green-100 text-green-700 px-3 py-1.5';
            case 'FATURAR': return 'bg-orange-100 text-orange-700 font-black ring-1 ring-orange-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };



    return (
        <main className="p-6 md:p-10">
            <header className="mb-10">
                <Breadcrumbs />
                <BackButton className="mb-4 ml-[-1rem]" />
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Gestão <span className="text-primary">Financeira</span></h1>
                        <p className="text-gray-500">Controle detalhado de orçamentos e recebimentos.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleRefresh()}
                            className="bg-primary/10 text-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                            <span>Sincronizar</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-xl pl-12 pr-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="bg-white rounded-xl px-3 flex items-center shadow-sm">
                        <Filter size={18} className="text-gray-400 mr-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-secondary focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="PENDENTE">Pendente</option>
                            <option value="PAGO">Pago</option>
                            <option value="VENCIDO">Vencido</option>
                            <option value="MONITORAR">Monitorar</option>
                            <option value="NEGOCIADO">Negociado</option>
                            <option value="ENCERRADO">Encerrado</option>
                            <option value="FATURAR">Faturar</option>
                        </select>
                    </div>
                    <div className="bg-white rounded-xl px-3 flex items-center shadow-sm">
                        <Calendar size={18} className="text-gray-400 mr-2" />
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium text-secondary focus:ring-0 cursor-pointer outline-none"
                        />
                    </div>
                    <button
                        onClick={() => { setStatusFilter('ALL'); setMonthFilter(''); setSearchTerm(''); }}
                        className="bg-white p-3 rounded-xl shadow-sm text-gray-400 hover:text-red-500 transition-colors"
                        title="Limpar Filtros"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Bulk Action Bar */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-secondary text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 min-w-[500px]"
                        >
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                                    {selectedIds.length}
                                </span>
                                <p className="text-sm font-bold">Faturas Selecionadas</p>
                            </div>
                            <div className="h-6 w-px bg-white/10"></div>
                            <button
                                onClick={handleBulkPayment}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <DollarSign size={16} /> RECEBER EM MASSA
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <Trash2 size={16} /> EXCLUIR EM MASSA
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-white/50 hover:text-white text-xs font-bold"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4">Cliente / Orçamento</th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort('dueDate')}
                            >
                                <div className="flex items-center gap-1 text-gray-400">Vencimento <ArrowUpDown size={14} /></div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort('amount')}
                            >
                                <div className="flex items-center gap-1 text-gray-400">Valor Total <ArrowUpDown size={14} /></div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                onClick={() => handleSort('paid')}
                            >
                                <div className="flex items-center gap-1 text-gray-400">Recebido <ArrowUpDown size={14} /></div>
                            </th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </td>
                            </tr>
                        ) : filteredInvoices.map(invoice => {
                            const paid = Array.isArray(invoice.paymentRecords) ? invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0) : 0;
                            const isSelected = selectedIds.includes(invoice.id);
                            return (
                                <tr
                                    key={invoice.id}
                                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-primary/[0.02]' : ''}`}
                                    onClick={() => setSelectedInvoiceId(invoice.id)}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => toggleSelect(e as any, invoice.id)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-secondary uppercase text-[13px]">{invoice.customer.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-bold text-gray-400">Ref: {invoice.quoteId ? 'Orçamento' : 'Serviço'}</p>
                                                    {invoice.quote?.seqId && (
                                                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                            OR-{String(invoice.quote.seqId).padStart(4, '0')}
                                                        </span>
                                                    )}
                                                    {invoice.appointment?.seqId && (
                                                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                            AG-{String(invoice.appointment.seqId).padStart(4, '0')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className={`text-xs font-bold ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAGO' ? 'text-red-500' : 'text-gray-500'}`}>
                                            {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 font-black text-secondary">
                                        R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-600">
                                        R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(invoice.status)}`}>
                                            {invoice.status === 'PAGO' ? 'RECEBIDO' : invoice.status === 'VENCIDO' ? 'ATRASADO' : invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedInvoiceId(invoice.id);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Ver Detalhes"
                                            >
                                                <MoreVertical size={16} className="text-gray-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                        <tr>
                            <td colSpan={3} className="px-6 py-6 text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Totais na Tela:</td>
                            <td className="px-6 py-6 font-black text-secondary text-base">
                                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-6 font-black text-green-600 text-base">
                                R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedInvoiceId && (
                    <InvoiceDetailsModal
                        invoiceId={selectedInvoiceId}
                        onClose={() => setSelectedInvoiceId(null)}
                        onUpdate={fetchInvoices}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
