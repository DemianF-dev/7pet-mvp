import { useState, useEffect } from 'react';
import {
    DollarSign,
    Users,
    AlertCircle,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    BarChart2,
    Activity,
    RefreshCw,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

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
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

interface ManagementKPIs {
    revenue: {
        current: number;
        previous: number;
        growth: number;
    };
    appointments: {
        distribution: { status: string; _count: number }[];
        total: number;
    };
    services: { name: string; count: number }[];
    growth: {
        newCustomers: number;
    };
    alerts: {
        blockedCustomers: number;
        highValueQuotes: number;
    };
    ticketMedio: number;
    noShowRate: number;
    pendingBalance: number;
    topCustomers: { name: string; totalSpent: number }[];
}

export default function ManagementDashboard() {
    const [kpis, setKpis] = useState<ManagementKPIs | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchKPIs = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/management/kpis');
            setKpis(response.data);
        } catch (err) {
            console.error('Erro ao buscar KPIs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <StaffSidebar />
                <main className="flex-1 md:ml-64 p-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-secondary">Painel de <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Gestão</span></h1>
                            <p className="text-gray-500 mt-3 font-medium">Análise de desempenho, financeiro e crescimento.</p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={fetchKPIs}
                                className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-colors text-secondary font-bold text-sm"
                                title="Atualizar Dados"
                            >
                                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                Atualizar
                            </button>

                            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-bold text-secondary">Dados em tempo real</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-10">
                    {/* High Level Cards */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Faturamento (Mês)"
                                value={kpis?.revenue.current || 0}
                                isCurrency
                                growth={kpis?.revenue.growth || 0}
                                icon={<DollarSign className="text-green-500" />}
                                bg="bg-green-50"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Ticket Médio (30d)"
                                value={kpis?.ticketMedio || 0}
                                isCurrency
                                icon={<Activity className="text-blue-500" />}
                                bg="bg-blue-50"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Taxa de No-Show"
                                value={kpis?.noShowRate || 0}
                                isPercent
                                icon={<AlertCircle className="text-red-500" />}
                                bg="bg-red-50"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Receita Pendente"
                                value={kpis?.pendingBalance || 0}
                                isCurrency
                                icon={<Clock className="text-orange-500" />}
                                bg="bg-orange-50"
                            />
                        </motion.div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Distribution */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-secondary mb-8 flex items-center gap-2">
                                <Activity className="text-primary" size={20} />
                                Status dos Atendimentos (Últimos 30 dias)
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {kpis?.appointments.distribution.map((s, idx) => (
                                    <div key={idx} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                                        <span className="text-2xl font-black text-secondary mb-1">{s._count}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.status}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10">
                                <h3 className="text-sm font-bold text-secondary mb-6 uppercase tracking-widest">Serviços Mais Procurados</h3>
                                <div className="space-y-4">
                                    {kpis?.services.map((s, idx) => (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-secondary">{s.name}</span>
                                                <span className="text-primary">{s.count} atendimentos</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(s.count / (Math.max(...kpis.services.map(i => i.count)) || 1)) * 100}%` }}
                                                    className="h-full bg-primary group-hover:bg-primary-dark transition-colors"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Alerts & Insights */}
                        <div className="space-y-6">
                            <div className="bg-secondary p-8 rounded-[40px] text-white shadow-xl flex flex-col justify-between h-[300px]">
                                <div>
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                        <BarChart2 className="text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">Insight do Mês</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Seu faturamento cresceu <span className="text-primary font-bold">{kpis?.revenue.growth?.toFixed(1) || '0.0'}%</span> em relação ao mês anterior.
                                        O serviço de Banho & Tosa continua sendo o seu maior motor de crescimento.
                                    </p>
                                </div>
                                <button className="mt-6 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all text-sm uppercase tracking-widest">
                                    Ver Relatório <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-2 uppercase tracking-tight">
                                    <Users className="text-primary" size={20} />
                                    Top 5 Clientes (Faturamento)
                                </h2>
                                <div className="space-y-4">
                                    {kpis?.topCustomers.map((c, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-secondary">{c.name}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Acumulado</span>
                                            </div>
                                            <span className="text-sm font-black text-primary">R$ {c.totalSpent.toLocaleString('pt-BR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-2 uppercase tracking-tight">
                                    <AlertCircle className="text-red-500" size={20} />
                                    Alertas Críticos
                                </h2>
                                <div className="space-y-4">
                                    <AlertItem
                                        label="Clientes Bloqueados"
                                        count={kpis?.alerts.blockedCustomers || 0}
                                        urgent={kpis?.alerts.blockedCustomers ? kpis.alerts.blockedCustomers > 5 : false}
                                    />
                                    <AlertItem
                                        label="Orçamentos de Alto Valor"
                                        count={kpis?.alerts.highValueQuotes || 0}
                                        urgent={kpis?.alerts.highValueQuotes ? kpis.alerts.highValueQuotes > 2 : false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function KPICard({ title, value, growth, icon, bg, isCurrency, isPercent }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/20 transition-all"
        >
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-secondary">
                    {isCurrency && 'R$ '}
                    {value.toLocaleString('pt-BR')}
                    {isPercent && '%'}
                </h3>
            </div>
            <div className="flex items-center gap-1">
                {growth >= 0 ? (
                    <div className="bg-green-100 text-green-600 p-1 rounded-full"><ArrowUpRight size={12} /></div>
                ) : (
                    <div className="bg-red-100 text-red-600 p-1 rounded-full"><ArrowDownRight size={12} /></div>
                )}
                <span className={`text-xs font-black ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(growth)}%
                </span>
                <span className="text-[10px] text-gray-400 font-bold ml-1">vs mês ant.</span>
            </div>
        </motion.div>
    );
}

function AlertItem({ label, count, urgent }: { label: string, count: number, urgent: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${urgent ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <span className={`text-[11px] font-bold uppercase ${urgent ? 'text-red-600' : 'text-gray-500'}`}>{label}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${urgent ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {count}
            </span>
        </div>
    );
}
