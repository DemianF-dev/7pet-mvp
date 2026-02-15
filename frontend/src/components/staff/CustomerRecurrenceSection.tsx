import { useState, useEffect } from 'react';
import { Package, Calendar, AlertCircle, ChevronRight, Plus, ExternalLink, Clock, CreditCard, PlayCircle, PauseCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import RecurrenceDetailModal from './RecurrenceDetailModal';

interface Props {
    customerId: string;
}

export default function CustomerRecurrenceSection({ customerId }: Props) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<any[]>([]);
    const [recurringQuotes, setRecurringQuotes] = useState<any[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [contractsRes, quotesRes] = await Promise.all([
                api.get('/recurrence/contracts', { params: { customerId } }),
                api.get('/quotes/recurring', { params: { customerId } })
            ]);
            setContracts(contractsRes.data);
            setRecurringQuotes(quotesRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados de recorrência.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-heading uppercase tracking-tight flex items-center gap-2">
                        <Package className="text-accent" size={24} />
                        Assinaturas & Pacotes
                    </h3>
                    <p className="text-body-secondary text-sm">Gerencie contratos mensais e orçamentos recorrentes ativos.</p>
                </div>
                <button
                    onClick={() => navigate('/staff/recurrence/new', { state: { customerId, type: 'SPA' } })}
                    className="flex items-center gap-2 bg-heading text-bg-surface px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-heading/10"
                >
                    <Plus size={18} /> Novo Contrato
                </button>
            </div>

            {/* Empty State */}
            {contracts.length === 0 && recurringQuotes.length === 0 && (
                <div className="bg-bg-subtle border border-border border-dashed rounded-[24px] p-12 text-center">
                    <div className="w-16 h-16 bg-body-secondary/10 text-body-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-heading">Nenhuma assinatura ativa</h4>
                    <p className="text-body-secondary max-w-md mx-auto mt-2">
                        Este cliente não possui contratos mensais ou pacotes de recorrência ativos no momento.
                    </p>
                    <button
                        onClick={() => navigate('/staff/recurrence/new', { state: { customerId } })}
                        className="mt-6 text-accent font-bold hover:underline"
                    >
                        Criar primeiro contrato
                    </button>
                </div>
            )}

            {/* Contracts List */}
            {contracts.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1">Contratos Mensais</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {contracts.map(contract => (
                            <div
                                key={contract.id}
                                onClick={() => setSelectedContractId(contract.id)}
                                className="group bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${contract.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' : 'bg-body-secondary/10 text-body-secondary border-border'
                                        }`}>
                                        {contract.status}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${contract.type === 'SPA' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {contract.type === 'SPA' ? '🛁' : '🚗'}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-heading text-lg group-hover:text-accent transition-colors">
                                            {contract.title}
                                        </h5>
                                        <p className="text-sm text-body-secondary mt-1 flex items-center gap-2">
                                            <Calendar size={14} /> Frequência: {contract.frequency}
                                        </p>
                                        <p className="text-sm text-body-secondary mt-1 flex items-center gap-2">
                                            <CreditCard size={14} /> Vencimento dia {contract.billingDay}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                                    <span className="text-body-secondary">Criado em {format(new Date(contract.createdAt), 'dd/MM/yyyy')}</span>
                                    <span className="text-accent font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Gerenciar <ChevronRight size={16} />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recurring Quotes List */}
            {recurringQuotes.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1">Orçamentos Recorrentes (Pacotes Ativos)</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {recurringQuotes.map(quote => (
                            <div
                                key={quote.id}
                                onClick={() => navigate(`/staff/quotes/${quote.id}`)} // Quotes go directly to quote detail for now
                                className="group bg-bg-surface border border-border rounded-2xl p-5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-body-secondary bg-bg-subtle px-2 py-1 rounded-md">
                                            #{String(quote.seqId).padStart(4, '0')}
                                        </span>
                                        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">
                                            {quote.type}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-heading">
                                        R$ {quote.totalAmount.toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <h5 className="font-bold text-heading text-sm line-clamp-1">
                                        {quote.items?.map((i: any) => `${i.quantity}x ${i.description}`).join(', ') || 'Sem itens'}
                                    </h5>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-body-secondary">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {quote.appointments?.length || 0} agendamentos
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> {format(new Date(quote.createdAt), "dd 'de' MMM", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de Detalhes do Contrato */}
            {selectedContractId && (
                <RecurrenceDetailModal
                    contractId={selectedContractId}
                    onClose={() => setSelectedContractId(null)}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
}
