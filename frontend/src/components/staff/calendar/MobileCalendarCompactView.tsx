import { useState, useMemo } from 'react';
import { Plus, X, Users, Trash2, CheckSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CalendarCompactHeader from './CalendarCompactHeader';
import MonthGridCompact from './MonthGridCompact';
import DayAgendaList from './DayAgendaList';
import { Container } from '../../layout/LayoutHelpers';

import { AgendaItem } from '../../../features/agenda/domain/types';

interface Staff {
    id: string;
    name: string;
    color?: string;
}

interface MobileCalendarCompactViewProps {
    appointments: AgendaItem[];
    isLoading: boolean;
    selectedDayDate: Date;
    onSelectDay: (date: Date) => void;
    onAppointmentClick: (appt: AgendaItem) => void;
    onCreateNew: () => void;
    // Filter state
    performers: Staff[];
    selectedPerformerId: string;
    onPerformerChange: (id: string) => void;
    tab: 'active' | 'trash';
    onTabChange: (tab: 'active' | 'trash') => void;
    // Bulk actions
    isBulkMode: boolean;
    onBulkModeToggle: () => void;
    selectedIds: string[];
    onBulkDelete?: () => void;
    onBulkRestore?: () => void;
}

export default function MobileCalendarCompactView({
    appointments,
    isLoading,
    selectedDayDate,
    onSelectDay,
    onAppointmentClick,
    onCreateNew,
    performers,
    selectedPerformerId,
    onPerformerChange,
    tab,
    onTabChange,
    isBulkMode,
    onBulkModeToggle,
    selectedIds,
    onBulkDelete,
    onBulkRestore
}: MobileCalendarCompactViewProps) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Helper: isSameDay
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Filter appointments for selected day
    const dayAgendaItems = useMemo(() => {
        return appointments
            .filter(a => isSameDay(new Date(a.startAt), selectedDayDate))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }, [appointments, selectedDayDate]);

    // Navigation handlers
    const handlePrevMonth = () => {
        const d = new Date(selectedDayDate);
        d.setMonth(d.getMonth() - 1);
        onSelectDay(d);
    };

    const handleNextMonth = () => {
        const d = new Date(selectedDayDate);
        d.setMonth(d.getMonth() + 1);
        onSelectDay(d);
    };

    const handleToday = () => {
        onSelectDay(new Date());
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[var(--color-bg-primary)] overflow-hidden">
            {/* ========================================
                FIXED TOP: Header + Calendar Grid
               ======================================== */}
            <div className="shrink-0">
                {/* Header */}
                <CalendarCompactHeader
                    currentDate={selectedDayDate}
                    selectedDate={selectedDayDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleToday}
                    onFilterClick={() => setIsFilterOpen(true)}
                />

                {/* Month Grid */}
                <MonthGridCompact
                    currentDate={selectedDayDate}
                    selectedDate={selectedDayDate}
                    appointments={appointments}
                    onSelectDay={onSelectDay}
                />
            </div>

            {/* ========================================
                SCROLLABLE: Day AgendaItems List
               ======================================== */}
            <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[var(--color-bg-secondary)]"
                style={{ paddingBottom: 'var(--content-padding-bottom)' }}
            >
                <Container fluid className="py-2">
                    <DayAgendaList
                        selectedDate={selectedDayDate}
                        appointments={dayAgendaItems}
                        isLoading={isLoading}
                        onAppointmentClick={onAppointmentClick}
                        onCreateNew={onCreateNew}
                    />
                </Container>
            </div>

            {/* ========================================
                FAB: Floating Action Button
               ======================================== */}
            {tab === 'active' && !isBulkMode && (
                <button
                    onClick={onCreateNew}
                    className="fixed right-[var(--fab-right)] z-[var(--z-fab)] bg-[var(--color-accent-primary)] hover:brightness-110 text-white w-[var(--fab-size)] h-[var(--fab-size)] rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all active:scale-90"
                    style={{ bottom: 'var(--fab-bottom)' }}
                    aria-label="Novo agendamento"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            )}

            {/* ========================================
                BOTTOM SHEET: Filters
               ======================================== */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-sheet-backdrop)]"
                            onClick={() => setIsFilterOpen(false)}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-elevated)] rounded-t-[32px] z-[var(--z-sheet)] max-h-[80vh] flex flex-col border-t border-[var(--color-border)]"
                            style={{ paddingBottom: 'var(--safe-area-bottom)' }}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)] uppercase tracking-widest">
                                    Filtros
                                </h3>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3">
                                        <Users size={14} />
                                        Equipe
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => onPerformerChange('ALL')}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPerformerId === 'ALL'
                                                ? 'bg-[var(--color-accent-primary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/20'
                                                : 'bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                                }`}
                                        >
                                            Todos
                                        </button>
                                        {performers.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => onPerformerChange(p.id)}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPerformerId === p.id
                                                    ? 'bg-[var(--color-accent-primary)] text-white shadow-lg'
                                                    : 'bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                                    }`}
                                                style={selectedPerformerId === p.id && p.color ? { backgroundColor: p.color } : {}}
                                            >
                                                {p.name.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3">
                                        <Trash2 size={14} />
                                        Status
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => onTabChange('active')}
                                            className={`py-3 rounded-xl text-xs font-bold uppercase ${tab === 'active'
                                                ? 'bg-[var(--color-accent-primary)] text-white shadow-lg shadow-[var(--color-accent-primary)]/20'
                                                : 'bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                                }`}
                                        >
                                            Ativos
                                        </button>
                                        <button
                                            onClick={() => onTabChange('trash')}
                                            className={`py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 ${tab === 'trash'
                                                ? 'bg-[var(--color-error)] text-white shadow-lg shadow-[var(--color-error)]/20'
                                                : 'bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                                }`}
                                        >
                                            <Trash2 size={14} />
                                            Lixeira
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3">
                                        <CheckSquare size={14} />
                                        Múltipla Seleção
                                    </label>
                                    <button
                                        onClick={() => {
                                            onBulkModeToggle();
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isBulkMode
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'bg-[var(--color-fill-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                            }`}
                                    >
                                        {isBulkMode ? 'Desativar Seleção' : 'Ativar Seleção em Massa'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-[var(--color-accent-primary)] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-[var(--color-accent-primary)]/20"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isBulkMode && selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-[var(--nav-bottom-height)] left-0 right-0 bg-[var(--color-bg-elevated)] backdrop-blur-md border-t border-[var(--color-border)] p-4 z-[var(--z-bulk-actions)] flex items-center justify-between"
                        style={{ paddingBottom: 'calc(var(--safe-area-bottom) + var(--space-2))' }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-[var(--color-accent-primary)] text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold">
                                {selectedIds.length}
                            </span>
                            <span className="text-[var(--color-text-secondary)] text-xs font-bold">Selecionados</span>
                        </div>
                        <div className="flex gap-2">
                            {tab === 'trash' && onBulkRestore && (
                                <button
                                    onClick={onBulkRestore}
                                    className="px-5 py-2.5 bg-[var(--color-success)] rounded-xl text-white text-[10px] font-bold uppercase tracking-wider"
                                >
                                    Restaurar
                                </button>
                            )}
                            {onBulkDelete && (
                                <button
                                    onClick={onBulkDelete}
                                    className="px-5 py-2.5 bg-[var(--color-error)] rounded-xl text-white text-[10px] font-bold uppercase tracking-wider"
                                >
                                    {tab === 'trash' ? 'Excluir' : 'Lixeira'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
