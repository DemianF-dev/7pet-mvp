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
    Clock,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Skeleton from '../../components/Skeleton';
import { NotificationControlPanel } from '../../components/admin/NotificationControlPanel';
import { UserNotificationMatrix } from '../../components/admin/UserNotificationMatrix';
import { useAuthStore } from '../../store/authStore';

// Use CSS variable-based colors from design system
const COLORS = [
    'var(--color-accent-primary)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-error)',
    'var(--color-indigo)',
    'var(--color-pink)'
];

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
        trend: { date: string; amount: number }[];
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
    const { user } = useAuthStore();
    const isMaster = user?.role === 'MASTER';

    useEffect(() => {
        console.log('[Dashboard] User:', user);
        console.log('[Dashboard] Role:', user?.role);
        console.log('[Dashboard] isMaster:', isMaster);
    }, [user, isMaster]);

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

    useEffect(() => {
        console.log('[Dashboard] User Debug:', JSON.stringify(user, null, 2));
    }, [user]);

    const kpisLoaded = kpis && kpis.revenue && kpis.revenue.trend;
    const chartData = kpisLoaded ? kpis.revenue.trend.map(item => ({
        ...item,
        formattedDate: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    })) : [];

    const pieData = kpisLoaded ? kpis.appointments.distribution.map(item => ({
        name: item.status,
        value: item._count
    })) : [];

    const barData = kpis?.services?.slice(0, 5) || [];

    if (isLoading) {
        return (
            <main className="p-6 md:p-10" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <header className="mb-10">
                    <Skeleton variant="text" className="w-64 h-10 mb-4" />
                    <Skeleton variant="text" className="w-96 h-4" />
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="p-8 rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] h-48 flex flex-col justify-center gap-4"
                            style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
                        >
                            <Skeleton variant="rounded" className="w-12 h-12" />
                            <Skeleton variant="text" className="w-24 h-4" />
                            <Skeleton variant="text" className="w-32 h-8" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div
                        className="lg:col-span-2 p-8 rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)] h-[400px]"
                        style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <Skeleton variant="rounded" className="w-full h-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton variant="rounded" className="h-[300px]" />
                        <Skeleton variant="rounded" className="h-[200px]" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="p-6 md:p-10" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
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
                    {/* Revenue Trend Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                                <BarChart2 className="text-primary" size={20} />
                                Tendência de Receita (30 dias)
                            </h2>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                Total: R$ {kpis?.revenue.current.toLocaleString('pt-BR')}
                            </span>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="formattedDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                                        tickFormatter={(value) => `R$ ${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#FFF',
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                        formatter={(value) => [`R$ ${value}`, 'Receita']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAmount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution Pie Chart */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-secondary mb-8 flex items-center gap-2">
                            <Activity className="text-primary" size={20} />
                            Status dos Atendimentos
                        </h2>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#FFF',
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {pieData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-500 font-bold uppercase tracking-widest">{item.name}</span>
                                    </div>
                                    <span className="font-black text-secondary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Services Bar Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-secondary mb-8 flex items-center gap-2">
                            <CheckCircle2 className="text-primary" size={20} />
                            Serviços Mais Populares
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={150}
                                        tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F9FAFB' }}
                                        contentStyle={{
                                            backgroundColor: '#FFF',
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[0, 10, 10, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Customers & Alerts */}
                    <div className="space-y-6">
                        <div className="bg-secondary p-8 rounded-[40px] text-white shadow-xl flex flex-col justify-between h-[300px]">
                            <div>
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <BarChart2 className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-2">Insight do Mês</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Seu faturamento cresceu <span className="text-primary font-bold">{kpis?.revenue.growth?.toFixed(1) || '0.0'}%</span> em relação ao mês anterior.
                                    Continue focando em serviços de alto valor agregado para aumentar seu Ticket Médio.
                                </p>
                            </div>
                            <button className="mt-6 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all text-sm uppercase tracking-widest">
                                Ver Relatório <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <h2 className="text-lg font-black text-secondary mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Users className="text-primary" size={20} />
                                Top 5 Clientes
                            </h2>
                            <div className="space-y-4">
                                {kpis?.topCustomers.map((c, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-secondary">{c.name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Gasto</span>
                                        </div>
                                        <span className="text-sm font-black text-primary">R$ {c.totalSpent.toLocaleString('pt-BR')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Control Panel - MASTER ONLY */}
                {isMaster && (
                    <>
                        <div className="mt-12">
                            <NotificationControlPanel />
                        </div>
                        <div className="mt-8">
                            <UserNotificationMatrix />
                        </div>
                    </>
                )}
            </div>


            {/* Debug Info */}
            <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                <p>Debug Info:</p>
                <p>User: {user?.email}</p>
                <p>Role: {user?.role}</p>
                <p>Is Master: {isMaster ? 'YES' : 'NO'}</p>
            </div>
        </main >
    );
}

function KPICard({ title, value, growth, icon, bg, isCurrency, isPercent }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] flex flex-col gap-4 relative overflow-hidden group transition-all duration-[var(--duration-normal)]"
            style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
            }}
            whileHover={{
                scale: 1.02,
                boxShadow: 'var(--shadow-lg)',
            }}
        >
            <div
                className={`w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-[var(--duration-fast)]`}
                style={{ backgroundColor: bg ? undefined : 'var(--color-fill-secondary)' }}
            >
                {icon}
            </div>
            <div>
                <p
                    className="text-[var(--font-size-caption2)] font-[var(--font-weight-semibold)] uppercase tracking-widest mb-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    {title}
                </p>
                <h3
                    className="text-[var(--font-size-title1)] font-[var(--font-weight-bold)]"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    {isCurrency && 'R$ '}
                    {value.toLocaleString('pt-BR')}
                    {isPercent && '%'}
                </h3>
            </div>
            {growth !== undefined && (
                <div className="flex items-center gap-1">
                    {growth >= 0 ? (
                        <div
                            className="p-1 rounded-full"
                            style={{ backgroundColor: 'var(--color-success)', opacity: 0.1 }}
                        >
                            <ArrowUpRight size={12} style={{ color: 'var(--color-success)' }} />
                        </div>
                    ) : (
                        <div
                            className="p-1 rounded-full"
                            style={{ backgroundColor: 'var(--color-error)', opacity: 0.1 }}
                        >
                            <ArrowDownRight size={12} style={{ color: 'var(--color-error)' }} />
                        </div>
                    )}
                    <span
                        className="text-[var(--font-size-caption1)] font-[var(--font-weight-bold)]"
                        style={{ color: growth >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}
                    >
                        {Math.abs(growth)}%
                    </span>
                    <span
                        className="text-[var(--font-size-caption2)] font-[var(--font-weight-medium)] ml-1"
                        style={{ color: 'var(--color-text-tertiary)' }}
                    >
                        vs mês ant.
                    </span>
                </div>
            )}
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
