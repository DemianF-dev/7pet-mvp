import React from 'react';
import { Search, Plus, MoreHorizontal, Truck, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CalendarCompactHeaderProps {
    currentDate: Date;
    selectedDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onFilterClick?: () => void;
}

export default function CalendarCompactHeader({
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onToday,
    onFilterClick
}: CalendarCompactHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine current mode
    const isLog = location.pathname.includes('agenda-log');

    // Format: "Jan. 2026"
    const monthNames = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    return (
        <div className="flex flex-col bg-[#121212] shrink-0 border-b border-gray-800">
            {/* Top Row: Switcher & Tools */}
            <div className="flex items-center justify-between px-4 h-[56px]">
                {/* Switcher: SPA vs LOG */}
                <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-gray-800">
                    <button
                        onClick={() => navigate('/staff/agenda-spa')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${!isLog ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'
                            }`}
                    >
                        <Sparkles size={12} />
                        SPA
                    </button>
                    <button
                        onClick={() => navigate('/staff/agenda-log')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${isLog ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500'
                            }`}
                    >
                        <Truck size={12} />
                        LOG
                    </button>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center gap-1">
                    <button
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        aria-label="Pesquisar"
                    >
                        <Search size={20} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={onToday}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        aria-label="Hoje"
                    >
                        <Plus size={22} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={onFilterClick}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        aria-label="Filtros"
                    >
                        <MoreHorizontal size={22} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Month Year & Nav */}
            <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center">
                    <span className="text-white text-2xl font-black tracking-tight">{month}</span>
                    <span className="text-gray-500 text-2xl font-light ml-2">{year}</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onPrevMonth} className="text-gray-500 hover:text-white p-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button onClick={onNextMonth} className="text-gray-500 hover:text-white p-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
