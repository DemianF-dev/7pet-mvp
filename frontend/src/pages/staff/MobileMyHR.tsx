import { useState, useEffect } from 'react';
import {
    Clock, Play, Square, CheckCircle,
    Activity, Wallet, User as UserIcon,
    Calendar, ChevronRight, FileText,
    Loader2
} from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, IconButton } from '../../components/ui';
import { toast } from 'react-hot-toast';

export const MobileMyHR = () => {
    const [profile, setProfile] = useState<any>(null);
    const [todayRecord, setTodayRecord] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [statements, setStatements] = useState<any[]>([]);
    const [serviceExecutions, setServiceExecutions] = useState<any[]>([]);
    const [transportLegs, setTransportLegs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'ponto' | 'producao' | 'financeiro'>('ponto');

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

    useEffect(() => {
        fetchData();
    }, []);

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
            toast.success('Check-out realizado!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro no check-out');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasCheckedIn = !!todayRecord?.checkInAt;
    const hasCheckedOut = !!todayRecord?.checkOutAt;
    const isWorkingNow = hasCheckedIn && !hasCheckedOut;

    return (
        <MobileShell
            title="Meu Espaço RH"
            rightAction={
                <IconButton icon={UserIcon} variant="ghost" className="text-gray-400" aria-label="Perfil" />
            }
        >
            <div className="p-4 space-y-6">
                {/* 1. Header Card (Attendance) */}
                <Card className="!p-6 !bg-secondary !border-none !text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center text-center py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <h2 className="text-5xl font-black mb-1">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <p className="text-xs font-bold opacity-70 mb-6 uppercase tracking-widest">
                            Olá, {profile?.userId || 'Colaborador'}
                        </p>

                        {hasCheckedOut ? (
                            <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-2 mb-6">
                                <CheckCircle size={20} className="text-green-400" />
                                <span className="font-black text-xs uppercase tracking-widest">Expediente Encerrado</span>
                            </div>
                        ) : isWorkingNow ? (
                            <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-2 mb-6">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="font-black text-xs uppercase tracking-widest">Em Jornada de Trabalho</span>
                            </div>
                        ) : (
                            <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-2 mb-6">
                                <Clock size={20} className="text-blue-400" />
                                <span className="font-black text-xs uppercase tracking-widest">Aguardando Início</span>
                            </div>
                        )}

                        {!hasCheckedOut && (
                            <button
                                onClick={isWorkingNow ? handleCheckOut : handleCheckIn}
                                disabled={actionLoading}
                                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-95 ${isWorkingNow ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-primary text-white shadow-lg shadow-primary/30'
                                    }`}
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : isWorkingNow ? (
                                    <><Square size={24} strokeWidth={3} /> Finalizar</>
                                ) : (
                                    <><Play size={24} fill="currentColor" /> Iniciar</>
                                )}
                            </button>
                        )}
                    </div>
                </Card>

                {/* 2. Tabs */}
                <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl">
                    {[
                        { id: 'ponto', label: 'Ponto', icon: Clock },
                        { id: 'producao', label: 'Produção', icon: Activity },
                        { id: 'financeiro', label: 'Pagamentos', icon: Wallet }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm'
                                    : 'text-gray-400'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. Content */}
                <div className="space-y-4 pb-20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'ponto' && (
                            <motion.div
                                key="ponto"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center justify-between px-2 mb-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Histórico Recente</h3>
                                </div>
                                {attendanceHistory.length === 0 ? (
                                    <div className="py-10 text-center text-gray-400">Nenhum registro encontrado.</div>
                                ) : (
                                    attendanceHistory.slice(0, 5).map((rec: any) => (
                                        <div key={rec.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-gray-400">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary dark:text-white uppercase leading-tight">
                                                        {new Date(rec.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                                                        {rec.status === 'ok' ? 'Dia completo' : 'Incompleto'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-secondary dark:text-white">
                                                    {rec.checkInAt ? new Date(rec.checkInAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400">
                                                    {rec.checkOutAt ? new Date(rec.checkOutAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'producao' && (
                            <motion.div
                                key="producao"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                {serviceExecutions.map(exec => (
                                    <div key={exec.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-secondary dark:text-white uppercase leading-tight">{exec.service?.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{exec.appointment?.pet?.name} • {new Date(exec.executedAt).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                        <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-widest">SPA</Badge>
                                    </div>
                                ))}
                                {transportLegs.map(leg => (
                                    <div key={leg.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-secondary dark:text-white uppercase leading-tight">
                                                        {leg.legType === 'pickup' ? 'Busca (Leva)' : 'Entrega (Traz)'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(leg.completedAt).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="neutral" className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">TRANSPORTE</Badge>
                                        </div>
                                        <div className="pt-2 border-t border-gray-50 dark:border-zinc-800 flex justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pet / Tutor</p>
                                                <p className="text-[10px] font-bold text-secondary dark:text-white truncate">
                                                    {leg.appointment?.pet?.name || '-'} / {leg.appointment?.customer?.name || '-'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Orçamento</p>
                                                <p className="text-[10px] font-bold text-secondary dark:text-white">
                                                    #{leg.appointment?.quote?.seqId || '---'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'financeiro' && (
                            <motion.div
                                key="financeiro"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                {statements.map(statement => (
                                    <div key={statement.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 flex items-center justify-between active:scale-[0.98] transition-transform">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
                                                <Wallet size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-secondary dark:text-white uppercase leading-tight">Período Fechado</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                                    {new Date(statement.payPeriod.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-green-600">R$ {statement.totalDue.toFixed(2)}</p>
                                            <div className="flex justify-end gap-2 mt-1">
                                                <IconButton icon={FileText} size="sm" variant="ghost" className="text-gray-400" aria-label="Ver detalhes" />
                                                <ChevronRight size={16} className="text-gray-300" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MobileShell>
    );
};
