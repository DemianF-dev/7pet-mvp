import { useState, useEffect } from 'react';
import {
    X, CreditCard, Calendar, DollarSign,
    FileText, Copy, Trash2,
    Clock, Save, ShoppingCart, Receipt, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import PaymentReceiptModal from '../PaymentReceiptModal';

interface PaymentRecord {
    id: string;
    amount: number;
    method: string;
    paidAt: string;
}

interface Invoice {
    id: string;
    seqId?: number;
    customerId: string;
    customer: {
        name: string;
        balance?: number;
        user?: { id: string };
    };
    amount: number;
    status: string;
    dueDate: string;
    notes?: string;
    billingPeriod?: string;
    appointmentId?: string;
    paymentRecords: PaymentRecord[];
    quotes?: any[];
    appointment?: any;
    lines?: any[];
}

interface Props {
    invoiceId: string;
    onClose: () => void;
    onUpdate?: () => void;
    onViewOrder?: (orderId: string) => void;
}

export default function InvoiceDetailsModal({ invoiceId, onClose, onUpdate, onViewOrder }: Props) {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [paymentBank] = useState('');
    const [notes, setNotes] = useState('');
    const [billingPeriod, setBillingPeriod] = useState('');
    const [isSavingMetadata, setIsSavingMetadata] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/invoices'); // Get all and find since we don't have Get By ID route shown, but let's assume one or filter
            const all: Invoice[] = res.data;
            const found = all.find(i => i.id === invoiceId);
            if (found) {
                setInvoice(found);
                setNotes(found.notes || '');
                setBillingPeriod(found.billingPeriod || '');
            } else {
                toast.error('Fatura não encontrada');
                onClose();
            }
        } catch (error) {
            toast.error('Erro ao carregar fatura');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMetadata = async () => {
        try {
            setIsSavingMetadata(true);
            await api.patch(`/invoices/${invoiceId}`, {
                notes,
                billingPeriod
            });
            toast.success('Alterações salvas');
            fetchInvoice();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSavingMetadata(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        try {
            await api.patch(`/invoices/${invoiceId}/status`, { status });
            toast.success('Status atualizado');
            fetchInvoice();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleRegisterPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/invoices/${invoiceId}/payments`, {
                amount: Number(paymentAmount),
                method: paymentMethod,
                bank: paymentBank,
                useBalance: false // Adding more complex logic later if needed
            });
            toast.success('Pagamento registrado');
            setPaymentAmount('');
            fetchInvoice();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao registrar pagamento');
        }
    };

    const handleCancelPayment = async (paymentId: string) => {
        if (!window.confirm('Deseja estornar este pagamento?')) return;
        try {
            await api.delete(`/invoices/${invoiceId}/payments/${paymentId}`);
            toast.success('Pagamento estornado');
            fetchInvoice();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao estornar pagamento');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Deseja excluir esta fatura permanentemente?')) return;
        try {
            await api.delete(`/invoices/${invoiceId}`);
            toast.success('Fatura excluída');
            onClose();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao excluir fatura');
        }
    };

    const handleDuplicate = async () => {
        try {
            await api.post(`/invoices/${invoiceId}/duplicate`);
            toast.success('Fatura duplicada');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Erro ao duplicar fatura');
        }
    };

    if (isLoading) return null;
    if (!invoice) return null;

    const totalPaid = invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, invoice.amount - totalPaid);

    // Consolidate all linked appointments (direct + via lines)
    const linkedAppointments = [
        ...(invoice.appointment ? [invoice.appointment] : []),
        ...(invoice.lines?.map(l => l.appointment).filter(Boolean) || [])
    ];
    // Deduplicate by ID
    const uniqueAppointments = Array.from(new Map(linkedAppointments.map(a => [a.id, a])).values());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'VENCIDO': return 'bg-red-100 text-red-700 border-red-200';
            case 'PENDENTE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'MONITORAR': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'FATURAR': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-5xl relative z-10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-secondary uppercase tracking-tight">
                                Fatura #{String(invoice.seqId || invoice.id.slice(0, 4)).padStart(4, '0')}
                            </h2>
                            <p className="text-gray-500 font-medium">{invoice.customer.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDuplicate}
                            className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-blue-500"
                            title="Duplicar"
                        >
                            <Copy size={20} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-red-500"
                            title="Excluir"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all">
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side: Summary & Items */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Unified Billing Status (Requirement) */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={18} /> Configuração de Faturamento Unificado
                                    </h3>
                                    <span className="bg-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                                        RECORRENTE
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBillingPeriod('INICIO_PACOTE')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${billingPeriod === 'INICIO_PACOTE' ? 'bg-white border-indigo-500 shadow-md ring-4 ring-indigo-50' : 'bg-white/50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase">Início do Pacote</span>
                                        <span className="text-xs font-medium">Cobrança antes do início dos serviços</span>
                                    </button>
                                    <button
                                        onClick={() => setBillingPeriod('FIM_PACOTE')}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${billingPeriod === 'FIM_PACOTE' ? 'bg-white border-indigo-500 shadow-md ring-4 ring-indigo-50' : 'bg-white/50 border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase">Final do Pacote</span>
                                        <span className="text-xs font-medium">Cobrança após a realização dos serviços</span>
                                    </button>
                                </div>
                            </div>

                            {/* Financial Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">Valor Total</span>
                                    <p className="text-2xl font-bold text-secondary">R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Recebido</span>
                                    <p className="text-2xl font-bold text-emerald-700">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className={`${remaining > 0 ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'} p-5 rounded-3xl border flex flex-col`}>
                                    <span className={`text-[10px] font-bold ${remaining > 0 ? 'text-orange-600' : 'text-emerald-600'} uppercase mb-2`}>Pendente</span>
                                    <p className={`text-2xl font-bold ${remaining > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            {/* Linked Items (Quotes/Appointments) */}
                            <div>
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Itens Vinculados</h3>
                                <div className="space-y-3">
                                    {invoice.quotes?.map(q => (
                                        <div key={q.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-secondary uppercase">Orçamento #{String(q.seqId).padStart(4, '0')}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{q.items?.length || 0} Itens</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-secondary">R$ {q.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    ))}
                                    {uniqueAppointments.map((app: any) => (
                                        <div key={app.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-secondary uppercase tracking-tight">Agendamento #{String(app.seqId).padStart(4, '0')}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold">Pet: {app.pet?.name}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-secondary text-[10px] uppercase">{app.id === invoice.appointmentId ? 'Vínculo Direto' : 'Via Item'}</p>
                                            </div>

                                            {app.posOrder && (
                                                <div
                                                    onClick={() => onViewOrder ? onViewOrder(app.posOrder.id) : null}
                                                    className={`pl-10 flex items-center justify-between group/order ${onViewOrder ? 'cursor-pointer' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Receipt size={14} className="text-blue-500" />
                                                        <span className="text-[10px] font-black text-blue-500 uppercase">Cupom PDV #{String(app.posOrder.seqId).padStart(4, '0')}</span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${app.posOrder.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            {app.posOrder.status}
                                                        </span>
                                                    </div>
                                                    {onViewOrder && <ChevronRight size={14} className="text-blue-200 group-hover/order:text-blue-500 transition-colors" />}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment History */}
                            <div>
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Histórico de Pagamentos</h3>
                                <div className="space-y-2">
                                    {invoice.paymentRecords.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-4 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-200">Nenhum pagamento registrado.</p>
                                    ) : (
                                        invoice.paymentRecords.map(payment => (
                                            <div key={payment.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex justify-between items-center group hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setShowReceipt(true);
                                                            }}
                                                            className="text-sm font-bold text-secondary hover:text-primary transition-colors text-left"
                                                        >
                                                            R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </button>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(payment.paidAt).toLocaleDateString()} - {payment.method}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCancelPayment(payment.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Actions & Notes */}
                        <div className="space-y-6">
                            {/* Update Status Actions */}
                            <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ações de Status</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {['PENDENTE', 'PAGO', 'MONITORAR', 'FATURAR', 'VENCIDO'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => handleUpdateStatus(st)}
                                            className={`px-4 py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-all ${invoice.status === st ? getStatusColor(st) : 'bg-white border-gray-50 text-gray-400 hover:border-gray-100'}`}
                                        >
                                            {st === 'PAGO' ? 'Marcar como Recebido' : st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Add Payment */}
                            <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Registrar Recebimento</h3>
                                <form onSubmit={handleRegisterPayment} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="R$ 0,00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Método</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={e => setPaymentMethod(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        >
                                            <option value="PIX">PIX</option>
                                            <option value="DINHEIRO">Dinheiro</option>
                                            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                            <option value="CARTAO_DEBITO">Cartão de Débito</option>
                                            <option value="BOLETO">Boleto</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Confirmar
                                    </button>
                                </form>
                            </div>

                            {/* Internal Notes */}
                            <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Observações Internas</h3>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium resize-none focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Adicione notas sobre esta fatura..."
                                />
                                <button
                                    onClick={handleSaveMetadata}
                                    disabled={isSavingMetadata}
                                    className="w-full mt-3 bg-secondary text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={14} /> {isSavingMetadata ? 'Salvando...' : 'Salvar Notas'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <PaymentReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                payment={selectedPayment}
                customerName={invoice.customer.name}
            />
        </div>
    );
}
