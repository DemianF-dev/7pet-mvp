import { Search, Plus, MoreHorizontal, Truck, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CalendarCompactHeaderProps {
    currentDate: Date;
    selectedDate?: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    onFilterClick?: () => void;
}

export default function CalendarCompactHeader({
    currentDate,
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
        <div className="flex flex-col bg-[var(--color-bg-primary)] shrink-0 border-b border-[var(--color-border)]">
            {/* Top Row: Switcher & Tools */}
            <div className="flex items-center justify-between px-4 h-[60px]">
                {/* Switcher: SPA vs LOG */}
                <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)] shadow-inner">
                    <button
                        onClick={() => navigate('/staff/agenda-spa')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${!isLog
                            ? 'bg-[var(--color-accent-primary)] text-white shadow-lg'
                            : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Sparkles size={12} strokeWidth={2.5} />
                        SPA
                    </button>
                    <button
                        onClick={() => navigate('/staff/agenda-log')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isLog
                            ? 'bg-[var(--color-warning)] text-white shadow-lg'
                            : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Truck size={12} strokeWidth={2.5} />
                        LOG
                    </button>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center gap-0.5">
                    <button
                        className="w-[var(--tap-target-min)] h-[var(--tap-target-min)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 rounded-full hover:bg-[var(--color-fill-secondary)]"
                        aria-label="Pesquisar"
                    >
                        <Search size={22} strokeWidth={2} />
                    </button>
                    <button
                        onClick={onToday}
                        className="w-[var(--tap-target-min)] h-[var(--tap-target-min)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 rounded-full hover:bg-[var(--color-fill-secondary)]"
                        aria-label="Hoje"
                    >
                        <Plus size={24} strokeWidth={2} />
                    </button>
                    <button
                        onClick={onFilterClick}
                        className="w-[var(--tap-target-min)] h-[var(--tap-target-min)] flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 rounded-full hover:bg-[var(--color-fill-secondary)]"
                        aria-label="Filtros"
                    >
                        <MoreHorizontal size={24} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Month Year & Nav */}
            <div className="flex items-center justify-between px-5 pb-4">
                <div className="flex items-center">
                    <span className="text-[var(--color-text-primary)] text-3xl font-black tracking-tight">{month}</span>
                    <span className="text-[var(--color-text-tertiary)] text-3xl font-light ml-2 opacity-50">{year}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onPrevMonth} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] w-[var(--tap-target-min)] h-[var(--tap-target-min)] flex items-center justify-center active:scale-90 transition-all rounded-full hover:bg-[var(--color-fill-secondary)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button onClick={onNextMonth} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] w-[var(--tap-target-min)] h-[var(--tap-target-min)] flex items-center justify-center active:scale-90 transition-all rounded-full hover:bg-[var(--color-fill-secondary)]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

