import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Trophy, Clock } from 'lucide-react';
import { Card, Badge } from '../ui';

interface Goal {
    id: string;
    title: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    initialValue: number;
    unit?: string;
    endDate: string;
}

interface GoalProgressCardProps {
    goal: Goal;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ goal }) => {
    const totalNeeded = goal.targetValue - goal.initialValue;
    const currentProgress = goal.currentValue - goal.initialValue;
    const percentage = Math.min(Math.round((currentProgress / totalNeeded) * 100), 1000);
    const displayPercentage = Math.max(0, percentage);

    const isExceeded = percentage >= 100;

    // Semantic color logic based on tokens
    const getStatusTheme = () => {
        if (isExceeded) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', progress: 'bg-emerald-500' };
        if (percentage >= 70) return { color: 'text-[var(--color-accent-primary)]', bg: 'var(--color-accent-primary-alpha)', border: 'var(--color-accent-primary-alpha)', progress: 'var(--color-accent-primary)' };
        if (percentage >= 40) return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', progress: 'bg-orange-500' };
        return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', progress: 'bg-red-500' };
    };

    const theme = getStatusTheme();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full"
        >
            <Card
                className={`relative h-full flex flex-col p-[var(--space-6)] overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-xl)] ${isExceeded ? 'border-emerald-500/30' : 'border-[var(--color-border-subtle)]'}`}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="neutral" size="sm" className="font-[var(--font-weight-black)] text-[8px] uppercase tracking-widest px-2">
                                Meta Ativa
                            </Badge>
                            {isExceeded && (
                                <Badge variant="success" size="sm" className="bg-emerald-500 text-white font-bold text-[8px] uppercase tracking-widest animate-pulse border-none">
                                    <Trophy size={10} className="mr-1" /> Batida!
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] leading-tight tracking-tight">
                            {goal.title}
                        </h3>
                    </div>
                    <div className={`p-3.5 rounded-[var(--radius-xl)] ${theme.bg} ${theme.color} border ${theme.border} shadow-inner`}>
                        {isExceeded ? <Trophy size={22} strokeWidth={2.5} /> : <Target size={22} strokeWidth={2.5} />}
                    </div>
                </div>

                {/* Circular Progress */}
                <div className="relative flex-1 flex flex-col items-center justify-center p-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 drop-shadow-sm">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke="var(--color-fill-secondary)"
                                strokeWidth="10"
                            />
                            <motion.circle
                                cx="80"
                                cy="80"
                                r="70"
                                fill="none"
                                stroke={theme.progress.startsWith('var') ? `var(${theme.progress.match(/var\(([^)]+)\)/)![1]})` : theme.progress}
                                strokeWidth="12"
                                strokeDasharray="439.8"
                                initial={{ strokeDashoffset: 439.8 }}
                                animate={{ strokeDashoffset: 439.8 - (439.8 * Math.min(percentage, 100)) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-[var(--font-weight-black)] tracking-tighter ${isExceeded ? 'text-emerald-500' : 'text-[var(--color-text-primary)]'}`}>
                                {displayPercentage}%
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-tertiary)] mt-1">Progresso</span>
                        </div>
                    </div>

                    {isExceeded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-[11px] font-[var(--font-weight-black)] text-emerald-600 uppercase tracking-wide">
                                Performance Extra! +{(goal.currentValue - goal.targetValue).toFixed(0)} {goal.unit}
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Metrics Summary */}
                <div className="mt-8 grid grid-cols-2 gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Atual</p>
                        <p className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                            {goal.currentValue} <span className="text-[10px] text-[var(--color-text-tertiary)] ml-0.5">{goal.unit}</span>
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Objetivo</p>
                        <p className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                            {goal.targetValue} <span className="text-[10px] text-[var(--color-text-tertiary)] ml-0.5">{goal.unit}</span>
                        </p>
                    </div>
                </div>

                {/* Meta Footer */}
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                        <Clock size={12} strokeWidth={2.5} />
                        <span>Expira em {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {!isExceeded && (
                        <div className="flex items-center gap-1.5 text-orange-500 font-bold uppercase tracking-tighter bg-orange-50 px-2 py-0.5 rounded-full">
                            <TrendingUp size={12} strokeWidth={3} />
                            <span>Faltam {(goal.targetValue - goal.currentValue).toFixed(0)}</span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};
