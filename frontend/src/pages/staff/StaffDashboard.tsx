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
    Target
} from 'lucide-react';
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

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['staff-goals'] });
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                                <div className="bg-secondary dark:bg-gray-900 p-8 rounded-[32px] text-white shadow-xl flex flex-col justify-between h-[280px]">
                                    <div>
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                                            <TrendingUp size={20} className="text-primary" />
                                        </div>
                                        <h3 className="text-xl font-black mb-2 leading-tight">Mural Operacional</h3>
                                        <p className="text-gray-400 text-[11px] leading-relaxed">
                                            Acesse o feed para ver as últimas comunicações internas, notícias da 7Pet e atualizações dos pets.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/staff/mural')}
                                        className="mt-6 w-full py-4 bg-primary hover:bg-primary-dark text-secondary font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        Ver Mural <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </main>
    );
}

