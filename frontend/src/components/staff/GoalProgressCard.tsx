import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Trophy, AlertCircle, Clock } from 'lucide-react';

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
    const percentage = Math.min(Math.round((currentProgress / totalNeeded) * 100), 1000); // Allow over 100%
    const displayPercentage = Math.max(0, percentage);

    const isExceeded = percentage >= 100;

    // Color logic
    const getColorClass = () => {
        if (isExceeded) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (percentage >= 70) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        if (percentage >= 40) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    const getProgressColor = () => {
        if (isExceeded) return 'bg-emerald-500';
        if (percentage >= 70) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-[32px] border shadow-sm group hover:shadow-md transition-all ${isExceeded ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-700'}`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Meta Ativa</p>
                        {isExceeded && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full uppercase tracking-tighter animate-pulse">
                                <Trophy size={10} /> Batida!
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-black text-secondary dark:text-white leading-tight truncate">
                        {goal.title}
                    </h3>
                </div>
                <div className={`p-3 rounded-2xl ${getColorClass()}`}>
                    {isExceeded ? <Trophy size={20} /> : <Target size={20} />}
                </div>
            </div>

            {/* Progress Visualization */}
            <div className="mt-6 flex flex-col items-center justify-center py-4 relative">
                {/* Progress Circle (could use a SVG here for premium look) */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="58"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-gray-100 dark:text-gray-700"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="58"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeDasharray="364.4"
                            initial={{ strokeDashoffset: 364.4 }}
                            animate={{ strokeDashoffset: 364.4 - (364.4 * Math.min(percentage, 100)) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`${getProgressColor()} stroke-current transition-all duration-1000`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black ${isExceeded ? 'text-emerald-500' : 'text-secondary dark:text-white'}`}>
                            {displayPercentage}%
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Progresso</span>
                    </div>
                </div>

                {isExceeded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-center"
                    >
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Evolução constante! +{(goal.currentValue - goal.targetValue).toFixed(0)} {goal.unit}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Metrics Footer */}
            <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Atual</p>
                    <p className="text-lg font-black text-secondary dark:text-white">
                        {goal.currentValue} <span className="text-[10px] text-gray-400">{goal.unit}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Objetivo</p>
                    <p className="text-lg font-black text-secondary dark:text-white">
                        {goal.targetValue} <span className="text-[10px] text-gray-400">{goal.unit}</span>
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Expira em {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
                </div>
                {!isExceeded && (
                    <div className="flex items-center gap-1 text-orange-500">
                        <TrendingUp size={12} />
                        <span>Faltam {(goal.targetValue - goal.currentValue).toFixed(0)}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
