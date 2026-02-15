
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Wallet,
    Calendar,
    RefreshCw,
    Info,
    Copy,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../services/api';
import PaymentReceiptModal from '../../components/PaymentReceiptModal';

interface Payment {
    id: string;
    amount: number;
    paidAt: string;
    method: string;
}

interface Invoice {
    id: string;
    amount: number;
    status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'MONITORAR' | 'NEGOCIADO' | 'ENCERRADO';
    dueDate: string;
    createdAt: string;
    paymentRecords: Payment[];
    appointment?: {
        pet: { name: string };
        services: { name: string }[];
    };
    quote?: {
        id: string;
    };
}

interface CustomerData {
    id: string;
    name: string;
    balance: number;
    type: 'AVULSO' | 'RECORRENTE';
}

const statusConfig: any = {
    'PENDENTE': { label: 'Pendente', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Clock size={14} /> },
    'PAGO': { label: 'Pago', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={14} /> },
    'VENCIDO': { label: 'Vencido', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle size={14} /> },
    'MONITORAR': { label: 'Em Análise', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Info size={14} /> },
    'NEGOCIADO': { label: 'Negociado', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <RefreshCw size={14} /> },
    'ENCERRADO': { label: 'Arquivado', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <CheckCircle2 size={14} /> }
};

