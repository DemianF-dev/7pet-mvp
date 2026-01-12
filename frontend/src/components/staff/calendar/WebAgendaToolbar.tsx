
import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Plus,
    Layout,
    List,
    Calendar as CalendarIcon,
    RefreshCcw,
    Users,
    Trash2,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

type ViewType = 'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT';
type TabType = 'active' | 'trash';

interface Staff {
    id: string;
    name: string;
    role: string;
    color?: string;
}

interface WebAgendaToolbarProps {
    selectedDate: Date;
    onNextDate: () => void;
    onPrevDate: () => void;
    onToday: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    performers: Staff[];
    selectedPerformerId: string;
    onPerformerChange: (id: string) => void;
    view: ViewType;
    onViewChange: (view: ViewType) => void;
    onCreateNew: () => void;
    tab: TabType;
    onTabChange: (tab: TabType) => void;
    isLoading: boolean;
    onRefresh: () => void;
}

export default function WebAgendaToolbar({
    selectedDate,
    onNextDate,
    onPrevDate,
    onToday,
    searchTerm,
    onSearchChange,
    performers,
    selectedPerformerId,
    onPerformerChange,
    view,
    onViewChange,
    onCreateNew,
    tab,
    onTabChange,
    isLoading,
    onRefresh
}: WebAgendaToolbarProps) {

    const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm px-6 py-3">
            <div className="flex items-center justify-between gap-4">

                {/* LEFT: Context & Nav */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">7Pet > Agenda SPA</span>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black text-gray-800 dark:text-white capitalize leading-none">
                                {capitalizedMonth}
                            </h2>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 ml-2">
                                <button onClick={onPrevDate} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 transition-all">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={onToday} className="px-3 text-[10px] font-black uppercase hover:text-primary transition-colors">
                                    Hoje
                                </button>
                                <button onClick={onNextDate} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 transition-all">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: Filters */}
                <div className="flex-1 max-w-2xl flex items-center justify-center gap-3">
                    {/* Performer Filter */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors cursor-pointer">
                            <Users size={14} className="text-gray-400" />
                            <select
                                value={selectedPerformerId}
                                onChange={(e) => onPerformerChange(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none min-w-[120px] py-0"
                            >
                                <option value="ALL">Toda a Equipe</option>
                                {performers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar pet, tutor ou serviço..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                    </div>

                    {/* Tab Switcher (Active/Trash) - Mini version */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                        <button
                            onClick={() => onTabChange('active')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${tab === 'active' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => onTabChange('trash')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${tab === 'trash' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Trash2 size={10} /> Lix.
                        </button>
                    </div>
                </div>

                {/* RIGHT: Actions & Views */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        className={`p-2 text-gray-400 hover:text-primary transition-colors ${isLoading ? 'animate-spin' : ''}`}
                        title="Atualizar"
                    >
                        <RefreshCcw size={16} />
                    </button>

                    <div className="hidden xl:flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                        {['MONTH', 'WEEK', 'DAY', 'KANBAN'].map((v) => (
                            <button
                                key={v}
                                onClick={() => onViewChange(v as ViewType)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${view === v ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {v === 'MONTH' && <CalendarIcon size={12} />}
                                {v === 'WEEK' && <CalendarIcon size={12} className="rotate-90" />}
                                {v === 'DAY' && <List size={12} />}
                                {v === 'KANBAN' && <Layout size={12} />}
                                {v === 'MONTH' ? 'MÊS' : v === 'WEEK' ? 'SEM' : v === 'DAY' ? 'DIA' : 'BOARD'}
                            </button>
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCreateNew}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 ml-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span className="hidden sm:inline">NOVO ITEM</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
