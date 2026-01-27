import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    CheckCircle2,
    Bell
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
import { NotificationControlPanel } from '../../components/admin/NotificationControlPanel';
import { UserNotificationMatrix } from '../../components/admin/UserNotificationMatrix';
import { useAuthStore } from '../../store/authStore';
import { Card, Badge, IconButton, Button } from '../../components/ui';
import QueryState from '../../components/system/QueryState';

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
    const navigate = useNavigate();
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

    return (
        <main className="p-[var(--space-6)] md:p-[var(--space-10)] max-w-7xl mx-auto w-full pb-28 md:pb-10 overflow-y-auto custom-scrollbar flex-1">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <BackButton className="!p-0 !m-0 !bg-transparent !border-none" />
                            <h1 className="text-3xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                                Painel de <span className="text-[var(--color-accent-primary)]">Gestão</span>
                            </h1>
                        </div>
                        <p className="text-[var(--color-text-tertiary)] font-medium">Análise de desempenho, financeiro e crescimento.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <IconButton
                            icon={RefreshCw}
                            onClick={fetchKPIs}
                            variant="secondary"
                            className={isLoading ? 'animate-spin' : ''}
                            aria-label="Atualizar Dados"
                        />

                        <Badge variant="success" className="h-11 px-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            Tempo Real
                        </Badge>

                        <Button
                            variant="primary"
                            onClick={() => navigate('/staff/marketing')}
                            icon={Bell}
                            className="hidden md:flex"
                        >
                            Marketing
                        </Button>
                    </div>
                </div>
            </header>

            <QueryState
                isLoading={isLoading}
                isEmpty={!kpis}
                error={null}
                onRetry={fetchKPIs}
            >
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
                                icon={<DollarSign className="text-[var(--color-success)]" />}
                                theme="success"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Ticket Médio (30d)"
                                value={kpis?.ticketMedio || 0}
                                isCurrency
                                icon={<Activity className="text-[var(--color-accent-primary)]" />}
                                theme="primary"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Taxa de No-Show"
                                value={kpis?.noShowRate || 0}
                                isPercent
                                icon={<AlertCircle className="text-[var(--color-error)]" />}
                                theme="error"
                            />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <KPICard
                                title="Receita Pendente"
                                value={kpis?.pendingBalance || 0}
                                isCurrency
                                icon={<Clock className="text-orange-500" />}
                                theme="warning"
                            />
                        </motion.div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Revenue Trend Chart */}
                        <Card className="lg:col-span-2 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-[var(--font-weight-bold)] text-[var(--color-text-primary)] flex items-center gap-2">
                                    <BarChart2 className="text-[var(--color-accent-primary)]" size={20} />
                                    Tendência de Receita (30 dias)
                                </h2>
                                <Badge variant="neutral" size="sm" className="font-[var(--font-weight-black)] text-[10px] uppercase tracking-widest px-3 py-1">
                                    Total: R$ {kpis?.revenue.current.toLocaleString('pt-BR')}
                                </Badge>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="formattedDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', fontWeight: 'bold' }}
                                            tickFormatter={(value) => `R$ ${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-surface)',
                                                borderRadius: 'var(--radius-xl)',
                                                border: '1px solid var(--color-border)',
                                                boxShadow: 'var(--shadow-lg)',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                            formatter={(value) => [`R$ ${value}`, 'Receita']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="var(--color-accent-primary)"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Status Distribution Pie Chart */}
                        <Card className="p-8">
                            <h2 className="text-xl font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-8 flex items-center gap-2">
                                <Activity className="text-[var(--color-accent-primary)]" size={20} />
                                Status de Atendimentos
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
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-surface)',
                                                borderRadius: 'var(--radius-xl)',
                                                border: '1px solid var(--color-border)',
                                                boxShadow: 'var(--shadow-lg)',
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
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-[var(--color-text-tertiary)] font-[var(--font-weight-bold)] uppercase tracking-widest">{item.name}</span>
                                        </div>
                                        <span className="font-[var(--font-weight-black)] text-[var(--color-text-primary)]">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Services Bar Chart */}
                        <Card className="lg:col-span-2 p-8">
                            <h2 className="text-xl font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-8 flex items-center gap-2">
                                <CheckCircle2 className="text-[var(--color-accent-primary)]" size={20} />
                                Serviços Mais Populares
                            </h2>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={150}
                                            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontWeight: 'bold' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'var(--color-fill-secondary)' }}
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-surface)',
                                                borderRadius: 'var(--radius-xl)',
                                                border: '1px solid var(--color-border)',
                                                boxShadow: 'var(--shadow-lg)',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="var(--color-accent-primary)" radius={[0, 10, 10, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Top Customers & Alerts */}
                        <div className="flex flex-col gap-8">
                            <Card className="p-8 bg-[var(--color-accent-primary)] text-white relative overflow-hidden flex flex-col justify-between h-[300px]">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                        <BarChart2 className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-[var(--font-weight-black)] mb-2">Insight do Mês</h3>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        Seu faturamento cresceu <span className="text-white font-bold">{kpis?.revenue.growth?.toFixed(1) || '0.0'}%</span> em relação ao mês anterior.
                                        Foque em serviços de alto valor para aumentar o Ticket Médio.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="mt-6 border-white/20 text-white hover:bg-white/10 w-fit"
                                    size="sm"
                                    onClick={() => { }}
                                >
                                    Ver Relatório <ChevronRight size={16} className="ml-2" />
                                </Button>
                                <Activity size={180} className="absolute -right-16 -bottom-16 text-white opacity-5" />
                            </Card>

                            <Card className="p-8">
                                <h2 className="text-lg font-[var(--font-weight-black)] text-[var(--color-text-primary)] mb-6 flex items-center gap-2 uppercase tracking-tight">
                                    <Users className="text-[var(--color-accent-primary)]" size={20} />
                                    Top 5 Clientes
                                </h2>
                                <div className="space-y-4">
                                    {kpis?.topCustomers.map((c, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-[var(--color-fill-secondary)] rounded-2xl transition-colors border border-transparent hover:border-[var(--color-border)]">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-[var(--font-weight-bold)] text-[var(--color-text-primary)]">{c.name}</span>
                                                <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">Total Gasto</span>
                                            </div>
                                            <span className="text-sm font-[var(--font-weight-black)] text-[var(--color-accent-primary)]">R$ {c.totalSpent.toLocaleString('pt-BR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Notification Control Panel - MASTER ONLY */}
                    {isMaster && (
                        <div className="space-y-8 mt-12">
                            <NotificationControlPanel />
                            <UserNotificationMatrix />
                        </div>
                    )}
                </div>
            </QueryState>


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

function KPICard({ title, value, growth, icon, isCurrency, isPercent, theme = 'primary' }: any) {
    const themeColors = {
        primary: {
            bg: 'var(--color-accent-primary-alpha)',
            text: 'var(--color-accent-primary)'
        },
        success: {
            bg: 'rgba(34, 197, 94, 0.1)',
            text: 'var(--color-success)'
        },
        error: {
            bg: 'rgba(239, 68, 68, 0.1)',
            text: 'var(--color-error)'
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            text: 'var(--color-warning)'
        }
    } as any;

    const colors = themeColors[theme] || themeColors.primary;

    return (
        <Card className="p-6 flex flex-col gap-4 relative overflow-hidden group" hover>
            <div
                className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-[var(--duration-fast)]"
                style={{ backgroundColor: colors.bg, color: colors.text }}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                    {title}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                        {isCurrency && 'R$ '}
                        {value.toLocaleString('pt-BR')}
                        {isPercent && '%'}
                    </h3>
                </div>
            </div>
            {growth !== undefined && (
                <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-[var(--color-border)]">
                    <div
                        className={`p-0.5 rounded-full ${growth >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
                    >
                        {growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <span
                        className={`text-xs font-[var(--font-weight-black)] ${growth >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}
                    >
                        {Math.abs(growth)}%
                    </span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
                        vs mês anterior
                    </span>
                </div>
            )}
        </Card>
    );
}

// Reserved for future alert notifications
void function _AlertItem({ label, count, urgent }: { label: string, count: number, urgent: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${urgent ? 'bg-[var(--color-error-alpha)] border-[var(--color-error-alpha)]' : 'bg-[var(--color-fill-secondary)] border-[var(--color-border)]'}`}>
            <span className={`text-[11px] font-[var(--font-weight-black)] uppercase tracking-wider ${urgent ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'}`}>{label}</span>
            <Badge variant={urgent ? 'error' : 'neutral'} size="sm" className="font-[var(--font-weight-black)]">
                {count}
            </Badge>
        </div>
    );
};
