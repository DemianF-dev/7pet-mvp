import { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (payment: any) => void;
    invoice: any;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, invoice }: PaymentModalProps) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('PIX');
    const [bank, setBank] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Update amount if invoice changes
    useEffect(() => {
        if (invoice) {
            const paid = invoice.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
            const remaining = Math.max(0, invoice.amount - paid);
            setAmount(remaining.toFixed(2));
        }
    }, [invoice]);

    if (!isOpen || !invoice) return null;

    const totalPaid = invoice.payments?.reduce((acc: number, p: any) => acc + p.amount, 0) || 0;
    const remaining = invoice.amount - totalPaid;

    // Balance logic
    const customerBalance = invoice.customer?.balance || 0;
    const isPositiveBalance = customerBalance > 0;
    const isNegativeBalance = customerBalance < 0;

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!window.confirm(`Confirmar o recebimento de R$ ${amount} via ${method}?`)) return;

        setIsLoading(true);
        try {
            const form = e.target as HTMLFormElement;
            const settleCheckbox = form.elements.namedItem('settle') as HTMLInputElement;
            const useBalanceCheckbox = form.elements.namedItem('useBalance') as HTMLInputElement;
            const settle = settleCheckbox ? settleCheckbox.checked : false;
            const useBalance = useBalanceCheckbox ? useBalanceCheckbox.checked : false;

            await api.post(`/invoices/${invoice.id}/payments`, {
                amount: parseFloat(amount || '0'),
                method: method,
                bank: bank,
                settle: settle,
                useBalance: useBalance
            });

            toast.success('Pagamento registrado!');

            // Return validation data to parent to show receipt
            const paymentAmount = parseFloat(amount || '0');
            onSuccess({
                amount: paymentAmount,
                method,
                paidAt: new Date().toISOString()
            });
            // Note: Ideally we return the actual created payment object, 
            // but for showing the receipt immediately, this mock might be enough or 
            // the parent refetches. To follow BillingManager pattern, we might need a refetch.

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao registrar pagamento');
        } finally {
            setIsLoading(false);
        }
    };

    const parsedAmount = parseFloat(amount || '0');
    const diff = remaining - parsedAmount;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-secondary">Receber Pagamento</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fatura #{invoice.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Total a Receber</span>
                            <span className="text-2xl font-bold text-blue-600">R$ {remaining.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-blue-400 font-medium text-right">
                            Total Fatura: R$ {invoice.amount.toFixed(2)}
                        </div>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor do Pagamento</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Forma de Pagamento</label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                            >
                                <option value="PIX">PIX</option>
                                <option value="DINHEIRO">Dinheiro</option>
                                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                                <option value="BOLETO">Boleto (Compensado)</option>
                            </select>
                        </div>

                        {(method === 'PIX' || method === 'BOLETO') && (
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Banco / Destino (Opcional)</label>
                                <input
                                    type="text"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-secondary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Ex: Inter, Nubank..."
                                />
                            </div>
                        )}

                        {/* Calculations & Warnings */}
                        <div className="space-y-3 pt-2">
                            {/* Positive Balance Usage */}
                            {isPositiveBalance && (
                                <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700 font-bold text-xs mb-2">
                                        <DollarSign size={14} />
                                        <span>Saldo Disponível: R$ {customerBalance.toFixed(2)}</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" name="useBalance" className="accent-green-600 w-4 h-4 rounded" />
                                        <span className="text-[10px] text-green-800 font-bold uppercase tracking-wide">
                                            Usar Saldo
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Negative Balance Warning */}
                            {isNegativeBalance && (
                                <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                                        <AlertCircle size={14} />
                                        <span>Débito Anterior: R$ {Math.abs(customerBalance).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Change / Credit */}
                            {parsedAmount > 0 && diff < 0 && (
                                <div className="bg-green-100 p-3 rounded-xl border border-green-200">
                                    <p className="text-xs text-green-700 font-bold flex justify-between">
                                        <span>Troco / Crédito:</span>
                                        <span>R$ {Math.abs(diff).toFixed(2)}</span>
                                    </p>
                                    <p className="text-[9px] text-green-600 mt-1 leading-tight">Valor excedente será creditado na conta do cliente.</p>
                                </div>
                            )}

                            {/* Underpayment / Debt */}
                            {parsedAmount > 0 && diff > 0 && (
                                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                                    <p className="text-xs text-yellow-700 font-bold flex justify-between mb-2">
                                        <span>Restante:</span>
                                        <span>R$ {diff.toFixed(2)}</span>
                                    </p>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" name="settle" className="mt-0.5 accent-yellow-600 w-4 h-4 rounded" />
                                        <span className="text-[10px] text-yellow-800 font-bold uppercase tracking-wide leading-tight">
                                            Encerrar fatura (Gerar Débito)
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processando...' : (
                                <>
                                    <CheckCircle size={18} /> Confirmar Recebimento
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
