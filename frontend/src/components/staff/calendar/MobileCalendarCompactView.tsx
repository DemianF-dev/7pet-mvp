import React, { useState, useMemo } from 'react';
import { Plus, X, Users, Trash2, CheckSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CalendarCompactHeader from './CalendarCompactHeader';
import MonthGridCompact from './MonthGridCompact';
import DayAgendaList from './DayAgendaList';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customer: { name: string; type?: string };
    pet: { name: string; species?: string };
    services?: { id: string; name: string }[];
    service?: { name: string };
    performer?: { color?: string };
    performerId?: string;
    transport?: { type?: string; origin?: string; destination?: string };
    quote?: {
        appointments?: { category: string }[];
    };
}

interface Staff {
    id: string;
    name: string;
    color?: string;
}

interface MobileCalendarCompactViewProps {
    appointments: Appointment[];
    isLoading: boolean;
    selectedDayDate: Date;
    onSelectDay: (date: Date) => void;
    onAppointmentClick: (appt: Appointment) => void;
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
    const dayAppointments = useMemo(() => {
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
        <div className="flex flex-col h-[100dvh] bg-[#121212] overflow-hidden">
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
                SCROLLABLE: Day Appointments List
               ======================================== */}
            <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 20px))' }}
            >
                <DayAgendaList
                    selectedDate={selectedDayDate}
                    appointments={dayAppointments}
                    isLoading={isLoading}
                    onAppointmentClick={onAppointmentClick}
                    onCreateNew={onCreateNew}
                />
            </div>

            {/* ========================================
                FAB: Floating Action Button
               ======================================== */}
            {tab === 'active' && !isBulkMode && (
                <button
                    onClick={onCreateNew}
                    className="fixed right-5 z-[45] bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-[0_8px_25px_rgba(37,99,235,0.4)] flex items-center justify-center transition-all active:scale-90"
                    style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 16px))' }}
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
                            className="fixed inset-0 bg-black/60 z-50"
                            onClick={() => setIsFilterOpen(false)}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-[32px] z-[60] max-h-[80vh] flex flex-col"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                                    Filtros
                                </h3>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                        <Users size={14} />
                                        Equipe
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => onPerformerChange('ALL')}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPerformerId === 'ALL'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400'
                                                }`}
                                        >
                                            Todos
                                        </button>
                                        {performers.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => onPerformerChange(p.id)}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedPerformerId === p.id
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                    : 'bg-gray-800 text-gray-400'
                                                    }`}
                                                style={selectedPerformerId === p.id && p.color ? { backgroundColor: p.color } : {}}
                                            >
                                                {p.name.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                        <Trash2 size={14} />
                                        Status
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => onTabChange('active')}
                                            className={`py-3 rounded-xl text-xs font-black uppercase ${tab === 'active'
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-gray-800 text-gray-400'
                                                }`}
                                        >
                                            Ativos
                                        </button>
                                        <button
                                            onClick={() => onTabChange('trash')}
                                            className={`py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 ${tab === 'trash'
                                                ? 'bg-red-600 text-white shadow-lg'
                                                : 'bg-gray-800 text-gray-400'
                                                }`}
                                        >
                                            <Trash2 size={14} />
                                            Lixeira
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                                        <CheckSquare size={14} />
                                        Múltipla Seleção
                                    </label>
                                    <button
                                        onClick={() => {
                                            onBulkModeToggle();
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest ${isBulkMode
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'bg-gray-800 text-gray-400'
                                            }`}
                                    >
                                        {isBulkMode ? 'Desativar Seleção' : 'Ativar Seleção em Massa'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-blue-600/20"
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
                        className="fixed bottom-[72px] left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-gray-800 p-4 z-[45] flex items-center justify-between"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)' }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black">
                                {selectedIds.length}
                            </span>
                            <span className="text-gray-300 text-xs font-bold">Selecionados</span>
                        </div>
                        <div className="flex gap-2">
                            {tab === 'trash' && onBulkRestore && (
                                <button
                                    onClick={onBulkRestore}
                                    className="px-5 py-2.5 bg-green-600 rounded-xl text-white text-[10px] font-black uppercase tracking-wider"
                                >
                                    Restaurar
                                </button>
                            )}
                            {onBulkDelete && (
                                <button
                                    onClick={onBulkDelete}
                                    className="px-5 py-2.5 bg-red-600 rounded-xl text-white text-[10px] font-black uppercase tracking-wider"
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
