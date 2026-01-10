import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, DollarSign, Calendar, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Transaction {
    id: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
    category?: string;
    createdAt: string;
    notes?: string;
    relatedQuote?: { id: string; seqId: number; status: string };
}

interface CustomerFinancialSectionProps {
    customerId: string;
}

export default function CustomerFinancialSection({ customerId }: CustomerFinancialSectionProps) {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
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
                api.get(`/customers/${customerId}/transactions?take=10`)
            ]);

            setBalance(customerRes.data.balance || 0);
            setTransactions(transactionsRes.data.transactions || []);
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

    if (loading) return <div className="animate-pulse surface-card h-64" />;

    const balanceColor = balance === 0 ? 'neutral' : balance > 0 ? 'success' : 'error';
    const balanceIcon = balance > 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />;

    return (
        <section className={`surface-card p-8 ${balance < -500 ? 'ring-2 ring-error/30' : ''}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-muted uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Situação Financeira
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="p-2 hover:bg-fill-secondary rounded-full transition-colors"
                >
                    <Plus size={18} className="text-accent" />
                </button>
            </div>

            {/* BALANCE CARD */}
            <div className={`p-6 rounded-3xl mb-6 ${balanceColor === 'success' ? 'status-success-surface' :
                    balanceColor === 'error' ? 'status-error-surface' :
                        'status-neutral-surface'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">
                            Saldo Atual
                        </p>
                        <p className={`text-4xl font-black ${balanceColor === 'success' ? 'text-success' :
                                balanceColor === 'error' ? 'text-error' :
                                    'text-heading'
                            }`}>
                            R$ {Math.abs(balance).toFixed(2)}
                        </p>
                        <p className="text-xs font-bold text-body-secondary mt-1">
                            {balance > 0 && '✅ Empresa deve ao cliente'}
                            {balance < 0 && '⚠️ Cliente deve à empresa'}
                            {balance === 0 && '✔️ Sem pendências'}
                        </p>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${balanceColor === 'success' ? 'status-success-badge' :
                            balanceColor === 'error' ? 'status-error-badge' :
                                'bg-fill-tertiary text-muted'
                        }`}>
                        {balanceIcon}
                    </div>
                </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="space-y-3">
                <p className="text-xs font-black text-muted uppercase tracking-widest">
                    Últimas Movimentações
                </p>
                {transactions.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">
                        Nenhuma transação registrada
                    </p>
                ) : (
                    transactions.map(t => (
                        <div
                            key={t.id}
                            className="flex items-start justify-between p-4 surface-input rounded-2xl"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${t.type === 'DEBIT'
                                            ? 'status-error-surface'
                                            : 'status-success-surface'
                                        }`}>
                                        {t.type === 'DEBIT' ? 'Débito' : 'Crédito'}
                                    </span>
                                    {t.category && (
                                        <span className="text-[9px] font-bold text-muted uppercase">
                                            {t.category}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-heading">{t.description}</p>
                                {t.relatedQuote && (
                                    <p className="text-xs text-muted mt-1">
                                        📋 Orçamento #{String(t.relatedQuote.seqId).padStart(4, '0')}
                                    </p>
                                )}
                                <p className="text-[10px] text-muted mt-1">
                                    <Calendar size={10} className="inline mr-1" />
                                    {new Date(t.createdAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <p className={`text-lg font-black ${t.type === 'DEBIT' ? 'text-error' : 'text-success'
                                }`}>
                                {t.type === 'DEBIT' ? '+' : '-'}R$ {t.amount.toFixed(2)}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* ADD TRANSACTION MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-elevated p-8 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-heading">Nova Transação</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-heading transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Tipo
                                </label>
                                <div className="flex gap-2">
                                    {(['DEBIT', 'CREDIT'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setTransType(type)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${transType === type
                                                    ? type === 'DEBIT'
                                                        ? 'status-error-badge'
                                                        : 'status-success-badge'
                                                    : 'surface-input text-muted'
                                                }`}
                                        >
                                            {type === 'DEBIT' ? '📈 Débito' : '📉 Crédito'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Valor (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading"
                                    placeholder="Ex: Ajuste de saldo"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Categoria
                                </label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading"
                                >
                                    <option value="ADJUSTMENT">Ajuste</option>
                                    <option value="DISCOUNT">Desconto</option>
                                    <option value="PENALTY">Multa</option>
                                    <option value="PAYMENT">Pagamento</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Observações
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading resize-none"
                                    rows={2}
                                    placeholder="Observações internas..."
                                />
                            </div>

                            <button
                                onClick={handleAddTransaction}
                                className="w-full btn-primary py-4 font-black uppercase text-sm tracking-widest"
                            >
                                Adicionar Transação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
