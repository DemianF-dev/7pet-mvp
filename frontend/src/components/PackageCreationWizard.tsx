import React, { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Info,
    Clock,
    DollarSign,
    Package,
    AlertCircle
} from 'lucide-react';
import api from '../services/api'; // Corrected path
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WizardProps {
    customerId: string;
    contractId?: string;
    type: 'SPA' | 'TRANSPORTE';
    onClose: () => void;
    onSuccess: (invoice: any) => void;
}

export default function PackageCreationWizard({ customerId, contractId, type, onClose, onSuccess }: WizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Period
    const now = new Date();
    const [period, setPeriod] = useState({
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });

    // Step 2: Selection
    const [appointments, setAppointments] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [fetchingAppointments, setFetchingAppointments] = useState(false);

    // Fetch eligible appointments when entering step 2
    useEffect(() => {
        if (step === 2) {
            const fetchEligible = async () => {
                setFetchingAppointments(true);
                try {
                    const response = await api.get('/recurrence/invoices/eligible-appointments', {
                        params: {
                            customerId,
                            type,
                            periodYear: period.year,
                            periodMonth: period.month
                        }
                    });
                    setAppointments(response.data);
                    // Auto-select all by default
                    setSelectedIds(response.data.map((a: any) => a.id));
                } catch (error) {
                    toast.error('Erro ao buscar agendamentos elegíveis.');
                } finally {
                    setFetchingAppointments(false);
                }
            };
            fetchEligible();
        }
    }, [step, customerId, type, period]);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const response = await api.post('/recurrence/invoices', {
                customerId,
                contractId,
                type,
                periodYear: period.year,
                periodMonth: period.month,
                appointmentIds: selectedIds
            });
            toast.success('Pacote gerado com sucesso!');
            onSuccess(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao gerar pacote.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const subtotal = appointments
        .filter(a => selectedIds.includes(a.id))
        .reduce((sum, a) => sum + (a.services?.reduce((sSum: number, s: any) => sSum + s.basePrice, 0) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-surface border border-border w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-bg-subtle/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 text-accent rounded-xl">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-heading uppercase tracking-tight">Gerar Pacote Mensal</h2>
                            <p className="text-xs text-body-secondary font-medium">{type} • Passo {step} de 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-body-secondary hover:text-heading transition-colors font-bold text-sm">Voltar</button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-border w-full flex">
                    <div className="bg-accent transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-accent/5 p-4 rounded-2xl flex gap-3 border border-accent/10">
                                <Info className="text-accent shrink-0" size={20} />
                                <p className="text-sm text-accent font-medium">Selecione o período de referência para este pacote. O sistema buscará agendamentos realizados neste intervalo.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-heading">Mês</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-border bg-bg-surface outline-none focus:ring-2 focus:ring-accent"
                                        value={period.month}
                                        onChange={(e) => setPeriod({ ...period, month: parseInt(e.target.value) })}
                                    >
                                        {months.map((m, i) => (
                                            <option key={m} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-heading">Ano</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-border bg-bg-surface outline-none focus:ring-2 focus:ring-accent"
                                        value={period.year}
                                        onChange={(e) => setPeriod({ ...period, year: parseInt(e.target.value) })}
                                    >
                                        {[2024, 2025, 2026].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {fetchingAppointments ? (
                                <div className="py-20 text-center">
                                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-body-secondary">Buscando agendamentos...</p>
                                </div>
                            ) : appointments.length === 0 ? (
                                <div className="py-12 text-center bg-bg-subtle rounded-2xl border border-dashed border-border px-8">
                                    <Calendar className="mx-auto text-body-secondary mb-4 opacity-20" size={48} />
                                    <p className="font-bold text-heading">Nenhum agendamento encontrado</p>
                                    <p className="text-sm text-body-secondary">Não existem agendamentos de {type} para este cliente no período selecionado que ainda não estejam em um pacote.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold text-heading">{appointments.length} agendamentos encontrados</p>
                                        <button
                                            onClick={() => setSelectedIds(selectedIds.length === appointments.length ? [] : appointments.map(a => a.id))}
                                            className="text-xs text-accent font-bold hover:underline"
                                        >
                                            {selectedIds.length === appointments.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {appointments.map(appt => (
                                            <div
                                                key={appt.id}
                                                onClick={() => toggleSelection(appt.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${selectedIds.includes(appt.id)
                                                        ? 'bg-accent/5 border-accent shadow-sm'
                                                        : 'bg-bg-surface border-border hover:border-body-secondary'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedIds.includes(appt.id) ? 'bg-accent border-accent text-white' : 'border-border bg-bg-subtle'
                                                    }`}>
                                                    {selectedIds.includes(appt.id) && <CheckCircle2 size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-heading">
                                                            {format(new Date(appt.startAt), "dd/LL/yy 'às' HH:mm", { locale: ptBR })}
                                                        </span>
                                                        <span className="text-xs text-body-secondary font-mono">
                                                            R$ {(appt.services?.reduce((sum: number, s: any) => sum + s.basePrice, 0) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-body-secondary truncate">
                                                        {appt.pet?.name} • {appt.services?.map((s: any) => s.name).join(', ') || 'Serviço s/ nome'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-heading">Pronto para gerar!</h3>
                                <p className="text-sm text-body-secondary">Revise os dados abaixo antes de confirmar o faturamento.</p>
                            </div>

                            <div className="bg-bg-subtle border border-border rounded-2xl p-5 space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <span className="text-sm text-body-secondary flex items-center gap-2">
                                        <Calendar size={16} /> Período
                                    </span>
                                    <span className="text-sm font-bold text-heading">{months[period.month - 1]} / {period.year}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <span className="text-sm text-body-secondary flex items-center gap-2">
                                        <Clock size={16} /> Agendamentos
                                    </span>
                                    <span className="text-sm font-bold text-heading">{selectedIds.length} itens selecionados</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-sm font-bold text-heading flex items-center gap-2">
                                        <DollarSign size={16} /> Total Estimado
                                    </span>
                                    <span className="text-lg font-black text-accent tracking-tighter">
                                        R$ {subtotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-warning/5 border border-warning/20 p-4 rounded-xl flex gap-3">
                                <AlertCircle className="text-warning shrink-0" size={20} />
                                <p className="text-xs text-warning font-medium">Ao confirmar, os agendamentos serão vinculados a esta fatura e não poderão ser vinculados a outra.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-bg-subtle/50 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="flex items-center gap-2 text-sm font-bold text-body-secondary hover:text-heading transition-colors"
                        disabled={loading}
                    >
                        <ChevronLeft size={18} /> {step === 1 ? 'Cancelar' : 'Anterior'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 2 && selectedIds.length === 0}
                            className="flex items-center gap-2 bg-heading text-bg-surface px-6 py-2.5 rounded-2xl font-bold hover:opacity-90 transition-all disabled:opacity-30"
                        >
                            Próximo <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="bg-accent text-white px-8 py-2.5 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Gerando...' : 'Confirmar e Gerar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
