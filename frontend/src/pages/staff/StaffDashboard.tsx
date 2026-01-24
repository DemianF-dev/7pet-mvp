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
    Users,
    PawPrint,
    DollarSign,
    XCircle,
    Clock,
    Zap,
    Target,
    Heart,
    Briefcase,
    ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import DashboardGreeting from '../../components/DashboardGreeting';
import { GoalProgressCard } from '../../components/staff/GoalProgressCard';
import { Card, Badge, IconButton, Button } from '../../components/ui';

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

    const { data: goals } = useQuery({
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
        <main className="p-4 md:p-6 w-full space-y-4 flex-1">
            <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <Breadcrumbs />
                    <DashboardGreeting
                        name={user?.name || user?.email || 'Colaborador'}
                        subtitle="Dashboard de Performance & Operações"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <IconButton
                        icon={RefreshCcw}
                        aria-label="Atualizar Dados"
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className={isFetching ? 'animate-spin' : ''}
                        variant="secondary"
                    />
                    {isMaster && (
                        <Badge variant="default" className="hidden md:flex gap-1.5 px-4 py-2 border-none">
                            <Zap size={14} fill="currentColor" />
                            FATURAMENTO ATIVO
                        </Badge>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="space-y-6">
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
                    className="space-y-4"
                >
                    {/* 🎯 Strategic Goals Section */}
                    {goals && goals.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Faturamento Hoje', value: metrics?.revenue?.day || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                                    { label: 'Faturamento Semana', value: metrics?.revenue?.week || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                                    { label: 'Faturamento Mês', value: metrics?.revenue?.month || 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
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
                            <Zap size={18} className="text-[var(--color-accent-primary)]" />
                            <h2 className="text-sm font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)]">Operações do Dia</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                                {
                                    label: 'SPA Hoje',
                                    value: metrics?.todaySpaCount || 0,
                                    icon: <PawPrint size={22} />,
                                    color: 'text-[var(--color-accent-primary)]',
                                    bg: 'bg-[var(--color-accent-primary-alpha)]',
                                    link: '/staff/kanban',
                                    trend: 'Finalizar Atendimentos'
                                },
                                {
                                    label: 'Transporte Hoje',
                                    value: metrics?.todayTransports || 0,
                                    icon: <Truck size={22} />,
                                    color: 'text-orange-600',
                                    bg: 'bg-orange-500/10',
                                    link: '/staff/transport',
                                    trend: 'Check-in de Rotas'
                                },
                                {
                                    label: 'Novos Orçamentos',
                                    value: metrics?.newQuotes || 0,
                                    icon: <FileText size={22} />,
                                    color: 'text-blue-600',
                                    bg: 'bg-blue-500/10',
                                    link: '/staff/quotes',
                                    trend: 'Converter agora',
                                    urgent: (metrics?.newQuotes || 0) > 3
                                },
                                {
                                    label: 'Alertas / Pendente',
                                    value: metrics?.overdueItems || 0,
                                    icon: <AlertTriangle size={22} />,
                                    color: 'text-red-500',
                                    bg: 'bg-red-500/10',
                                    link: '/staff/quotes',
                                    trend: 'Ações imediatas',
                                    urgent: (metrics?.overdueItems || 0) > 0
                                },
                                {
                                    label: 'Tickets Suporte',
                                    value: (metrics?.newTickets || 0) + (metrics?.pendingTickets || 0),
                                    icon: <MessageSquare size={22} />,
                                    color: 'text-purple-600',
                                    bg: 'bg-purple-500/10',
                                    link: '/staff/support',
                                    trend: 'Ver chamados',
                                    urgent: (metrics?.newTickets || 0) > 0
                                },
                                {
                                    label: 'PDV / Caixa',
                                    value: 'ABERTO',
                                    icon: <ShoppingCart size={22} />,
                                    color: 'text-emerald-500',
                                    bg: 'bg-emerald-500/10',
                                    link: '/staff/pos',
                                    trend: 'Iniciar Nova Venda'
                                }
                            ].map((card, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <Card
                                        onClick={() => navigate(card.link)}
                                        className={`p-4 border transition-all cursor-pointer relative overflow-hidden h-full flex flex-col justify-between ${card.urgent ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border)]'}`}
                                        hover
                                    >
                                        <div>
                                            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                                                {card.icon}
                                            </div>
                                            <p className="text-[var(--color-text-tertiary)] font-[var(--font-weight-black)] uppercase tracking-widest text-[9px] mb-1">{card.label}</p>
                                            <h3 className={`text-4xl font-[var(--font-weight-black)] ${card.urgent ? 'text-red-600' : 'text-[var(--color-text-primary)]'}`}>{card.value}</h3>
                                        </div>
                                        <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                                            {card.trend} <ArrowRight size={12} className="group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* 👥 Customer & Sales Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Customer Growth */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-[var(--color-accent-primary)]" />
                                <h2 className="text-sm font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)]">Base de Clientes & Pets</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Clientes', value: metrics?.totalClientsServed || 0, icon: <Users size={20} />, sub: 'Base Ativa' },
                                    { label: 'Total Pets', value: metrics?.totalPetsServed || 0, icon: <PawPrint size={20} />, sub: 'Atendidos' },
                                    { label: 'Recorrentes', value: metrics?.recurrentClients || 0, icon: <RefreshCcw size={20} />, sub: 'Fidelizados' },
                                ].map((stat, idx) => (
                                    <Card key={idx} className="p-4 flex flex-col items-center text-center">
                                        <div className="p-3 bg-[var(--color-accent-primary-alpha)] text-[var(--color-accent-primary)] rounded-full mb-2">
                                            {stat.icon}
                                        </div>
                                        <h4 className="text-2xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{stat.value}</h4>
                                        <p className="text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)] mt-1">{stat.label}</p>
                                        <p className="text-[9px] text-[var(--color-text-tertiary)] italic mt-2">{stat.sub}</p>
                                    </Card>
                                ))}
                            </div>

                            {/* Kanban Quick Info */}
                            <Card className="p-5">
                                <h3 className="text-lg font-[var(--font-weight-bold)] mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-[var(--color-accent-primary)]" />
                                    Funil de Atendimento (Próximos 7 dias)
                                </h3>
                                <div className="space-y-4">
                                    {metrics?.statusCounts?.map((s, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between text-[11px] font-[var(--font-weight-black)] uppercase tracking-wider">
                                                <span className="text-[var(--color-text-tertiary)]">{s.status}</span>
                                                <span className="text-[var(--color-text-primary)] font-[var(--font-weight-black)]">{s._count}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-[var(--color-fill-secondary)] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(s._count / (metrics?.todayAppointments || 1)) * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-primary-alpha)] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* 🚫 Retention / Conversion Block */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 ml-1">
                                <XCircle size={18} className="text-[var(--color-error)]" />
                                <h2 className="text-sm font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)]">Conversão & Retenção</h2>
                            </div>
                            <div className="space-y-3">
                                <Card className="p-4 relative overflow-hidden" hover>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-error)] mb-1">Orçamentos Recusados</p>
                                        <div className="flex items-end gap-2">
                                            <h3 className="text-4xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{metrics?.rejectedQuotes || 0}</h3>
                                            <span className="text-xs text-[var(--color-text-tertiary)] mb-2 font-bold opacity-60">Perda Potencial</span>
                                        </div>
                                    </div>
                                    <XCircle size={60} className="absolute -right-4 -bottom-4 text-[var(--color-error)] opacity-5" />
                                </Card>

                                <Card className="p-4 relative overflow-hidden" hover>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest text-orange-400 mb-1">Sem Retorno (+3 dias)</p>
                                        <div className="flex items-end gap-2">
                                            <h3 className="text-4xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{metrics?.noResponseQuotes || 0}</h3>
                                            <span className="text-xs text-[var(--color-text-tertiary)] mb-2 font-bold opacity-60">Follow-up Pendente</span>
                                        </div>
                                    </div>
                                    <Clock size={60} className="absolute -right-4 -bottom-4 text-orange-400 opacity-5" />
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* 🏠 My Workspace / Personal Widgets */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 ml-1">
                            <Briefcase size={18} className="text-[var(--color-accent-primary)]" />
                            <h2 className="text-sm font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)]">Meu Espaço de Trabalho</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Next Appointments */}
                            <Card className="p-5">
                                <h3 className="text-lg font-[var(--font-weight-bold)] mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={20} className="text-[var(--color-accent-primary)]" />
                                        Minha Agenda Próxima
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/staff/agenda')}
                                        className="text-[10px] uppercase font-[var(--font-weight-black)] tracking-widest"
                                    >
                                        Ver Tudo
                                    </Button>
                                </h3>

                                {/* Status Counters for User */}
                                {!isLoadingWidgets && widgets?.myTasks && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {widgets.myTasks.map((task, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-fill-secondary)] border border-[var(--color-border)]">
                                                <span className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{task.count}</span>
                                                <span className="text-[9px] font-[var(--font-weight-bold)] uppercase tracking-wider text-[var(--color-text-tertiary)]">{task.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {isLoadingWidgets ? (
                                        [1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--color-fill-secondary)] rounded-2xl animate-pulse" />)
                                    ) : widgets?.nextAppointments.length === 0 ? (
                                        <p className="text-center py-8 text-[var(--color-text-tertiary)] text-sm italic">Nenhum atendimento agendado para você no momento.</p>
                                    ) : (
                                        widgets?.nextAppointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-[var(--color-accent-primary-alpha)] hover:bg-[var(--color-accent-primary-alpha)]/5 transition-all"
                                            >
                                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent-primary-alpha)] text-[var(--color-accent-primary)]">
                                                    <span className="text-[10px] font-[var(--font-weight-black)] uppercase leading-none">{format(new Date(apt.startAt), 'MMM', { locale: ptBR })}</span>
                                                    <span className="text-lg font-[var(--font-weight-black)]">{format(new Date(apt.startAt), 'dd')}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-[var(--color-text-primary)] truncate flex items-center gap-2">
                                                        {apt.pet.name} <span className="text-[var(--color-border)] font-normal">|</span> {apt.customer.name}
                                                    </h4>
                                                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium truncate">
                                                        {apt.services.map(s => s.name).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                                                        {format(new Date(apt.startAt), 'HH:mm')}
                                                    </span>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Badge variant="neutral" size="sm" className="text-[8px] px-1.5 py-0.5">
                                                            {apt.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* Popular Posts */}
                            <Card className="p-5">
                                <h3 className="text-lg font-[var(--font-weight-bold)] mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={20} className="text-[var(--color-accent-primary)]" />
                                        Mural de Destaques
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/staff/mural')}
                                        className="text-[10px] uppercase font-[var(--font-weight-black)] tracking-widest"
                                    >
                                        Ir para o Mural
                                    </Button>
                                </h3>

                                <div className="space-y-3">
                                    {isLoadingWidgets ? (
                                        [1, 2].map(i => <div key={i} className="h-24 bg-[var(--color-fill-secondary)] rounded-2xl animate-pulse" />)
                                    ) : widgets?.popularPosts.length === 0 ? (
                                        <p className="text-center py-8 text-[var(--color-text-tertiary)] text-sm italic">Nenhum post em destaque no momento.</p>
                                    ) : (
                                        widgets?.popularPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                className="p-4 rounded-2xl bg-[var(--color-fill-secondary)] border border-transparent hover:border-[var(--color-accent-primary-alpha)] transition-all cursor-pointer"
                                                onClick={() => navigate('/staff/mural')}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary-alpha)] flex items-center justify-center text-[10px] font-[var(--font-weight-black)] text-[var(--color-accent-primary)] uppercase">
                                                        {post.author.name.charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{post.author.name}</span>
                                                </div>
                                                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed mb-4">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--color-text-tertiary)]">
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
                            </Card>
                        </div>
                    </section>
                </motion.div>
            )}
        </main>
    );
}
