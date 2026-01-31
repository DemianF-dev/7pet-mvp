import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ArrowRight, PawPrint, Truck,
    FileText, ShoppingCart, AlertTriangle, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { MobileShell } from '../../../layouts/MobileShell';

const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg ${className}`} />
);

export const MobileDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN' || user?.role === 'GESTAO';

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['staff-metrics'],
        queryFn: async () => (await api.get('/staff/metrics')).data,
        staleTime: 5 * 60 * 1000,
    });

    const { data: widgets } = useQuery({
        queryKey: ['staff-widgets'],
        queryFn: async () => (await api.get('/staff/widgets')).data,
        staleTime: 5 * 60 * 1000,
    });

    const quickActions = [
        { label: 'Novo Agendamento', icon: Calendar, path: '/staff/agenda', color: 'bg-blue-600 text-white' },
        { label: 'Nova Venda', icon: ShoppingCart, path: '/staff/pos', color: 'bg-emerald-600 text-white' }
    ];

    return (
        <MobileShell title="Hoje">
            <div className="space-y-6 pb-6">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Olá, {user?.firstName || 'Colaborador'} 👋
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map(action => (
                            <button
                                key={action.label}
                                onClick={() => navigate(action.path)}
                                className={`${action.color} p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/5 active:scale-95 transition-transform`}
                            >
                                <action.icon size={18} strokeWidth={2.5} />
                                <span className="text-xs font-bold uppercase tracking-wide">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Resumo do Dia</h3>
                        <span className="text-xs text-blue-600 font-semibold">{format(new Date(), "dd 'de' MMM", { locale: ptBR })}</span>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="mobile-card !mb-0 flex flex-col justify-between" onClick={() => navigate('/staff/kanban')}>
                                <div className="flex justify-between items-start">
                                    <PawPrint size={20} className="text-blue-500" />
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.todaySpaCount || 0}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-2">SPA / Banho</span>
                            </div>

                            <div className="mobile-card !mb-0 flex flex-col justify-between" onClick={() => navigate('/staff/transport')}>
                                <div className="flex justify-between items-start">
                                    <Truck size={20} className="text-orange-500" />
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.todayTransports || 0}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-2">Logística</span>
                            </div>

                            {isMaster && (
                                <div className="col-span-2 mobile-card bg-gradient-to-r from-emerald-500 to-teal-600 text-white !mb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Faturamento Hoje</p>
                                            <h3 className="text-2xl font-black">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics?.revenue?.day || 0)}
                                            </h3>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <DollarSign size={24} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Próximos Agendamentos</h3>
                        <button onClick={() => navigate('/staff/agenda')} className="text-xs font-bold text-blue-600">Ver Agenda</button>
                    </div>

                    <div className="space-y-3">
                        {widgets?.nextAppointments?.length === 0 && (
                            <div className="mobile-card flex flex-col items-center justify-center py-8 text-center">
                                <Calendar size={32} className="text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">Nenhum agendamento próximo.</p>
                            </div>
                        )}

                        {widgets?.nextAppointments?.map((apt: any) => (
                            <div key={apt.id} className="mobile-card !p-3 flex items-center gap-4 !mb-0 active:scale-[0.98] transition-transform" onClick={() => navigate('/staff/agenda')}>
                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                    <span className="text-[10px] font-bold uppercase">{format(new Date(apt.startAt), 'MMM', { locale: ptBR })}</span>
                                    <span className="text-lg font-black">{format(new Date(apt.startAt), 'dd')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{apt.pet.name}</h4>
                                        <span className="text-xs font-bold text-gray-900">{format(new Date(apt.startAt), 'HH:mm')}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{apt.customer.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{apt.services.map((s: any) => s.name).join(', ')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {(metrics?.newQuotes > 0 || metrics?.overdueItems > 0) && (
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Atenção Necessária</h3>
                        <div className="space-y-2">
                            {metrics.newQuotes > 0 && (
                                <button onClick={() => navigate('/staff/quotes')} className="w-full mobile-card !p-3 flex items-center gap-3 border-l-4 border-blue-500 !mb-0">
                                    <FileText size={20} className="text-blue-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">{metrics.newQuotes} Novos Orçamentos</p>
                                        <p className="text-xs text-gray-500">Aguardando aprovação</p>
                                    </div>
                                    <ArrowRight size={16} className="ml-auto text-gray-300" />
                                </button>
                            )}
                            {metrics.overdueItems > 0 && (
                                <button onClick={() => navigate('/staff/quotes')} className="w-full mobile-card !p-3 flex items-center gap-3 border-l-4 border-red-500 !mb-0">
                                    <AlertTriangle size={20} className="text-red-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900">{metrics.overdueItems} Itens Pendentes</p>
                                        <p className="text-xs text-gray-500">Ação imediata necessária</p>
                                    </div>
                                    <ArrowRight size={16} className="ml-auto text-gray-300" />
                                </button>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </MobileShell>
    );
};
