import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialWidgetProps {
    revenue: {
        day: number;
        week: number;
        month: number;
    };
    loading?: boolean;
}

export function FinancialWidget({ revenue, loading = false }: FinancialWidgetProps) {
    const today = new Date();

    const items = [
        {
            label: 'Hoje',
            sub: format(today, "dd 'de' MMM", { locale: ptBR }),
            value: revenue.day,
            icon: DollarSign,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            gradient: 'from-emerald-500/20 to-emerald-500/5',
        },
        {
            label: 'Esta Semana',
            sub: 'Semana Atual',
            value: revenue.week,
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            gradient: 'from-blue-500/20 to-blue-500/5',
        },
        {
            label: 'Este Mês',
            sub: format(today, 'MMMM', { locale: ptBR }),
            value: revenue.month,
            icon: Calendar,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            gradient: 'from-purple-500/20 to-purple-500/5',
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 ml-1 mb-2">
                <CreditCard size={18} className="text-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    Performance Financeira
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((item, idx) => (
                    <GlassCard
                        key={idx}
                        hover
                        className={`relative overflow-hidden border-0 !bg-white/60 dark:!bg-gray-800/60`}
                    >
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-30`} />

                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                                    {item.label}
                                </p>
                                <div className="text-2xl font-bold text-[var(--color-text-primary)] flex items-baseline gap-1">
                                    <span className="text-sm font-medium text-[var(--color-text-tertiary)]">R$</span>
                                    <AnimatedCounter value={item.value} decimals={2} />
                                </div>
                                <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium mt-1">
                                    {item.sub}
                                </p>
                            </div>

                            <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                <item.icon size={20} />
                            </div>
                        </div>

                        {/* Progress Bar (Visual only for now) */}
                        <div className="relative z-10 mt-4 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${item.color.replace('text-', 'bg-')}`}
                                style={{ width: '70%', opacity: 0.7 }}
                            />
                        </div>
                    </GlassCard>
                ))}
            </div>
        </section>
    );
}
