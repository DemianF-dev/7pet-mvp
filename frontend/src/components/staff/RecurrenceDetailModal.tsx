import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Package, CheckCircle2, Clock, AlertTriangle, PlayCircle, PauseCircle, Trash2, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
    contractId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function RecurrenceDetailModal({ contractId, onClose, onUpdate }: Props) {
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [contractId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/recurrence/contracts/${contractId}/details`);
            setContract(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar detalhes do contrato.');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string, actionName: string) => {
        if (!window.confirm(`Tem certeza que deseja ${actionName} este contrato?`)) return;

        setProcessing(true);
        try {
            await api.patch(`/recurrence/contracts/${contractId}/status`, {
                status: newStatus,
                reason: `Alteração manual via painel pelo usuário`
            });
            toast.success(`Contrato ${newStatus.toLowerCase()} com sucesso!`);
            fetchDetails();
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar status.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
                <div className="bg-bg-surface w-full max-w-4xl h-[80vh] rounded-[32px] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!contract) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-surface w-full max-w-4xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-8 border-b border-border flex items-start justify-between bg-bg-subtle/30">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${contract.status === 'ATIVO' ? 'bg-success/10 text-success border-success/20' :
                                    contract.status === 'PAUSADO' ? 'bg-warning/10 text-warning border-warning/20' :
                                        'bg-danger/10 text-danger border-danger/20'
                                }`}>
                                {contract.status}
                            </div>
                            <span className="text-sm font-bold text-body-secondary uppercase tracking-wider">{contract.type}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-heading uppercase tracking-tight">{contract.title}</h2>
                        <p className="text-body-secondary mt-1 max-w-2xl">{contract.notes || 'Sem observações.'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-subtle rounded-full text-body-secondary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-bg-subtle/50 p-4 rounded-2xl border border-border">
                                <p className="text-xs font-bold text-body-secondary uppercase">Frequência</p>
                                <p className="text-lg font-bold text-heading mt-1">{contract.frequency}</p>
                            </div>
                            <div className="bg-bg-subtle/50 p-4 rounded-2xl border border-border">
                                <p className="text-xs font-bold text-body-secondary uppercase">Dia Venc.</p>
                                <p className="text-lg font-bold text-heading mt-1">Dia {contract.billingDay}</p>
                            </div>
                            <div className="bg-bg-subtle/50 p-4 rounded-2xl border border-border">
                                <p className="text-xs font-bold text-body-secondary uppercase">Criado em</p>
                                <p className="text-lg font-bold text-heading mt-1">{format(new Date(contract.createdAt), 'dd/MM/yy')}</p>
                            </div>
                            <div className="bg-bg-subtle/50 p-4 rounded-2xl border border-border">
                                <p className="text-xs font-bold text-body-secondary uppercase">Desconto</p>
                                <p className="text-lg font-bold text-heading mt-1">{contract.defaultDiscountPercent}%</p>
                            </div>
                        </div>

                        {/* Recent Appointments */}
                        <div>
                            <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-accent" />
                                Histórico Recente
                            </h3>
                            <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
                                {contract.recentAppointments && contract.recentAppointments.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-bg-subtle text-body-secondary font-bold uppercase text-xs border-b border-border">
                                            <tr>
                                                <th className="p-4">Data</th>
                                                <th className="p-4">Pet</th>
                                                <th className="p-4">Serviços</th>
                                                <th className="p-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {contract.recentAppointments.map((appt: any) => (
                                                <tr key={appt.id} className="hover:bg-bg-subtle/30 transition-colors">
                                                    <td className="p-4 font-bold text-heading">
                                                        {format(new Date(appt.startAt), "dd/MM/yy 'às' HH:mm")}
                                                    </td>
                                                    <td className="p-4 text-body-secondary">{appt.pet?.name || '-'}</td>
                                                    <td className="p-4 text-body-secondary line-clamp-1 max-w-[200px]">
                                                        {appt.services?.map((s: any) => s.name).join(', ') || '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${appt.status === 'CONFIRMADO' ? 'bg-success/10 text-success' :
                                                                appt.status === 'CANCELADO' ? 'bg-danger/10 text-danger' :
                                                                    'bg-warning/10 text-warning'
                                                            }`}>
                                                            {appt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-body-secondary">
                                        Nenhum agendamento recente vinculado a faturas deste contrato.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Invoices */}
                        <div>
                            <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                                <DollarSign size={20} className="text-accent" />
                                Faturas Geradas
                            </h3>
                            <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
                                {contract.invoices && contract.invoices.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {contract.invoices.map((inv: any) => (
                                            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-bg-subtle/30 transition-colors">
                                                <div>
                                                    <p className="font-bold text-heading">Fatura #{String(inv.seqId || inv.id.slice(0, 4)).toUpperCase()}</p>
                                                    <p className="text-xs text-body-secondary">Vencimento: {format(new Date(inv.dueDate), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-heading">R$ {inv.amount.toFixed(2)}</p>
                                                    <span className={`text-xs font-bold ${inv.status === 'PAGO' ? 'text-success' :
                                                            inv.status === 'PENDENTE' ? 'text-warning' : 'text-danger'
                                                        }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-body-secondary">
                                        Nenhuma fatura gerada para este contrato ainda.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="bg-bg-subtle/30 p-6 rounded-[24px] border border-border">
                            <h4 className="font-bold text-heading mb-4 uppercase text-xs tracking-widest">Ações do Contrato</h4>

                            <div className="space-y-3">
                                {contract.status === 'ATIVO' && (
                                    <button
                                        onClick={() => handleStatusChange('PAUSADO', 'pausar')}
                                        disabled={processing}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-surface border border-border hover:border-warning hover:text-warning transition-all font-bold text-sm text-heading shadow-sm"
                                    >
                                        <PauseCircle size={18} /> Pausar Contrato
                                    </button>
                                )}

                                {contract.status === 'PAUSADO' && (
                                    <button
                                        onClick={() => handleStatusChange('ATIVO', 'reativar')}
                                        disabled={processing}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-surface border border-border hover:border-success hover:text-success transition-all font-bold text-sm text-heading shadow-sm"
                                    >
                                        <PlayCircle size={18} /> Reativar Contrato
                                    </button>
                                )}

                                {contract.status !== 'CANCELADO' && (
                                    <button
                                        onClick={() => handleStatusChange('CANCELADO', 'cancelar')}
                                        disabled={processing}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-surface border border-border hover:border-danger hover:text-danger transition-all font-bold text-sm text-heading shadow-sm"
                                    >
                                        <XCircle size={18} /> Cancelar Contrato
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-accent/5 p-6 rounded-[24px] border border-accent/10">
                            <h4 className="font-bold text-accent mb-4 uppercase text-xs tracking-widest">Ferramentas Rápidas</h4>
                            <p className="text-sm text-body-secondary mb-4">Ações rápidas para gestão do dia a dia deste contrato.</p>

                            <button className="w-full bg-accent text-white py-3 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform flex items-center justify-center gap-2 mb-3">
                                <Package size={18} /> Gerar Nova Fatura
                            </button>

                            <button className="w-full bg-white text-accent border border-accent/20 py-3 rounded-xl font-bold hover:bg-accent/5 transition-colors flex items-center justify-center gap-2">
                                <Calendar size={18} /> Ver Agenda Completa
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
