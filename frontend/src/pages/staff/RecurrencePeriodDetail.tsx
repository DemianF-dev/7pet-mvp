import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Plus,
    FileText,
    Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface StatementData {
    period: { year: number, month: number };
    status: string;
    estimateTotal: number;
    realTotal: number;
    balance: number;
    appointments: any[];
    invoice: any;
    contracts: any[];
}

export default function RecurrencePeriodDetail() {
    const { customerId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Default to current period if not provided
    const today = new Date();
    const year = searchParams.get('year') || today.getFullYear().toString();
    const month = searchParams.get('month') || (today.getMonth() + 1).toString();

    const [data, setData] = useState<StatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchStatement = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/recurrence/statement/${customerId}`, {
                params: { year, month }
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching statement:', error);
            toast.error('Erro ao carregar detalhes do fechamento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchStatement();
        }
    }, [customerId, year, month]);

    const handleClosePeriod = async () => {
        if (!confirm('Tem certeza que deseja fechar este período? Isso irá gerar a fatura final.')) return;

        setProcessing(true);
        try {
            await api.post(`/recurrence/statement/${customerId}/close`, { year, month });
            toast.success('Período fechado com sucesso!');
            fetchStatement(); // Refresh
        } catch (error) {
            console.error('Error closing period:', error);
            toast.error('Erro ao fechar período.');
        } finally {
            setProcessing(false);
        }
    };

    const handleAddAdjustment = async () => {
        const amountStr = prompt('Valor do ajuste (use negativo para desconto):');
        if (!amountStr) return;
        const amount = parseFloat(amountStr.replace(',', '.'));
        if (isNaN(amount)) return toast.error('Valor inválido');

        const description = prompt('Motivo/Descrição do ajuste:');
        if (!description) return;

        setProcessing(true);
        try {
            await api.patch(`/recurrence/statement/${customerId}`, {
                year,
                month,
                action: {
                    type: 'ADD_ADJUSTMENT',
                    amount,
                    description
                }
            });
            toast.success('Ajuste adicionado!');
            fetchStatement();
        } catch (error) {
            console.error('Error adding adjustment:', error);
            toast.error('Erro ao adicionar ajuste.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
    if (!data) return <div className="p-8 text-center">Nenhum dado encontrado.</div>;

    const isClosed = data.status === 'FECHADA' || data.status === 'EMITIDA' || data.status === 'PAGA';

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen bg-bg-page">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/staff/recurrence')}
                    className="flex items-center gap-2 text-body-secondary hover:text-heading mb-4 transition-colors"
                >
                    <ArrowLeft size={18} /> Voltar para Lista
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-heading uppercase tracking-tight">
                            Fechamento: {format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy', { locale: ptBR })}
                        </h1>
                        <p className="text-body-secondary mt-1">
                            Cliente: <span className="font-bold text-heading">{data.appointments[0]?.customer?.name || 'Cliente'}</span> | Status:
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${isClosed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                }`}>
                                {data.status}
                            </span>
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {!isClosed && (
                            <>
                                <button
                                    onClick={handleAddAdjustment}
                                    disabled={processing}
                                    className="px-4 py-2 bg-bg-surface border border-border text-heading rounded-xl font-bold hover:bg-bg-subtle transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Ajuste / Extra
                                </button>
                                <button
                                    onClick={handleClosePeriod}
                                    disabled={processing}
                                    className="px-4 py-2 bg-accent text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <CheckCircle size={18} /> Fechar Período
                                </button>
                            </>
                        )}
                        {isClosed && (
                            <button
                                disabled
                                className="px-4 py-2 bg-success/10 text-success border border-success/20 rounded-xl font-bold opacity-80 cursor-not-allowed flex items-center gap-2"
                            >
                                <Lock size={18} /> Período Fechado
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-bg-surface p-6 rounded-2xl border border-border">
                    <div className="flex items-center gap-3 mb-2 text-body-secondary">
                        <Calendar size={20} />
                        <span className="font-medium text-sm">Estimado (Contrato)</span>
                    </div>
                    <p className="text-2xl font-bold text-heading">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.estimateTotal)}
                    </p>
                </div>

                <div className="bg-bg-surface p-6 rounded-2xl border border-border ring-2 ring-accent/10">
                    <div className="flex items-center gap-3 mb-2 text-accent">
                        <DollarSign size={20} />
                        <span className="font-bold text-sm">Real (Executado)</span>
                    </div>
                    <p className="text-3xl font-bold text-accent">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.realTotal)}
                    </p>
                    <p className="text-xs text-body-secondary mt-1">
                        Inclui agendamentos e ajustes extras
                    </p>
                </div>

                <div className="bg-bg-surface p-6 rounded-2xl border border-border">
                    <div className="flex items-center gap-3 mb-2 text-body-secondary">
                        <FileText size={20} />
                        <span className="font-medium text-sm">Fatura / Saldo</span>
                    </div>
                    <p className="text-2xl font-bold text-heading">
                        {data.invoice ? data.invoice.status : 'Não gerada'}
                    </p>
                </div>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Timeline (Left - 2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-heading flex items-center gap-2">
                        <Calendar size={18} className="text-accent" />
                        Histórico de Agendamentos
                    </h3>

                    <div className="space-y-3">
                        {data.appointments.length === 0 ? (
                            <p className="text-body-secondary italic">Nenhum agendamento neste período.</p>
                        ) : (
                            data.appointments.map(app => (
                                <div
                                    key={app.id}
                                    onClick={() => app.quoteId && navigate(`/staff/quotes/${app.quoteId}`)}
                                    className="bg-bg-surface p-4 rounded-xl border border-border hover:border-accent transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="text-center w-12 pt-1">
                                                <span className="block text-[10px] font-bold text-body-secondary uppercase leading-none">{format(new Date(app.startAt), 'MMM', { locale: ptBR })}</span>
                                                <span className="block text-xl font-bold text-heading">{format(new Date(app.startAt), 'dd')}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-heading">
                                                        {app.category === 'LOGISTICA'
                                                            ? 'Transporte'
                                                            : app.services?.map((s: any) => s.name).join(', ') || 'Serviço'}
                                                    </p>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${app.status === 'CONCLUIDO' ? 'bg-success/10 text-success' : 'bg-bg-subtle text-body-secondary'}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-body-secondary mb-3">{app.pet?.name}</p>

                                                {/* Item Breakdown */}
                                                <div className="space-y-1 pl-2 border-l-2 border-border/50">
                                                    {app.posOrder?.items.map((item: any) => (
                                                        <div key={item.id} className="flex justify-between gap-8 text-[11px]">
                                                            <span className="text-body-secondary">{item.quantity}x {item.description}</span>
                                                            <span className="font-medium text-heading">R$ {item.totalPrice.toFixed(2)}</span>
                                                        </div>
                                                    )) || app.services.map((s: any) => (
                                                        <div key={s.id} className="flex justify-between gap-8 text-[11px]">
                                                            <span className="text-body-secondary">1x {s.name}</span>
                                                            <span className="font-medium text-heading">R$ {s.basePrice.toFixed(2)}</span>
                                                        </div>
                                                    ))}

                                                    {/* Transport Section - Uses servicePricing from metadata */}
                                                    {app.category === 'LOGISTICA' && (() => {
                                                        // Priority: servicePricing > transportSnapshot > transportLegs
                                                        const servicePricing = app.metadata?.servicePricing;
                                                        const snapshot = app.metadata?.transportSnapshot || app.transportSnapshot;

                                                        if (servicePricing?.length > 0) {
                                                            return (
                                                                <div className="mt-2 space-y-1">
                                                                    {servicePricing.map((sp: any, idx: number) => (
                                                                        <div key={`sp-${idx}`} className="flex justify-between gap-8 text-[11px] text-orange-600">
                                                                            <span className="font-bold">1x {sp.description || 'Transporte'}</span>
                                                                            <span className="font-bold">R$ {(parseFloat(sp.price || 0) - parseFloat(sp.discount || 0)).toFixed(2)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }

                                                        if (snapshot?.breakdown) {
                                                            return (
                                                                <div className="mt-2 space-y-1">
                                                                    {snapshot.breakdown?.largada && (
                                                                        <div className="flex justify-between gap-8 text-[10px] text-orange-600/80 italic">
                                                                            <span>↳ Largada (Base → Origem)</span>
                                                                            <span>R$ {Number(snapshot.breakdown.largada.price).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {snapshot.breakdown?.leva && (
                                                                        <div className="flex justify-between gap-8 text-[11px] text-orange-600 font-medium">
                                                                            <span className="font-bold">1x Transporte (LEVA)</span>
                                                                            <span className="font-bold">R$ {Number(snapshot.breakdown.leva.price).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {snapshot.breakdown?.traz && (
                                                                        <div className="flex justify-between gap-8 text-[11px] text-orange-600 font-medium">
                                                                            <span className="font-bold">1x Transporte (TRAZ)</span>
                                                                            <span className="font-bold">R$ {Number(snapshot.breakdown.traz.price).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                    {snapshot.breakdown?.retorno && (
                                                                        <div className="flex justify-between gap-8 text-[10px] text-orange-600/80 italic">
                                                                            <span>↳ Retorno (Destino → Base)</span>
                                                                            <span>R$ {Number(snapshot.breakdown.retorno.price).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        if (snapshot?.totalAmount) {
                                                            return (
                                                                <div className="mt-2 space-y-1">
                                                                    <div className="flex justify-between gap-8 text-[11px] text-orange-600">
                                                                        <span className="font-bold">1x Transporte (Total)</span>
                                                                        <span className="font-bold">R$ {Number(snapshot.totalAmount).toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        if (app.transportLegs?.length > 0) {
                                                            return (
                                                                <div className="mt-2 space-y-1">
                                                                    {app.transportLegs.map((l: any) => (
                                                                        <div key={l.id} className="flex justify-between gap-8 text-[11px] text-orange-600">
                                                                            <span className="font-bold">1x Transporte ({l.legType})</span>
                                                                            <span className="font-bold">R$ {l.price?.toFixed(2) || '0.00'}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }

                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-heading text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.calculatedTotal)}
                                            </p>
                                            <p className="text-[10px] text-accent font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                                Ver Detalhes →
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Adjustments Panel (Right - 1/3) */}
                <div className="space-y-6">
                    <h3 className="font-bold text-heading flex items-center gap-2">
                        <AlertCircle size={18} className="text-warning" />
                        Extras e Ajustes
                    </h3>

                    <div className="bg-bg-surface rounded-xl border border-border overflow-hidden">
                        {data.invoice?.lines?.filter((l: any) => l.sourceType === 'AJUSTE_MANUAL').length > 0 ? (
                            <div className="divide-y divide-border">
                                {data.invoice.lines
                                    .filter((l: any) => l.sourceType === 'AJUSTE_MANUAL')
                                    .map((line: any) => (
                                        <div key={line.id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-heading text-sm">{line.description}</p>
                                            </div>
                                            <p className="font-bold text-heading text-sm">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(line.total)}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-body-secondary text-sm">
                                Nenhum ajuste manual registrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
