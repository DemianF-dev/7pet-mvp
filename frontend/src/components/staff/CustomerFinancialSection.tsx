import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Plus, DollarSign, Calendar, X, FileText,
    ChevronRight, History, Zap, ShoppingCart, Info, Search, MoreVertical, CreditCard,
    ArrowRightLeft, BadgeDollarSign, Receipt
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import Modals & Editors
import OrderDetailsModal from './OrderDetailsModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import QuoteEditor from '../../pages/staff/QuoteEditor';

interface Transaction {
    id: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
    category?: string;
    createdAt: string;
    notes?: string;
    quote?: { id: string; seqId: number; status: string };
}

interface CustomerFinancialSectionProps {
    customerId: string;
}

type FinancialTab = 'SALDO' | 'FATURAS' | 'ORCAMENTOS' | 'CUPONS' | 'AGENDAMENTOS';

export default function CustomerFinancialSection({ customerId }: CustomerFinancialSectionProps) {
    const navigate = useNavigate();
    const [activeSubTab, setActiveSubTab] = useState<FinancialTab>('SALDO');
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Selection States for Modals
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [selectedAppointmentData, setSelectedAppointmentData] = useState<any>(null);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

    // Form state for manual adjustment
    const [transType, setTransType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('ADJUSTMENT');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        try {
            const [customerRes, transactionsRes] = await Promise.all([
                api.get(`/customers/${customerId}`),
                api.get(`/customers/${customerId}/transactions?take=20`)
            ]);

            const data = customerRes.data;
            setBalance(data.balance || 0);
            setTransactions(transactionsRes.data.transactions || []);
            setInvoices(data.invoices || []);
            setQuotes(data.quotes || []);
            setAppointments(data.appointments || []);
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!amount || !description) {
            toast.error('Valor e descrição são obrigatórios');
            return;
        }

        try {
            await api.post(`/customers/${customerId}/transactions`, {
                type: transType,
                amount: parseFloat(amount),
                description,
                category,
                notes
            });

            toast.success('Transação adicionada!');
            setShowAddModal(false);
            setAmount('');
            setDescription('');
            setNotes('');
            fetchData();
        } catch (error) {
            toast.error('Erro ao adicionar transação');
        }
    };

    const handleDuplicateActivity = async (type: 'quote' | 'appointment', activityId: string) => {
        setDuplicatingId(activityId);
        try {
            const endpoint = type === 'quote' ? `/quotes/${activityId}/duplicate` : `/appointments/${activityId}/duplicate`;
            const response = await api.post(endpoint);
            toast.success(`${type === 'quote' ? 'Orçamento' : 'Agendamento'} duplicado com sucesso!`);

            if (type === 'quote') {
                setSelectedQuoteId(response.data.id);
            } else {
                fetchData();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao duplicar registro');
        } finally {
            setDuplicatingId(null);
        }
    };

    if (loading) return <div className="animate-pulse surface-card h-64" />;

    const balanceColor = balance === 0 ? 'neutral' : balance > 0 ? 'success' : 'error';
    const balanceIcon = balance > 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />;

    return (
        <section className={`bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 ${balance < -500 ? 'ring-2 ring-red-500/20' : ''}`}>
            {/* Header & Main Info */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Gestão Financeira Integrada
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-xs"
                    >
                        <Plus size={16} /> Ajuste Saldo
                    </button>
                </div>
            </div>

            {/* BALANCE MINI CARD - Always visible but smaller if not in SALDO tab */}
            <div className={`p-6 rounded-[32px] mb-8 relative overflow-hidden transition-all duration-500 ${activeSubTab === 'SALDO' ? 'bg-gray-50' : 'bg-gray-50/50 scale-95 opacity-80'
                } border border-gray-100 shadow-sm`}>
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">
                            Saldo em Carteira
                        </p>
                        <p className={`text-3xl font-black tracking-tighter ${balanceColor === 'success' ? 'text-emerald-600' :
                            balanceColor === 'error' ? 'text-red-600' :
                                'text-secondary'
                            }`}>
                            <span className="text-xl mr-1 font-black opacity-60">R$</span>{Math.abs(balance).toFixed(2).replace('.', ',')}
                        </p>
                        <div className="flex items-center gap-2 mt-2 px-1">
                            {balance > 0 && <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Crédito</span>}
                            {balance < 0 && <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Débito</span>}
                            {balance === 0 && <span className="text-[9px] font-black uppercase text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Zerado</span>}
                        </div>
                    </div>
                    {activeSubTab === 'SALDO' && (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${balanceColor === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' :
                            balanceColor === 'error' ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                                'bg-gray-200 text-gray-400'
                            }`}>
                            {balanceIcon}
                        </div>
                    )}
                </div>
            </div>

            {/* SUB-TABS SELECTOR */}
            <div className="flex items-center gap-1 mb-8 bg-gray-50/50 p-1.5 rounded-[24px] border border-gray-100 w-full overflow-x-auto no-scrollbar">
                {[
                    { id: 'SALDO', label: 'Extrato', icon: <ArrowRightLeft size={14} /> },
                    { id: 'FATURAS', label: 'Faturas', icon: <FileText size={14} /> },
                    { id: 'CUPONS', label: 'Cupons PDV', icon: <Receipt size={14} /> },
                    { id: 'ORCAMENTOS', label: 'Orçamentos', icon: <BadgeDollarSign size={14} /> },
                    { id: 'AGENDAMENTOS', label: 'Agendamentos', icon: <Calendar size={14} /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id as FinancialTab)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id
                            ? 'bg-white text-primary shadow-sm ring-1 ring-gray-100'
                            : 'text-gray-400 hover:text-secondary hover:bg-white/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSubTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* 1. EXTRACT / TRANSACTIONS */}
                        {activeSubTab === 'SALDO' && (
                            <div className="space-y-3">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-bold italic">Nenhuma movimentação manual encontrada.</p>
                                    </div>
                                ) : (
                                    transactions.map(t => (
                                        <div key={t.id} className="flex items-start justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${t.type === 'DEBIT' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {t.type === 'DEBIT' ? 'Débito' : 'Crédito'}
                                                    </span>
                                                    {t.category && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">{t.category}</span>}
                                                </div>
                                                <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">{t.description}</p>
                                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-300 font-bold uppercase">
                                                    <Calendar size={10} />
                                                    {new Date(t.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <p className={`text-xl font-black ${t.type === 'DEBIT' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {t.type === 'DEBIT' ? '+' : '-'} <span className="text-xs mr-0.5">R$</span>{t.amount.toFixed(2).replace('.', ',')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 2. INVOICES */}
                        {activeSubTab === 'FATURAS' && (
                            <div className="space-y-3">
                                {invoices.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-bold italic">Nenhuma fatura encontrada para este tutor.</p>
                                    </div>
                                ) : (
                                    invoices.map(inv => (
                                        <div key={inv.id}
                                            onClick={() => setSelectedInvoiceId(inv.id)}
                                            className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${inv.status === 'PAGO' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">
                                                        Fatura #{String(inv.seqId || inv.id.slice(0, 4)).padStart(4, '0')}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400">Vence: {new Date(inv.dueDate).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${inv.status === 'PAGO' ? 'text-emerald-500' : 'text-orange-500'}`}>{inv.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-lg font-black text-secondary">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 3. CUPONS PDV (ORDERS) */}
                        {activeSubTab === 'CUPONS' && (
                            <div className="space-y-3">
                                {orders.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-bold italic">Nenhuma venda de PDV vinculada.</p>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id}
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                                    <ShoppingCart size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">
                                                        Cupom PDV #{String(order.seqId).padStart(4, '0')}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{order.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-lg font-black text-secondary">R$ {order.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 4. QUOTES */}
                        {activeSubTab === 'ORCAMENTOS' && (
                            <div className="space-y-3">
                                {quotes.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-bold italic">Nenhum orçamento encontrado.</p>
                                    </div>
                                ) : (
                                    quotes.map(q => (
                                        <div key={q.id} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedQuoteId(q.id)}>
                                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">
                                                        Orçamento #{String(q.seqId).padStart(4, '0')}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400">R$ {q.totalAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{q.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDuplicateActivity('quote', q.id)}
                                                    disabled={duplicatingId === q.id}
                                                    className="p-3 bg-white text-gray-400 hover:text-primary rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-110"
                                                    title="Copiar Orçamento"
                                                >
                                                    <Zap size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedQuoteId(q.id)}
                                                    className="p-3 bg-white text-gray-400 hover:text-indigo-600 rounded-xl border border-gray-100 shadow-sm transition-all"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 5. APPOINTMENTS */}
                        {activeSubTab === 'AGENDAMENTOS' && (
                            <div className="space-y-3">
                                {appointments.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/30 border border-dashed border-gray-100 rounded-[32px]">
                                        <p className="text-sm text-gray-400 font-bold italic">Nenhum agendamento encontrado.</p>
                                    </div>
                                ) : (
                                    appointments.map(appt => (
                                        <div key={appt.id} className="flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedAppointmentData(appt)}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${appt.status === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">
                                                        {new Date(appt.startAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{appt.category}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${appt.status === 'FINALIZADO' ? 'text-emerald-500' : 'text-primary'}`}>{appt.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDuplicateActivity('appointment', appt.id)}
                                                    disabled={duplicatingId === appt.id}
                                                    className="p-3 bg-white text-gray-400 hover:text-primary rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-110 flex items-center gap-2"
                                                    title="Copiar / Refazer"
                                                >
                                                    <History size={16} />
                                                    <span className="text-[9px] font-black uppercase tracking-tight">Refazer</span>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedAppointmentData(appt)}
                                                    className="p-3 bg-white text-gray-400 hover:text-primary rounded-xl border border-gray-100 shadow-sm transition-all"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* MODALS SECTION */}
            <AnimatePresence>
                {/* 1. PDV Order Details */}
                {selectedOrderId && (
                    <OrderDetailsModal
                        isOpen={!!selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        orderId={selectedOrderId}
                        onActionCompleted={fetchData}
                    />
                )}

                {/* 2. Appointment Details */}
                {selectedAppointmentData && (
                    <AppointmentDetailsModal
                        isOpen={!!selectedAppointmentData}
                        onClose={() => setSelectedAppointmentData(null)}
                        appointment={selectedAppointmentData}
                        onSuccess={fetchData}
                        onModify={() => { }} // Required prop
                        onCopy={() => handleDuplicateActivity('appointment', selectedAppointmentData.id)}
                    />
                )}

                {/* 3. Quote Editor - Internal Content */}
                {selectedQuoteId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setSelectedQuoteId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-gray-100 p-8"
                        >
                            <button
                                onClick={() => setSelectedQuoteId(null)}
                                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 z-[210] bg-white shadow-sm border border-gray-100"
                            >
                                <X size={24} />
                            </button>
                            <div className="mt-4">
                                <QuoteEditor
                                    quoteId={selectedQuoteId}
                                    onClose={() => setSelectedQuoteId(null)}
                                    onUpdate={fetchData}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 4. Invoice Details */}
                {selectedInvoiceId && (
                    <InvoiceDetailsModal
                        invoiceId={selectedInvoiceId}
                        onClose={() => setSelectedInvoiceId(null)}
                        onUpdate={fetchData}
                    />
                )}

                {/* 5. Manual Add Transaction Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                        <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-secondary tracking-tight">Novo <span className="text-primary">Ajuste</span></h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
                                    <div className="flex gap-2">
                                        {(['DEBIT', 'CREDIT'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setTransType(type)}
                                                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${transType === type
                                                    ? type === 'DEBIT' ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                {type === 'DEBIT' ? '📈 Débito' : '📉 Crédito'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-black focus:ring-2 focus:ring-primary/10 transition-all outline-none text-lg"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="Ex: Ajuste manual de saldo"
                                    />
                                </div>

                                <button
                                    onClick={handleAddTransaction}
                                    className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                                >
                                    Confirmar Ajuste
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
