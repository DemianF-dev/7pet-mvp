import {
    Target,
    Plus,
    Search
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, IconButton } from '../../components/ui';
import { GoalProgressCard } from '../../components/staff/GoalProgressCard';

interface MobileStrategyProps {
    goals: any[];
    isLoading: boolean;
    searchTerm: string;
    onSearch: (term: string) => void;
    filterStatus: string;
    onFilterChange: (status: string) => void;
    onNewGoal: () => void;
    onRefresh: () => void;
}

export const MobileStrategy = ({
    goals,
    isLoading,
    searchTerm,
    onSearch,
    filterStatus,
    onFilterChange,
    onNewGoal,
    onRefresh
}: MobileStrategyProps) => {
    return (
        <MobileShell
            title="Estratégia"
            rightAction={<IconButton icon={Plus} onClick={onNewGoal} variant="ghost" aria-label="Nova Meta" />}
        >
            <div className="space-y-6 pb-24">
                {/* Filters Row */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl">
                    {['ALL', 'ACTIVE', 'COMPLETED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => onFilterChange(s)}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-gray-400'}`}
                        >
                            {s === 'ALL' ? 'Todas' : s === 'ACTIVE' ? 'Ativas' : 'OK'}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar metas..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Goals List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calculando indicadores...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-10 text-center">
                            <Target size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-600">Nenhuma meta encontrada</p>
                            <p className="text-xs mt-1">Crie seus primeiros objetivos estratégicos.</p>
                        </div>
                    ) : (
                        goals.map((goal) => (
                            <div key={goal.id} className="relative">
                                <GoalProgressCard goal={goal} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </MobileShell>
    );
};
