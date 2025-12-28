import { useState, useEffect } from 'react';
import {
    Calendar,
    Truck,
    FileText,
    TrendingUp,
    ArrowRight,
    RefreshCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';

interface DashboardMetrics {
    todayAppointments: number;
    pendingQuotes: number;
    activeTransports: number;
    statusCounts: { status: string; _count: number }[];
}

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/staff/metrics');
            setMetrics(response.data);
        } catch (err) {
            console.error('Erro ao buscar métricas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const cards = [
        {
            label: 'Hoje',
            value: metrics?.todayAppointments || 0,
            icon: <Calendar className="text-primary" />,
            color: 'bg-primary-light',
            link: '/staff/kanban'
        },
        {
            label: 'Orçamentos',
            value: metrics?.pendingQuotes || 0,
            icon: <FileText className="text-blue-500" />,
            color: 'bg-blue-50',
            link: '/staff/quotes'
        },
        {
            label: 'Logística',
            value: metrics?.activeTransports || 0,
            icon: <Truck className="text-orange-500" />,
            color: 'bg-orange-50',
            link: '/staff/transport'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">Dashboard <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Operacional</span></h1>
                        <p className="text-gray-500 mt-3">Métricas globais e acesso rápido aos processos.</p>
                    </div>
                    <button
                        onClick={fetchMetrics}
                        disabled={isLoading}
                        className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 shadow-sm hover:text-primary hover:border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Atualizar Dados"
                    >
                        <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-[32px]"></div>)}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {cards.map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => navigate(card.link)}
                                    className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 group hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        {card.icon}
                                    </div>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">{card.label}</p>
                                    <h3 className="text-4xl font-black text-secondary">{card.value}</h3>
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition-opacity">
                                        {card.icon}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Recent Activity / Status Board */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                                    <TrendingUp className="text-primary" size={20} />
                                    Distribuição (Próximos 7 dias)
                                </h2>
                                <div className="space-y-4">
                                    {metrics?.statusCounts.map((s, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                                                    <span className="text-gray-400">{s.status}</span>
                                                    <span className="text-secondary">{s._count}</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(s._count / (metrics.todayAppointments || 1)) * 100}%` }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {metrics?.statusCounts.length === 0 && (
                                        <p className="text-center text-gray-300 py-10">Nenhum dado para exibir.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-secondary p-10 rounded-[48px] text-white shadow-2xl shadow-secondary/20 flex flex-col justify-between">
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