export default function PaymentList() {
    const { } = useAuthStore();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Receipt State
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invoicesRes, customerRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/customers/me')
            ]);
            setInvoices(invoicesRes.data);
            setCustomer(customerRes.data);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar dados financeiros:', err);
            setError('Não foi possível carregar seus dados financeiros.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalPending = Array.isArray(invoices) ? invoices
        .filter(inv => inv.status === 'PENDENTE' || inv.status === 'VENCIDO')
        .reduce((acc, inv) => {
            const paid = Array.isArray(inv.paymentRecords) ? inv.paymentRecords.reduce((pAcc, p) => pAcc + p.amount, 0) : 0;
            return acc + (inv.amount - paid);
        }, 0) : 0;

    return (
        <main className="p-6 md:p-10 max-w-7xl">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <h1 className="text-4xl font-bold text-secondary tracking-tight">
                        Gestão <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Financeira</span>
                    </h1>
                    <p className="text-gray-500 mt-3 font-medium">Controle suas faturas, pagamentos e créditos.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[200px]">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo em Conta</p>
                            <p className={`text-xl font-bold ${customer?.balance && customer.balance > 0 ? 'text-green-600' : 'text-secondary'}`}>
                                R$ {customer?.balance?.toFixed(2) || '0,00'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 min-w-[200px]">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Pendente</p>
                            <p className="text-xl font-bold text-secondary">
                                R$ {totalPending.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                    <AlertCircle size={24} />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {customer?.type === 'RECORRENTE' && (
                <div className="mb-10 bg-gradient-to-r from-secondary to-secondary-dark rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary/20 text-primary-light text-[10px] font-bold rounded-full uppercase tracking-widest border border-primary/30">
                                    Cliente VIP Recorrente
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold italic">Sua assinatura está ativa!</h2>
                            <p className="text-gray-400 text-sm mt-1 max-w-md">
                                Como cliente recorrente, você tem faturamento facilitado e prioridade nos agendamentos.
                            </p>
                        </div>
                        <button className="px-6 py-3 bg-white text-secondary font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg">
                            Ver Detalhes do Plano <ArrowRight size={18} />
                        </button>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <h2 className="text-lg font-bold text-secondary mb-2 px-2">Histórico de Faturas</h2>

                    {invoices.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100 shadow-sm">
                            <CreditCard className="mx-auto text-gray-200 mb-4" size={64} />
                            <h3 className="text-xl font-bold text-gray-400">Nenhuma fatura encontrada.</h3>
                            <p className="text-gray-300">Suas cobranças aparecerão aqui após a conclusão dos serviços.</p>
                        </div>
                    ) : (
                        invoices.map((invoice) => {
                            const totalPaid = Array.isArray(invoice.paymentRecords) ? invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0) : 0;
                            const isPartiallyPaid = totalPaid > 0 && totalPaid < invoice.amount;

                            return (
                                <motion.div
                                    key={invoice.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group flex flex-col md:flex-row items-center gap-6"
                                >
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <CreditCard size={28} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-secondary">Fatura #{invoice.id.substring(0, 8).toUpperCase()}</h3>
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${statusConfig[invoice.status]?.color}`}>
                                                {statusConfig[invoice.status]?.icon}
                                                {statusConfig[invoice.status]?.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> Vence em {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</span>
                                            {invoice.appointment?.pet && (
                                                <span className="font-medium text-secondary/60 italic">Pet: {invoice.appointment.pet.name}</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-center md:text-right min-w-[120px]">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-2xl font-bold text-secondary">R$ {invoice.amount.toFixed(2)}</p>
                                        {isPartiallyPaid && (
                                            <p className="text-[10px] font-bold text-orange-500">Pago R$ {totalPaid.toFixed(2)}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSelectedInvoice(invoice)}
                                        className="w-full md:w-auto px-6 py-3 bg-gray-50 hover:bg-primary-light text-gray-400 hover:text-primary rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        Ver Detalhes
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedInvoice && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInvoice(null)}
                            className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 px-4 flex items-center justify-center"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full mx-4 md:mx-0 md:max-w-lg bg-white rounded-[40px] shadow-2xl z-[60] overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-secondary">Detalhes do Pagamento</h2>
                                        <p className="text-gray-400 font-medium text-sm">Fatura #{selectedInvoice.id.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                    <button onClick={() => setSelectedInvoice(null)} className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-secondary hover:bg-gray-200 transition-all">
                                        <RefreshCw size={20} className="rotate-45" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-3xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor da Fatura</span>
                                            <span className="text-xl font-bold text-secondary">R$ {selectedInvoice.amount.toFixed(2)}</span>
                                        </div>

                                        <hr className="border-gray-200 border-dashed my-4" />

                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico de Amortização</p>
                                        {selectedInvoice.paymentRecords.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">Nenhum pagamento registrado ainda.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedInvoice.paymentRecords.map((p) => (
                                                    <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                                        <div>
                                                            <p className="text-sm font-bold text-secondary">R$ {p.amount.toFixed(2)}</p>
                                                            <p className="text-[10px] text-gray-400">{new Date(p.paidAt).toLocaleDateString('pt-BR')} via {p.method}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayment(p);
                                                                setShowReceipt(true);
                                                            }}
                                                            className="text-green-500 bg-green-50 p-1.5 rounded-full hover:bg-green-100 transition-colors"
                                                            title="Ver Comprovante"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-sm font-bold text-gray-500">Saldo Restante</span>
                                        <span className="text-2xl font-bold text-primary">
                                            R$ {(selectedInvoice.amount - (Array.isArray(selectedInvoice.paymentRecords) ? selectedInvoice.paymentRecords.reduce((a, b) => a + b.amount, 0) : 0)).toFixed(2)}
                                        </span>
                                    </div>

                                    {selectedInvoice.status !== 'PAGO' && (
                                        <div className="pt-4 space-y-3">
                                            {/* Opção Pix */}
                                            <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Wallet size={16} className="text-primary" />
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pagar via Pix</span>
                                                    </div>
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Recomendado</span>
                                                </div>

                                                <div className="bg-white p-3 rounded-2xl border border-gray-100 mb-3 flex items-center justify-between gap-3">
                                                    <code className="text-sm font-mono text-secondary font-bold truncate select-all">
                                                        thepet@7pet.com.br
                                                    </code>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText('thepet@7pet.com.br');
                                                        toast.success('Chave Pix copiada para a área de transferência!', { icon: '🔑', duration: 3000 });
                                                    }}
                                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    <Copy size={16} />
                                                    Copiar Chave Pix
                                                </button>
                                            </div>

                                            {/* Botão WhatsApp Secundário */}
                                            <button
                                                onClick={() => window.open('https://wa.me/5511983966451', '_blank')}
                                                className="w-full py-3 bg-white border border-gray-100 text-gray-400 font-bold rounded-xl hover:text-green-600 hover:border-green-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                            >
                                                <ExternalLink size={14} />
                                                Enviar Comprovante (WhatsApp)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <PaymentReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                payment={selectedPayment}
                customerName={customer?.name || ''}
            />
        </main>
    );
}
