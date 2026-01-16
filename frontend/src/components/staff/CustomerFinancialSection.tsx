import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, DollarSign, Calendar, X, FileText } from 'lucide-react';
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
    quote?: { id: string; seqId: number; status: string };
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
        <section className={`bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 ${balance < -500 ? 'ring-2 ring-red-500/20' : ''}`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={16} /> Situação Financeira
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="p-3 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all group shadow-sm"
                >
                    <Plus size={20} className="text-primary group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* BALANCE CARD */}
            <div className={`p-8 rounded-[32px] mb-8 relative overflow-hidden transition-all duration-500 ${balanceColor === 'success' ? 'bg-emerald-50 border border-emerald-100' :
                balanceColor === 'error' ? 'bg-red-50 border border-red-100' :
                    'bg-gray-50 border border-gray-100'
                }`}>
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Saldo Atual
                        </p>
                        <p className={`text-5xl font-black tracking-tighter ${balanceColor === 'success' ? 'text-emerald-600' :
                            balanceColor === 'error' ? 'text-red-600' :
                                'text-secondary'
                            }`}>
                            <span className="text-2xl mr-1 font-black opacity-60">R$</span>{Math.abs(balance).toFixed(2).replace('.', ',')}
                        </p>
                        <div className="flex items-center gap-2 mt-3 px-1">
                            {balance > 0 && (
                                <span className="flex items-center gap-1.5 py-1 px-3 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    ✅ A Empresa deve ao cliente
                                </span>
                            )}
                            {balance < 0 && (
                                <span className="flex items-center gap-1.5 py-1 px-3 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    ⚠️ O Cliente deve à empresa
                                </span>
                            )}
                            {balance === 0 && (
                                <span className="flex items-center gap-1.5 py-1 px-3 bg-gray-200 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    ✔️ Sem pendências
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-transform hover:rotate-12 duration-300 ${balanceColor === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' :
                        balanceColor === 'error' ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                            'bg-gray-200 text-gray-400'
                        }`}>
                        {balanceIcon}
                    </div>
                </div>

                {/* Visual Flourish */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                    <DollarSign size={140} />
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
                            className="flex items-start justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[24px] hover:bg-white hover:shadow-md transition-all group"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${t.type === 'DEBIT'
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {t.type === 'DEBIT' ? 'Débito' : 'Crédito'}
                                    </span>
                                    {t.category && (
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">
                                            {t.category}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-black text-secondary group-hover:text-primary transition-colors">{t.description}</p>
                                {t.quote && (
                                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-400 bg-white/50 w-fit px-2 py-1 rounded-md border border-gray-100">
                                        <FileText size={10} />
                                        Orçamento #{String(t.quote.seqId).padStart(4, '0')}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-300 font-bold uppercase tracking-tight">
                                    <Calendar size={10} />
                                    {new Date(t.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className={`text-xl font-black tabular-nums ${t.type === 'DEBIT' ? 'text-red-500' : 'text-emerald-500'
                                }`}>
                                {t.type === 'DEBIT' ? '+' : '-'} <span className="text-xs mr-0.5">R$</span>{t.amount.toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* ADD TRANSACTION MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-secondary tracking-tight">Nova <span className="text-primary">Movimentação</span></h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Tipo de Fluxo
                                </label>
                                <div className="flex gap-2">
                                    {(['DEBIT', 'CREDIT'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setTransType(type)}
                                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${transType === type
                                                ? type === 'DEBIT'
                                                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                                                    : 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                }`}
                                        >
                                            {type === 'DEBIT' ? '📈 Débito' : '📉 Crédito'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Valor (R$)
                                </label>
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Descrição Principal
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Ex: Ajuste manual de saldo"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Categoria
                                    </label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="ADJUSTMENT">Ajuste de Saldo</option>
                                        <option value="DISCOUNT">Desconto Especial</option>
                                        <option value="PENALTY">Multa / Taxa</option>
                                        <option value="PAYMENT">Pagamento Direto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Observações (Privado)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                                    rows={2}
                                    placeholder="Motivo interno da alteração..."
                                />
                            </div>

                            <button
                                onClick={handleAddTransaction}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                Registrar Transação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
