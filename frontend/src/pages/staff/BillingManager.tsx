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
    AlertCircle
} from 'lucide-react';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';

interface Invoice {
    id: string;
    customerId: string;
    customer: { name: string; balance?: number };
    amount: number;
    status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'MONITORAR' | 'NEGOCIADO' | 'ENCERRADO';
    dueDate: string;
    createdAt: string;
    quoteId?: string;
    payments: Array<{
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
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    // Payment Form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [paymentBank, setPaymentBank] = useState('');

    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });

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

    const handleUpdateStatus = async (status: string) => {
        if (!selectedInvoice) return;

        // Block manual update to PAGO
        if (status === 'PAGO') {
            alert('Atenção: Para marcar como RECEBIDO, você deve registrar o pagamento no formulário ao lado.\n\nO sistema atualizará o status automaticamente quando o valor for integralizado.');
            return;
        }

        try {
            await api.patch(`/invoices/${selectedInvoice.id}/status`, { status });
            // Update local state
            setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...i, status: status as any } : i));
            setSelectedInvoice({ ...selectedInvoice, status: status as any });
            alert(`Status atualizado para ${status}`);
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        try {
            // Start - Custom logic to read checkbox manually since not in state
            const form = e.target as HTMLFormElement;
            const settleCheckbox = form.elements.namedItem('settle') as HTMLInputElement;
            const useBalanceCheckbox = form.elements.namedItem('useBalance') as HTMLInputElement;
            const settle = settleCheckbox ? settleCheckbox.checked : false;
            const useBalance = useBalanceCheckbox ? useBalanceCheckbox.checked : false;

            await api.post(`/invoices/${selectedInvoice.id}/payments`, {
                amount: parseFloat(paymentAmount || '0'),
                method: paymentMethod,
                bank: paymentBank,
                settle: settle,
                useBalance: useBalance
            });
            alert('Pagamento registrado com sucesso!');
            setPaymentAmount('');
            fetchInvoices();
            setSelectedInvoice(null);
        } catch (error) {
            alert('Erro ao registrar pagamento');
        }
    };



    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredInvoices = invoices.filter(i => {
        const matchesSearch = i.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;

        const invoiceDate = i.dueDate.substring(0, 7); // YYYY-MM
        const matchesDate = !monthFilter || invoiceDate === monthFilter;

        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        const aValue = sortConfig.key === 'amount' ? a.amount :
            sortConfig.key === 'paid' ? a.payments.reduce((acc, p) => acc + p.amount, 0) :
                sortConfig.key === 'dueDate' ? new Date(a.dueDate).getTime() :
                    0;

        const bValue = sortConfig.key === 'amount' ? b.amount :
            sortConfig.key === 'paid' ? b.payments.reduce((acc, p) => acc + p.amount, 0) :
                sortConfig.key === 'dueDate' ? new Date(b.dueDate).getTime() :
                    0;

        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    const totalAmount = filteredInvoices.reduce((acc, i) => acc + i.amount, 0);
    const totalReceived = filteredInvoices.reduce((acc, i) => acc + i.payments.reduce((pAcc, p) => pAcc + p.amount, 0), 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGO': return 'bg-green-100 text-green-700';
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-700';
            case 'VENCIDO': return 'bg-red-100 text-red-700';
            case 'ATRASADO': return 'bg-red-100 text-red-700'; // Mapping VENCIDO
            case 'MONITORAR': return 'bg-blue-100 text-blue-700';
            case 'NEGOCIADO': return 'bg-purple-100 text-purple-700';
            case 'ENCERRADO': return 'bg-gray-200 text-gray-600';
            case 'RECEBIDO': return 'bg-green-100 text-green-700'; // Mapping PAGO
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Calculate totals
    // Calculate totals for modal
    const totalReceivedModal = selectedInvoice?.payments.reduce((acc, p) => acc + p.amount, 0) || 0;
    const remaining = selectedInvoice ? selectedInvoice.amount - totalReceivedModal : 0;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">Gestão <span className="text-primary">Financeira</span></h1>
                            <p className="text-gray-500">Controle detalhado de orçamentos e recebimentos.</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="btn-secondary flex items-center gap-2 hover:bg-gray-100 transition-colors"
                            disabled={isLoading}
                        >
                            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                            <span>Atualizar Dados</span>
                        </button>
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

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Cliente / Orçamento</th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('dueDate')}
                                >
                                    <div className="flex items-center gap-1">Vencimento <ArrowUpDown size={14} /></div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center gap-1">Valor Total <ArrowUpDown size={14} /></div>
                                </th>
                                <th
                                    className="px-6 py-4 font-bold cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('paid')}
                                >
                                    <div className="flex items-center gap-1">Recebido <ArrowUpDown size={14} /></div>
                                </th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredInvoices.map(invoice => {
                                const paid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
                                return (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-secondary">{invoice.customer.name}</p>
                                                    <p className="text-xs text-gray-400">Ref: {invoice.quoteId ? 'Orçamento' : 'Serviço'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-secondary">
                                            R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-600">
                                            R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-primary">
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-100">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-500 uppercase text-xs">Totais na Tela:</td>
                                <td className="px-6 py-4 font-bold text-secondary text-lg">
                                    R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 font-bold text-green-600 text-lg">
                                    R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {selectedInvoice && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}></div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl w-full max-w-4xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-secondary mb-1">Detalhes Financeiros</h2>
                                        <p className="text-gray-500">Gerencie o status e pagamentos deste registro.</p>
                                    </div>
                                    <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={24} className="text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Left Column: Info & Status */}
                                    <div className="col-span-2 space-y-8">
                                        {/* Status Cards */}
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { label: 'APROVADO / PENDENTE', value: 'PENDENTE', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                                { label: 'MONITORAR', value: 'MONITORAR', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                                { label: 'RECEBIDO', value: 'PAGO', color: 'bg-green-100 text-green-700 border-green-200' },
                                                { label: 'ATRASADO', value: 'VENCIDO', color: 'bg-red-100 text-red-700 border-red-200' },
                                                { label: 'NEGOCIADO', value: 'NEGOCIADO', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                                                { label: 'ENCERRADO', value: 'ENCERRADO', color: 'bg-gray-100 text-gray-600 border-gray-200' },
                                            ].map((status) => (
                                                <button
                                                    key={status.value}
                                                    onClick={() => handleUpdateStatus(status.value)}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedInvoice.status === status.value ? status.color : 'border-gray-100 hover:border-gray-200 text-gray-400'}`}
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Definir como</span>
                                                    <span className="font-bold text-sm">{status.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="bg-gray-50 rounded-2xl p-6 grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Cliente</label>
                                                <p className="font-bold text-secondary text-lg">{selectedInvoice.customer.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Data Vencimento</label>
                                                <div className="flex items-center gap-2 text-secondary">
                                                    <Calendar size={18} />
                                                    <span className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor Total</label>
                                                <p className="font-bold text-secondary text-2xl">
                                                    R$ {selectedInvoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Restante a Receber</label>
                                                <p className={`font-bold text-2xl ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment History */}
                                        <div>
                                            <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                                                <CheckCircle size={18} className="text-primary" /> Histórico de Recebimentos
                                            </h3>
                                            {selectedInvoice.payments.length === 0 ? (
                                                <p className="text-gray-400 text-sm italic">Nenhum pagamento registrado.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {selectedInvoice.payments.map(payment => (
                                                        <div key={payment.id} className="bg-white border border-gray-100 p-4 rounded-xl flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-secondary">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                <p className="text-xs text-gray-400">{new Date(payment.paidAt).toLocaleDateString()} - {payment.method}</p>
                                                            </div>
                                                            <div className="bg-green-100 text-green-700 p-2 rounded-full">
                                                                <CheckCircle size={16} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Actions */}
                                    <div className="space-y-6">
                                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                            <h3 className="font-bold text-secondary mb-4">Registrar Pagamento</h3>
                                            <form onSubmit={handleRegisterPayment} className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor Recebido</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={paymentAmount}
                                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                                            className="input-field pl-10"
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Forma de Pagamento</label>
                                                    <select
                                                        value={paymentMethod}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="input-field"
                                                    >
                                                        <option value="PIX">PIX</option>
                                                        <option value="DINHEIRO">Dinheiro</option>
                                                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                                        <option value="CARTAO_DEBITO">Cartão de Débito</option>
                                                        <option value="BOLETO">Boleto</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Banco / Destino</label>
                                                    <input
                                                        type="text"
                                                        value={paymentBank}
                                                        onChange={(e) => setPaymentBank(e.target.value)}
                                                        className="input-field"
                                                        placeholder="Ex: Inter, Nubank, Caixa..."
                                                    />
                                                </div>

                                                {/* Credit/Debt Warning */}
                                                {paymentAmount && remaining - parseFloat(paymentAmount) < 0 && (
                                                    <div className="bg-green-100 p-3 rounded-xl border border-green-200">
                                                        <p className="text-xs text-green-700 font-bold">
                                                            Troco/Crédito: R$ {Math.abs(remaining - parseFloat(paymentAmount)).toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] text-green-600 mt-1">Este valor será adicionado como crédito ao cadastro do cliente.</p>
                                                    </div>
                                                )}

                                                {/* Credit/Debt Logic */}
                                                {selectedInvoice.customer.balance && selectedInvoice.customer.balance > 0 && (
                                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-2">
                                                        <div className="flex items-center gap-2 text-green-700 font-bold">
                                                            <DollarSign size={16} />
                                                            <span className="text-sm">Saldo Disponível: R$ {selectedInvoice.customer.balance.toFixed(2)}</span>
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                                            <input type="checkbox" name="useBalance" className="accent-green-600 w-4 h-4" />
                                                            <span className="text-xs text-green-800 font-medium">
                                                                Abater do valor a pagar (Usar Saldo)
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {selectedInvoice.customer.balance && selectedInvoice.customer.balance < 0 && (
                                                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-2">
                                                        <div className="flex items-center gap-2 text-red-700 font-bold">
                                                            <AlertCircle size={16} />
                                                            <span className="text-sm">Débito Anterior: R$ {Math.abs(selectedInvoice.customer.balance).toFixed(2)}</span>
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                                            <input
                                                                type="checkbox"
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        const debit = Math.abs(selectedInvoice.customer.balance || 0);
                                                                        const needed = remaining + debit;
                                                                        setPaymentAmount(needed.toFixed(2));
                                                                    } else {
                                                                        setPaymentAmount(''); // Reset or keep existing logic
                                                                    }
                                                                }}
                                                                className="accent-red-600 w-4 h-4"
                                                            />
                                                            <span className="text-xs text-red-800 font-medium">
                                                                Incluir débito no pagamento total
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {paymentAmount && remaining - parseFloat(paymentAmount) > 0 && (
                                                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                                                        <p className="text-xs text-yellow-700 font-bold mb-2">
                                                            Restante: R$ {(remaining - parseFloat(paymentAmount)).toFixed(2)}
                                                        </p>
                                                        <label className="flex items-start gap-2 cursor-pointer">
                                                            <input type="checkbox" name="settle" className="mt-1 text-primary focus:ring-primary rounded" />
                                                            <span className="text-[10px] text-yellow-800 leading-tight">
                                                                Encerrar fatura assim mesmo (Gerar <strong>Débito</strong> no cadastro do cliente).
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                                                    <DollarSign size={18} /> Confirmar Recebimento
                                                </button>
                                            </form>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-6">
                                            <h3 className="font-bold text-secondary mb-2 text-sm">Resumo da Gestão</h3>
                                            <ul className="space-y-2 text-sm text-gray-500">
                                                <li className="flex justify-between"><span>Total:</span> <span className="font-medium text-secondary">R$ {selectedInvoice.amount.toFixed(2)}</span></li>
                                                <li className="flex justify-between"><span>Pago:</span> <span className="font-medium text-green-600">R$ {totalReceivedModal.toFixed(2)}</span></li>
                                                <li className="flex justify-between pt-2 border-t border-gray-200"><span>Diferença:</span> <span className={`font-bold ${remaining > 0 ? 'text-red-500' : 'text-gray-400'}`}>R$ {remaining.toFixed(2)}</span></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
