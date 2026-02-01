import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, ArrowRight, Truck,
    FileText, ShoppingCart, AlertTriangle,
    PawPrint, DollarSign, Users, RefreshCcw,
    TrendingUp, XCircle, Clock, Target,
    MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

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

    const { data: goals } = useQuery({
        queryKey: ['staff-goals'],
        queryFn: async () => (await api.get('/staff/goals')).data,
        staleTime: 10 * 60 * 1000,
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const quickActions = [
        { label: 'Novo Agendamento', icon: Calendar, path: '/staff/agenda-spa', color: 'bg-blue-600 text-white' },
        { label: 'Nova Venda', icon: ShoppingCart, path: '/staff/pos', color: 'bg-emerald-600 text-white' }
    ];

    return (
        <div className="p-4 space-y-6 pb-20">
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

            {/* 📊 Operational Section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Operações do Dia</h3>
                    <span className="text-xs text-blue-600 font-semibold">{format(new Date(), "dd 'de' MMM", { locale: ptBR })}</span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
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

                        <div className="mobile-card !mb-0 flex flex-col justify-between border-l-4 border-blue-500" onClick={() => navigate('/staff/quotes')}>
                            <div className="flex justify-between items-start">
                                <FileText size={20} className="text-blue-500" />
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.newQuotes || 0}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 mt-2">Novos Orçamentos</span>
                        </div>

                        <div className="mobile-card !mb-0 flex flex-col justify-between border-l-4 border-red-500" onClick={() => navigate('/staff/quotes')}>
                            <div className="flex justify-between items-start">
                                <AlertTriangle size={20} className="text-red-500" />
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.overdueItems || 0}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 mt-2">Pendências</span>
                        </div>

                        {(metrics?.newTickets || 0) > 0 && (
                            <div className="col-span-2 mobile-card !mb-0 border-l-4 border-purple-500" onClick={() => navigate('/staff/support')}>
                                <div className="flex justify-between items-start">
                                    <MessageSquare size={20} className="text-purple-500" />
                                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                                        {(metrics?.newTickets || 0) + (metrics?.pendingTickets || 0)}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-gray-500 mt-2">Tickets de Suporte</span>
                            </div>
                        )}

                        {isMaster && (
                            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="mobile-card bg-gradient-to-r from-emerald-500 to-teal-600 text-white !mb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Hoje</p>
                                            <h3 className="text-xl font-black">{formatCurrency(metrics?.revenue?.day || 0)}</h3>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <DollarSign size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mobile-card bg-gradient-to-r from-blue-500 to-indigo-600 text-white !mb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Semana</p>
                                            <h3 className="text-xl font-black">{formatCurrency(metrics?.revenue?.week || 0)}</h3>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <TrendingUp size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mobile-card bg-gradient-to-r from-purple-500 to-pink-600 text-white !mb-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Mês</p>
                                            <h3 className="text-xl font-black">{formatCurrency(metrics?.revenue?.month || 0)}</h3>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-full">
                                            <Target size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* 👥 Customer Base Section */}
            {isMaster && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={18} className="text-blue-500" />
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Base de Clientes & Pets</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="mobile-card !mb-0 flex flex-col items-center text-center">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-2">
                                <Users size={16} />
                            </div>
                            <span className="text-lg font-black text-gray-900 dark:text-white">{metrics?.totalClientsServed || 0}</span>
                            <span className="text-[8px] font-medium text-gray-500 uppercase">Clientes</span>
                        </div>
                        <div className="mobile-card !mb-0 flex flex-col items-center text-center">
                            <div className="p-2 bg-green-50 text-green-600 rounded-full mb-2">
                                <PawPrint size={16} />
                            </div>
                            <span className="text-lg font-black text-gray-900 dark:text-white">{metrics?.totalPetsServed || 0}</span>
                            <span className="text-[8px] font-medium text-gray-500 uppercase">Pets</span>
                        </div>
                        <div className="mobile-card !mb-0 flex flex-col items-center text-center">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-full mb-2">
                                <RefreshCcw size={16} />
                            </div>
                            <span className="text-lg font-black text-gray-900 dark:text-white">{metrics?.recurrentClients || 0}</span>
                            <span className="text-[8px] font-medium text-gray-500 uppercase">Recorrentes</span>
                        </div>
                    </div>
                </section>
            )}

            {/* 🚫 Conversion & Retention */}
            {isMaster && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle size={18} className="text-red-500" />
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Conversão & Retenção</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="mobile-card !mb-0 border-l-4 border-red-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest">Perdas</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.rejectedQuotes || 0}</h3>
                                </div>
                                <XCircle size={20} className="text-red-500 opacity-20" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 mt-2">Orçamentos Recusados</span>
                        </div>
                        <div className="mobile-card !mb-0 border-l-4 border-orange-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest">Aguardando</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{metrics?.noResponseQuotes || 0}</h3>
                                </div>
                                <Clock size={20} className="text-orange-500 opacity-20" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 mt-2">Sem Retorno</span>
                        </div>
                    </div>
                </section>
            )}

            {/* 🎯 Goals Section */}
            {isMaster && goals && goals.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Target size={18} className="text-purple-500" />
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Metas Estratégicas</h3>
                        </div>
                        <button 
                            onClick={() => navigate('/staff/strategy')}
                            className="text-xs font-bold text-blue-600"
                        >
                            Gerenciar
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {goals.slice(0, 2).map((goal: any) => (
                            <div key={goal.id} className="mobile-card !mb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{goal.title}</h4>
                                    <span className="text-xs font-bold text-gray-500">
                                        {Math.round((goal.current / goal.target) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[8px] text-gray-500">{goal.current}</span>
                                    <span className="text-[8px] text-gray-500">{goal.target}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Próximos Agendamentos</h3>
                    <button onClick={() => navigate('/staff/agenda-spa')} className="text-xs font-bold text-blue-600">Ver Agenda</button>
                </div>

                <div className="space-y-3">
                    {widgets?.nextAppointments?.length === 0 && (
                        <div className="mobile-card flex flex-col items-center justify-center py-8 text-center">
                            <Calendar size={32} className="text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Nenhum agendamento próximo.</p>
                        </div>
                    )}

                    {widgets?.nextAppointments?.map((apt: any) => (
                        <div key={apt.id} className="mobile-card !p-3 flex items-center gap-4 !mb-0 active:scale-[0.98] transition-transform" onClick={() => navigate('/staff/agenda-spa')}>
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
    );
};
