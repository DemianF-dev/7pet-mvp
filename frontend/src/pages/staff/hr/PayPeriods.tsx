import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Calculator, Lock, FileText, Plus, Check, X, Loader2, RefreshCw } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';


interface PayPeriod {
    id: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    createdAt: string;
    statements: any[];
    adjustments: any[];
}

interface StaffProfile {
    id: string;
    department: string;
    user: { name: string };
}

export default function PayPeriods() {
    const [periods, setPeriods] = useState<PayPeriod[]>([]);
    const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
    const [generating, setGenerating] = useState(false);
    const [closing, setClosing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        type: 'monthly'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [periodsRes, staffRes] = await Promise.all([
                api.get('/hr/pay-periods'),
                api.get('/hr/staff-profiles?isActive=true')
            ]);
            setPeriods(periodsRes.data);
            setStaffProfiles(staffRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar períodos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.startDate || !formData.endDate) {
            toast.error('Selecione as datas');
            return;
        }

        try {
            await api.post('/hr/pay-periods', formData);
            toast.success('Período criado!');
            setShowCreateModal(false);
            setFormData({ startDate: '', endDate: '', type: 'monthly' });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao criar período');
        }
    };

    const handleGenerate = async (periodId: string) => {
        setGenerating(true);
        try {
            await api.post(`/hr/pay-periods/${periodId}/generate`);
            toast.success('Cálculos gerados!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao gerar cálculos');
        } finally {
            setGenerating(false);
        }
    };

    const handleClose = async (periodId: string) => {
        if (!confirm('Tem certeza? Após fechar, não será possível editar este período.')) return;

        setClosing(true);
        try {
            await api.post(`/hr/pay-periods/${periodId}/close`);
            toast.success('Período fechado!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao fechar período');
        } finally {
            setClosing(false);
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR');
    const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

    const getTotalByDepartment = (statements: any[]) => {
        const totals: Record<string, number> = {};
        for (const s of statements) {
            const dept = s.staff?.department || 'outros';
            totals[dept] = (totals[dept] || 0) + s.totalDue;
        }
        return totals;
    };

    if (loading) {
        return (
            <main className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </main>
        );
    }

    return (
        <main className="p-8 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-heading flex items-center gap-3">
                        <Calendar size={28} className="text-accent" />
                        Fechamentos
                    </h1>
                    <p className="text-body-secondary mt-1">Gerencie períodos de pagamento</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Período
                </button>
            </div>

            {/* Periods List */}
            {periods.length === 0 ? (
                <div className="surface-card p-12 text-center">
                    <Calendar size={48} className="mx-auto text-muted mb-4" />
                    <p className="text-heading font-bold mb-2">Nenhum período criado</p>
                    <p className="text-muted text-sm">Clique em "Novo Período" para começar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {periods.map(period => {
                        const totals = getTotalByDepartment(period.statements);
                        const grandTotal = period.statements.reduce((sum, s) => sum + s.totalDue, 0);

                        return (
                            <div key={period.id} className={`surface-card p-6 ${period.status === 'closed' ? 'opacity-75' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-heading">
                                                {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${period.status === 'closed'
                                                ? 'status-success-badge'
                                                : 'status-warning-surface'
                                                }`}>
                                                {period.status === 'closed' ? 'Fechado' : 'Rascunho'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted capitalize">
                                            {period.type === 'monthly' ? 'Mensal' : period.type}
                                        </p>
                                    </div>

                                    {period.status === 'draft' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleGenerate(period.id)}
                                                disabled={generating}
                                                className="flex items-center gap-2 px-4 py-2 surface-input rounded-xl text-sm font-medium hover:bg-fill-secondary"
                                            >
                                                {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                                Gerar Cálculos
                                            </button>
                                            <button
                                                onClick={() => handleClose(period.id)}
                                                disabled={closing || period.statements.length === 0}
                                                className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 disabled:opacity-50"
                                            >
                                                {closing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                                Fechar Período
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Statements Summary */}
                                {period.statements.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-border">
                                        {Object.entries(totals).map(([dept, total]) => (
                                            <div key={dept} className="surface-input p-3 rounded-xl">
                                                <p className="text-xs text-muted uppercase">{dept}</p>
                                                <p className="text-lg font-bold text-heading">{formatCurrency(total)}</p>
                                            </div>
                                        ))}
                                        <div className="surface-input p-3 rounded-xl bg-accent/10 border-accent/20">
                                            <p className="text-xs text-accent uppercase font-bold">Total</p>
                                            <p className="text-lg font-black text-accent">{formatCurrency(grandTotal)}</p>
                                        </div>
                                    </div>
                                )}

                                {period.statements.length === 0 && (
                                    <p className="text-sm text-muted mt-4 pt-4 border-t border-border">
                                        Nenhum cálculo gerado. Clique em "Gerar Cálculos" para processar.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-elevated p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-heading">Novo Período</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-muted hover:text-heading">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Tipo
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['weekly', 'biweekly', 'monthly', 'custom'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, type })}
                                            className={`py-2 px-3 rounded-xl text-sm font-medium ${formData.type === type ? 'bg-accent text-white' : 'surface-input'
                                                }`}
                                        >
                                            {type === 'weekly' && 'Semanal'}
                                            {type === 'biweekly' && 'Quinzenal'}
                                            {type === 'monthly' && 'Mensal'}
                                            {type === 'custom' && 'Personalizado'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                        Data Início
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full surface-input px-4 py-3 text-heading"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                        Data Fim
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full surface-input px-4 py-3 text-heading"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full btn-primary py-4 font-black uppercase tracking-wider"
                            >
                                Criar Período
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
