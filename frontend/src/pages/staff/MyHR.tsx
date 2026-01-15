import { useState, useEffect } from 'react';
import { Clock, Play, Square, CheckCircle, Calendar, TrendingUp, FileText, Receipt, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
    id: string;
    date: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    status: string;
    notes?: string;
}

interface PayStatement {
    id: string;
    baseTotal: number;
    adjustmentsTotal: number;
    totalDue: number;
    generatedAt: string;
    payPeriod: {
        startDate: string;
        endDate: string;
        type: string;
        status: string;
    };
}

interface ServiceExecution {
    id: string;
    executedAt: string;
    notes: string | null;
    appointmentId: string;
    service: { name: string } | null;
    appointment: { id: string, pet: { name: string } } | null;
}

interface TransportLeg {
    id: string;
    completedAt: string;
    legType: 'pickup' | 'dropoff';
    notes: string | null;
    appointment: {
        pet: { name: string },
        customer: { name: string },
        quote: { seqId: string, totalAmount: number } | null
    } | null;
}



export default function MyHR() {
    const [profile, setProfile] = useState<any>(null);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [statements, setStatements] = useState<PayStatement[]>([]);
    const [serviceExecutions, setServiceExecutions] = useState<ServiceExecution[]>([]);
    const [transportLegs, setTransportLegs] = useState<TransportLeg[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'ponto' | 'producao' | 'recebimentos'>('ponto');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, todayRes, attendanceRes, statementsRes, sevRes, legsRes] = await Promise.all([
                api.get('/hr/staff-profiles/me'),
                api.get('/hr/attendance/today'),
                api.get('/hr/attendance/me'),
                api.get('/hr/pay-statements/me'),
                api.get('/hr/service-executions'),
                api.get('/hr/transport-legs')
            ]);
            setProfile(profileRes.data);
            setTodayRecord(todayRes.data);
            setAttendanceHistory(attendanceRes.data);
            setStatements(statementsRes.data);

            setServiceExecutions(sevRes.data.filter((e: any) => e.staffId === profileRes.data.id));
            setTransportLegs(legsRes.data.filter((e: any) => e.staffId === profileRes.data.id));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setActionLoading(true);
        try {
            await api.post('/hr/attendance/check-in');
            toast.success('Check-in realizado!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro no check-in');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setActionLoading(true);
        try {
            await api.post('/hr/attendance/check-out');
            toast.success('Check-out realizado! Bom descanso!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro no check-out');
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <main className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="surface-card p-12 text-center">
                        <Clock size={48} className="mx-auto text-muted mb-4" />
                        <h2 className="text-xl font-bold text-heading mb-2">Perfil não encontrado</h2>
                        <p className="text-muted">
                            Você não possui um perfil de colaborador cadastrado.
                            Entre em contato com a gestão.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Determine check-in/out status
    const hasCheckedIn = !!todayRecord?.checkInAt;
    const hasCheckedOut = !!todayRecord?.checkOutAt;
    const isWorkingNow = hasCheckedIn && !hasCheckedOut;

    // Calculate Monthly Metrics
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyDailies = attendanceHistory.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.status === 'ok';
    }).length;

    const monthlyServiceAppointments = new Set(
        serviceExecutions
            .filter(e => {
                const d = new Date(e.executedAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .map(e => e.appointmentId || e.appointment?.id)
            .filter(Boolean)
    ).size;

    const monthlyPickups = transportLegs.filter(l => {
        const d = new Date(l.completedAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && l.legType === 'pickup';
    }).length;

    const monthlyDropoffs = transportLegs.filter(l => {
        const d = new Date(l.completedAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && l.legType === 'dropoff';
    }).length;

    const isTransport = profile.department === 'transport';
    const isAtendimento = profile.department === 'atendimento' || profile.department === 'spa' || profile.department === 'gestao' || profile.department === 'comercial';

    return (
        <main className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-heading">Meu RH</h1>
                    <p className="text-body-secondary">
                        {profile.department.toUpperCase()} • {profile.payModel === 'daily' ? 'Diária' : 'Pernada'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'ponto', label: 'Meu Ponto', icon: Clock },
                        { id: 'producao', label: 'Minha Produção', icon: TrendingUp },
                        { id: 'recebimentos', label: 'Meus Recebimentos', icon: Receipt }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-accent text-white'
                                : 'surface-input text-body-secondary hover:text-heading'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* PONTO TAB */}
                {activeTab === 'ponto' && (
                    <div className="space-y-6">
                        {/* Today Card */}
                        <div className={`surface-card p-8 text-center ${isWorkingNow ? 'ring-2 ring-success' : ''}`}>
                            <div className="mb-6">
                                <p className="text-xs font-black text-muted uppercase tracking-widest mb-2">
                                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <p className="text-5xl font-black text-heading">
                                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* Status */}
                            {hasCheckedOut ? (
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 status-success-surface rounded-full">
                                        <CheckCircle size={20} />
                                        <span className="font-bold">Dia concluído!</span>
                                    </div>
                                    <div className="mt-4 text-body-secondary">
                                        <p>Entrada: <strong>{formatTime(todayRecord!.checkInAt!)}</strong></p>
                                        <p>Saída: <strong>{formatTime(todayRecord!.checkOutAt!)}</strong></p>
                                    </div>
                                </div>
                            ) : isWorkingNow ? (
                                <div className="mb-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 status-info-surface rounded-full mb-2">
                                        <div className="w-2 h-2 bg-info rounded-full animate-pulse" />
                                        <span className="font-bold">Trabalhando</span>
                                    </div>
                                    <p className="text-body-secondary">
                                        Entrada às <strong>{formatTime(todayRecord!.checkInAt!)}</strong>
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <p className="text-muted">Você ainda não registrou ponto hoje</p>
                                </div>
                            )}

                            {/* Action Button */}
                            {!hasCheckedOut && (
                                <button
                                    onClick={isWorkingNow ? handleCheckOut : handleCheckIn}
                                    disabled={actionLoading}
                                    className={`w-full max-w-xs mx-auto py-5 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${isWorkingNow
                                        ? 'bg-error hover:bg-error/90 text-white'
                                        : 'bg-success hover:bg-success/90 text-white'
                                        } ${actionLoading ? 'opacity-50' : ''}`}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : isWorkingNow ? (
                                        <>
                                            <Square size={24} />
                                            Finalizar Dia
                                        </>
                                    ) : (
                                        <>
                                            <Play size={24} />
                                            Iniciar Dia
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Info */}
                        <div className="surface-card p-6">
                            <p className="text-xs text-muted text-center">
                                💡 Lembre-se de registrar seu ponto todos os dias para garantir o cálculo correto do seu pagamento.
                            </p>
                        </div>
                    </div>
                )}

                {/* PRODUCAO TAB */}
                {activeTab === 'producao' && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="grid grid-cols-2 gap-4">
                            {isTransport ? (
                                <>
                                    <div className="surface-card p-4 text-center">
                                        <p className="text-3xl font-black text-heading">{monthlyPickups}</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Levas (Mês)</p>
                                    </div>
                                    <div className="surface-card p-4 text-center">
                                        <p className="text-3xl font-black text-heading">{monthlyDropoffs}</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Traz (Mês)</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="surface-card p-4 text-center">
                                        <p className="text-3xl font-black text-heading">{monthlyDailies}</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Diárias (Mês)</p>
                                    </div>
                                    <div className="surface-card p-4 text-center">
                                        <p className="text-3xl font-black text-heading">{monthlyServiceAppointments}</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Agendamentos (Mês)</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-heading px-1">Registros Recentes</h3>

                            {serviceExecutions.length === 0 && transportLegs.length === 0 ? (
                                <div className="surface-card p-8 text-center">
                                    <TrendingUp size={32} className="mx-auto text-muted mb-2" />
                                    <p className="text-muted text-sm">Nenhuma produção registrada recentemente.</p>
                                </div>
                            ) : (
                                <>
                                    {serviceExecutions.map(exec => (
                                        <div key={exec.id} className="surface-card p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center">
                                                    <TrendingUp size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-heading text-sm">{exec.service?.name || 'Serviço'}</p>
                                                    <p className="text-xs text-muted">{exec.appointment?.pet?.name} • {formatDate(exec.executedAt)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black uppercase bg-fill-secondary px-2 py-1 rounded-md">SPA</span>
                                            </div>
                                        </div>
                                    ))}

                                    {transportLegs.map(leg => (
                                        <div key={leg.id} className="surface-card p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-info/10 text-info rounded-full flex items-center justify-center">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-heading text-sm">
                                                            {leg.legType === 'pickup' ? 'Leva (Busca)' : 'Traz (Entrega)'}
                                                            {leg.notes?.includes('Largada') && <span className="ml-2 text-[10px] text-orange-500 font-black tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">LARGADA</span>}
                                                        </p>
                                                        <p className="text-xs text-muted">
                                                            {formatDate(leg.completedAt)} • {new Date(leg.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase bg-info/10 text-info px-2 py-1 rounded-md">Logística</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                                <div>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Pet / Cliente</p>
                                                    <p className="text-xs font-bold text-heading truncate">
                                                        {leg.appointment?.pet?.name || '-'} / {leg.appointment?.customer?.name || '-'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-0.5">Orçamento / Valor</p>
                                                    <p className="text-xs font-bold text-heading">
                                                        #{leg.appointment?.quote?.seqId || '---'} • R$ {leg.appointment?.quote?.totalAmount?.toFixed(2) || '0.00'}
                                                    </p>
                                                </div>
                                            </div>

                                            {leg.notes && (
                                                <p className="mt-2 text-[10px] text-muted italic">obs: {leg.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* RECEBIMENTOS TAB */}
                {activeTab === 'recebimentos' && (
                    <div className="space-y-4">
                        {statements.length === 0 ? (
                            <div className="surface-card p-8 text-center">
                                <Receipt size={48} className="mx-auto text-muted mb-4" />
                                <h3 className="text-lg font-bold text-heading mb-2">Nenhum recibo</h3>
                                <p className="text-muted">
                                    Seus recibos aparecerão aqui após o fechamento de cada período.
                                </p>
                            </div>
                        ) : (
                            statements.map(statement => (
                                <div key={statement.id} className="surface-card p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-heading">
                                            {formatDate(statement.payPeriod.startDate)} - {formatDate(statement.payPeriod.endDate)}
                                        </p>
                                        <p className="text-sm text-muted">
                                            {statement.payPeriod.type === 'monthly' ? 'Mensal' : statement.payPeriod.type}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xl font-black text-success">
                                                R$ {statement.totalDue.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {statement.payPeriod.status === 'closed' ? '✅ Fechado' : '📝 Rascunho'}
                                            </p>
                                        </div>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || ''}/hr/pay-statements/${statement.id}/receipt`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-fill-secondary rounded-lg transition-colors"
                                        >
                                            <FileText size={20} className="text-accent" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
