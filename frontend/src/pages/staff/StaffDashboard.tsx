import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Truck,
    FileText,
    TrendingUp,
    ArrowRight,
    RefreshCcw,
    AlertTriangle,
    MessageSquare,
    CheckSquare,
    Users,
    PawPrint,
    DollarSign,
    XCircle,
    Clock,
    Zap,
    Target,
    Heart,
    Briefcase
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import Skeleton from '../../components/Skeleton';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import DashboardGreeting from '../../components/DashboardGreeting';
import { GoalProgressCard } from '../../components/staff/GoalProgressCard';

interface DashboardMetrics {
    todayAppointments: number;
    newQuotes: number;
    todayTransports: number;
    overdueItems: number;
    statusCounts: { status: string; _count: number }[];
    newTickets?: number;
    pendingTickets?: number;
    // New metrics
    recurrentClients: number;
    totalClientsServed: number;
    totalPetsServed: number;
    todaySpaCount: number;
    rejectedQuotes: number;
    noResponseQuotes: number;
    revenue: {
        day: number;
        week: number;
        month: number;
    };
}

interface WidgetData {
    nextAppointments: {
        id: string;
        startAt: string;
        status: string;
        pet: { name: string };
        customer: { name: string };
        services: { name: string }[];
    }[];
    myTasks: { status: string; count: number }[];
    popularPosts: {
        id: string;
        content: string;
        author: { name: string };
        reactions: any[];
        _count: { comments: number };
    }[];
}

const fetchMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get('/staff/metrics');
    return response.data;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export default function StaffDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: metrics, isLoading, isFetching } = useQuery({
        queryKey: ['staff-metrics'],
        queryFn: fetchMetrics,
        staleTime: 5 * 60 * 1000,
    });

    const { data: goals, isLoading: isLoadingGoals } = useQuery({
        queryKey: ['staff-goals'],
        queryFn: async () => {
            const response = await api.get('/goals');
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const { data: widgets, isLoading: isLoadingWidgets } = useQuery({
        queryKey: ['staff-widgets'],
        queryFn: async (): Promise<WidgetData> => {
            const response = await api.get('/staff/widgets');
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['staff-goals'] });
        queryClient.invalidateQueries({ queryKey: ['staff-widgets'] });
    };

    const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN' || user?.role === 'GESTAO';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <main className="p-4 md:p-6 lg:p-8 space-y-8 bg-gray-50/50 dark:bg-transparent min-h-screen">
            <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <Breadcrumbs />
                    <DashboardGreeting
                        name={user?.name || user?.email || 'Colaborador'}
                        subtitle="Dashboard de Performance & Operações"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="p-3 bg-white dark:bg-gray-800 text-gray-400 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:text-primary hover:border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Atualizar Dados"
                    >
                        <RefreshCcw size={20} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                    {isMaster && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                            <Zap size={14} />
                            Faturamento Ativo
                        </div>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-3xl animate-pulse" />)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-white dark:bg-gray-800 rounded-3xl animate-pulse" />)}
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* 🎯 Strategic Goals Section */}
                    {goals && goals.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <div className="flex items-center gap-2">
                                    <Target size={18} className="text-primary" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Minhas Metas & Objetivos</h2>
                                </div>
                                {isMaster && (
                                    <button
                                        onClick={() => navigate('/staff/strategy')}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Gerenciar Metas
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.map((goal: any) => (
                                    <GoalProgressCard key={goal.id} goal={goal} />
                                ))}
                            </div>
                        </section>
                    )}
                    {/* 💰 Financial Section (Admin/Management Only) */}
                    {isMaster && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <DollarSign size={18} className="text-emerald-500" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Performance Financeira</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Faturamento Hoje', value: metrics?.revenue.day || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                    { label: 'Faturamento Semana', value: metrics?.revenue.week || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                                    { label: 'Faturamento Mês', value: metrics?.revenue.month || 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                                ].map((fin, idx) => (
                                    <SpotlightCard key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{fin.label}</p>
                                                <h3 className={`text-2xl font-black ${fin.color}`}>{formatCurrency(fin.value)}</h3>
                                            </div>
                                            <div className={`p-3 ${fin.bg} rounded-2xl`}>
                                                <DollarSign size={20} className={fin.color} />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-gray-50 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '70%' }}
                                                    className={`h-full ${fin.color.replace('text', 'bg')}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400">Objetivo</span>
                                        </div>
                                    </SpotlightCard>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 🚀 Operational Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 ml-1">
                            <Zap size={18} className="text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Operações do Dia</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {[
                                {
                                    label: 'SPA Hoje',
                                    value: metrics?.todaySpaCount || 0,
                                    icon: <PawPrint size={22} className="text-secondary dark:text-white" />,
                                    color: 'bg-primary-light',
                                    link: '/staff/kanban',
                                    trend: 'Finalizar Atendimentos'
                                },
                                {
                                    label: 'Transporte Hoje',
                                    value: metrics?.todayTransports || 0,
                                    icon: <Truck size={22} className="text-orange-600" />,
                                    color: 'bg-orange-50 dark:bg-orange-500/10',
                                    link: '/staff/transport',
                                    trend: 'Check-in de Rotas'
                                },
                                {
                                    label: 'Novos Orçamentos',
                                    value: metrics?.newQuotes || 0,
                                    icon: <FileText size={22} className="text-blue-600" />,
                                    color: 'bg-blue-50 dark:bg-blue-500/10',
                                    link: '/staff/quotes',
                                    trend: 'Converter agora',
                                    urgent: (metrics?.newQuotes || 0) > 3
                                },
                                {
                                    label: 'Alertas / Pendente',
                                    value: metrics?.overdueItems || 0,
                                    icon: <AlertTriangle size={22} className="text-red-500" />,
                                    color: 'bg-red-50 dark:bg-red-500/10',
                                    link: '/staff/quotes',
                                    trend: 'Ações imediatas',
                                    urgent: (metrics?.overdueItems || 0) > 0
                                },
                                {
                                    label: 'Tickets Suporte',
                                    value: (metrics?.newTickets || 0) + (metrics?.pendingTickets || 0),
                                    icon: <MessageSquare size={22} className="text-purple-600" />,
                                    color: 'bg-purple-50 dark:bg-purple-500/10',
                                    link: '/staff/support',
                                    trend: 'Ver chamados',
                                    urgent: (metrics?.newTickets || 0) > 0
                                }
                            ].map((card, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <SpotlightCard
                                        onClick={() => navigate(card.link)}
                                        className={`bg-white dark:bg-gray-800 p-6 rounded-[32px] border ${card.urgent ? 'border-red-200 dark:border-red-800 bg-red-50/20' : 'border-gray-100 dark:border-gray-700'} shadow-sm group hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden h-full`}
                                    >
                                        <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            {card.icon}
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</p>
                                        <h3 className={`text-4xl font-black ${card.urgent ? 'text-red-600 dark:text-red-400' : 'text-secondary dark:text-white'}`}>{card.value}</h3>
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-gray-400 group-hover:text-primary transition-colors">
                                            {card.trend} <ArrowRight size={12} className="group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </SpotlightCard>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* 👥 Customer & Sales Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Customer Growth */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <Users size={18} className="text-primary" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Base de Clientes & Pets</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Total Clientes', value: metrics?.totalClientsServed || 0, icon: <Users size={20} />, sub: 'Base Ativa' },
                                    { label: 'Total Pets', value: metrics?.totalPetsServed || 0, icon: <PawPrint size={20} />, sub: 'Atendidos' },
                                    { label: 'Recorrentes', value: metrics?.recurrentClients || 0, icon: <RefreshCcw size={20} />, sub: 'Fidelizados' },
                                ].map((stat, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
                                        <div className="p-3 bg-primary/5 text-primary rounded-full mb-3">
                                            {stat.icon}
                                        </div>
                                        <h4 className="text-2xl font-black text-secondary dark:text-white">{stat.value}</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                                        <p className="text-[9px] text-gray-400 italic mt-2">{stat.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Kanban Quick Info */}
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    Funil de Atendimento (Próximos 7 dias)
                                </h3>
                                <div className="space-y-6">
                                    {metrics?.statusCounts?.map((s, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                                                <span className="text-gray-500">{s.status}</span>
                                                <span className="text-secondary dark:text-white font-black">{s._count}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(s._count / (metrics?.todayAppointments || 1)) * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 🚫 Retention / Conversion Block */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <XCircle size={18} className="text-red-500" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Conversão & Retenção</h2>
                            </div>
                            <div className="space-y-4">
                                <SpotlightCard className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Orçamentos Recusados</p>
                                        <div className="flex items-end gap-2">
                                            <h3 className="text-4xl font-black text-secondary dark:text-white">{metrics?.rejectedQuotes || 0}</h3>
                                            <span className="text-xs text-gray-400 mb-2 font-bold opacity-60">Perda Potencial</span>
                                        </div>
                                    </div>
                                    <XCircle size={60} className="absolute -right-4 -bottom-4 text-red-500/5" />
                                </SpotlightCard>

                                <SpotlightCard className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Sem Retorno (+3 dias)</p>
                                        <div className="flex items-end gap-2">
                                            <h3 className="text-4xl font-black text-secondary dark:text-white">{metrics?.noResponseQuotes || 0}</h3>
                                            <span className="text-xs text-gray-400 mb-2 font-bold opacity-60">Follow-up Pendente</span>
                                        </div>
                                    </div>
                                    <Clock size={60} className="absolute -right-4 -bottom-4 text-orange-500/5" />
                                </SpotlightCard>

                            </div>
                        </div>
                    </div>

                    {/* 🏠 My Workspace / Personal Widgets */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 ml-1">
                            <Briefcase size={18} className="text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Meu Espaço de Trabalho</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Next Appointments */}
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={20} className="text-primary" />
                                        Minha Agenda Próxima
                                    </div>
                                    <button
                                        onClick={() => navigate('/staff/agenda')}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Ver Tudo
                                    </button>
                                </h3>

                                {/* Status Counters for User */}
                                {!isLoadingWidgets && widgets?.myTasks && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {widgets.myTasks.map((task, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600/50">
                                                <span className="text-[10px] font-black text-secondary dark:text-white">{task.count}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{task.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {isLoadingWidgets ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-pulse" />)
                                    ) : widgets?.nextAppointments.length === 0 ? (
                                        <p className="text-center py-8 text-gray-400 text-sm italic">Nenhum atendimento agendado para você no momento.</p>
                                    ) : (
                                        widgets?.nextAppointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/[0.02] transition-all"
                                            >
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/5 text-primary">
                                                    <span className="text-[10px] font-black uppercase leading-none">{format(new Date(apt.startAt), 'MMM', { locale: ptBR })}</span>
                                                    <span className="text-lg font-black">{format(new Date(apt.startAt), 'dd')}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-secondary dark:text-white truncate flex items-center gap-2">
                                                        {apt.pet.name} <span className="text-gray-300 font-normal">|</span> {apt.customer.name}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate">
                                                        {apt.services.map(s => s.name).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-secondary dark:text-white">
                                                        {format(new Date(apt.startAt), 'HH:mm')}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Popular Posts */}
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={20} className="text-primary" />
                                        Mural de Destaques
                                    </div>
                                    <button
                                        onClick={() => navigate('/staff/mural')}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        Ir para o Mural
                                    </button>
                                </h3>

                                <div className="space-y-4">
                                    {isLoadingWidgets ? (
                                        [1, 2].map(i => <div key={i} className="h-24 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-pulse" />)
                                    ) : widgets?.popularPosts.length === 0 ? (
                                        <p className="text-center py-8 text-gray-400 text-sm italic">Nenhum post em destaque no momento.</p>
                                    ) : (
                                        widgets?.popularPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                className="p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-700/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer"
                                                onClick={() => navigate('/staff/mural')}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                                        {post.author.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-black text-secondary dark:text-white">{post.author.name}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Heart size={14} className="text-red-400 fill-red-400" /> {post.reactions.length}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare size={14} /> {post._count.comments} comentários
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </motion.div>
            )
            }
        </main >
    );
}

