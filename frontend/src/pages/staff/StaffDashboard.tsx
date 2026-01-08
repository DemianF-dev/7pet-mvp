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
    CheckSquare
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import Skeleton from '../../components/Skeleton';
import { SpotlightCard } from '../../components/ui/SpotlightCard';

interface DashboardMetrics {
    todayAppointments: number;
    newQuotes: number;
    todayTransports: number;
    overdueItems: number;
    statusCounts: { status: string; _count: number }[];
    newTickets?: number;
    pendingTickets?: number;
}

const fetchMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get('/staff/metrics');
    return response.data;
};

export default function StaffDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: metrics, isLoading, isPlaceholderData, isFetching } = useQuery({
        queryKey: ['staff-metrics'],
        queryFn: fetchMetrics,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
    };

    const isMaster = user?.role === 'MASTER';

    const cards = [
        ...(isMaster ? [
            {
                label: 'Novos Chamados',
                value: metrics?.newTickets || 0,
                icon: <MessageSquare className="text-red-500" />,
                color: 'bg-red-50',
                link: '/staff/support',
                urgent: (metrics?.newTickets || 0) > 0
            },
            {
                label: 'Em Atendimento',
                value: metrics?.pendingTickets || 0,
                icon: <CheckSquare className="text-blue-500" />,
                color: 'bg-blue-50',
                link: '/staff/support',
                urgent: false
            }
        ] : []),
        {
            label: 'Novos Orçamentos',
            value: metrics?.newQuotes || 0,
            icon: <FileText className="text-blue-500" />,
            color: 'bg-blue-50',
            link: '/staff/quotes',
            urgent: (metrics?.newQuotes || 0) > 5
        },
        {
            label: 'Agendamentos Hoje',
            value: metrics?.todayAppointments || 0,
            icon: <Calendar className="text-primary" />,
            color: 'bg-primary-light',
            link: '/staff/kanban',
            urgent: false
        },
        {
            label: 'Transporte Hoje',
            value: metrics?.todayTransports || 0,
            icon: <Truck className="text-orange-500" />,
            color: 'bg-orange-50',
            link: '/staff/transport',
            urgent: false
        },
        {
            label: 'Ações Atrasadas',
            value: metrics?.overdueItems || 0,
            icon: <AlertTriangle className="text-red-500" />,
            color: 'bg-red-50',
            link: '/staff/quotes',
            urgent: (metrics?.overdueItems || 0) > 0
        }
    ];

    return (
        <div className="min-h-screen flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-10">
                    <div>
                        <Breadcrumbs />
                        <h1 className="text-4xl font-extrabold text-secondary dark:text-white">Dashboard <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Operacional</span></h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-3">Métricas globais e acesso rápido aos processos.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className="p-3 bg-white dark:bg-gray-800 text-gray-400 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:text-primary hover:border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Atualizar Dados"
                    >
                        <RefreshCcw size={20} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                </header>


                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col justify-center">
                                <Skeleton variant="rounded" className="w-14 h-14 mb-6" />
                                <Skeleton variant="text" className="w-20 h-2 mb-2" />
                                <Skeleton variant="rounded" className="w-12 h-10" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cards.map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="h-full"
                                >
                                    <SpotlightCard
                                        onClick={() => navigate(card.link)}
                                        className={`bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm border ${card.urgent ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-50 dark:border-gray-700'
                                            } group hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden text-left w-full h-full`}
                                        spotlightColor="rgba(var(--color-primary-rgb), 0.1)"
                                    >
                                        <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                            {card.icon}
                                        </div>
                                        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">{card.label}</p>
                                        <h3 className={`text-4xl font-black ${card.urgent ? 'text-red-600 dark:text-red-400' : 'text-secondary dark:text-white'
                                            }`}>{card.value}</h3>
                                        {card.urgent && (
                                            <div className="absolute top-4 right-4">
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition-opacity">
                                            {card.icon}
                                        </div>
                                    </SpotlightCard>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Activity / Status Board */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-secondary dark:text-white mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-primary" size={20} />
                                    Distribuição (Próximos 7 dias)
                                </h2>
                                <div className="space-y-4">
                                    {metrics?.statusCounts?.map((s, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                                    <span className="text-gray-400 dark:text-gray-500">{s.status}</span>
                                                    <span className="text-secondary dark:text-white">{s._count}</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(s._count / (metrics?.todayAppointments || 1)) * 100}%` }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!metrics?.statusCounts || metrics.statusCounts.length === 0) && (
                                        <p className="text-center text-gray-400 py-10 italic">Nenhum dado para exibir no momento.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-secondary dark:bg-gray-900 p-10 rounded-[48px] text-white shadow-2xl shadow-secondary/20 dark:shadow-none flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-black mb-4">Módulo de IA em treinamento</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Em breve, usaremos inteligência artificial para otimizar suas rotas de transporte e prever horários de pico.
                                    </p>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-secondary bg-primary-light" />
                                        ))}
                                    </div>
                                    <button className="text-primary font-bold flex items-center gap-2 group text-sm">
                                        Saiba mais <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
