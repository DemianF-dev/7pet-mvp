
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Clock,
    CheckSquare,
    Square,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import MobileCalendarCompactView from '../../components/staff/calendar/MobileCalendarCompactView';
import WebAgendaLayout from '../../components/staff/calendar/WebAgendaLayout';
import { useAgendaViewModel } from '../../features/agenda/viewmodels/useAgendaViewModel';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import { AgendaItem } from '../../features/agenda/domain/types';
import AgendaDebugPanel from '../../features/agenda/dev/AgendaDebugPanel';

const statusColumns = [
    { key: 'PENDENTE', label: 'Solicitados', color: 'bg-orange-500' },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-green-500' },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'bg-purple-600' },
    { key: 'FINALIZADO', label: 'Finalizado', color: 'bg-teal-500' }
];

export default function AgendaSPA() {
    const location = useLocation();
    const { state, actions } = useAgendaViewModel({ domain: 'SPA' });

    // Register mobile FAB action
    useRegisterMobileAction('new_appointment', () => actions.openCreateModal());

    const {
        appointments: filteredAppointments,
        isLoading,
        view,
        selectedDate,
        selectedDayDate,
        searchTerm,
        tab,
        performers,
        selectedPerformerId,
        selectedIds,
        isBulkMode,
        isFormOpen,
        isDetailsOpen,
        selectedAppointment,
        isCopying,
        preFillData
    } = state;

    useEffect(() => {
        if (location.state?.prefill) {
            actions.openCreateModal(location.state.prefill);
            window.history.replaceState({}, document.title);
        }
    }, [location, actions]);

    // Helpers strictly for rendering
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const getColumnItems = (status: string) => filteredAppointments.filter(a => a.status === status);

    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        return Array.from({ length: 6 }, (_, i) => { // Mon to Sat
            const dayOfweek = new Date(monday);
            dayOfweek.setDate(monday.getDate() + i);
            return dayOfweek;
        });
    };

    const renderDayView = () => {
        const dayAppts = filteredAppointments
            .filter(a => isSameDay(new Date(a.startAt), selectedDate))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
            <div className="space-y-4">
                {dayAppts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-[32px] p-20 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-inner">
                        <Clock className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-sm">Nenhum agendamento para este dia.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dayAppts.map(appt => {
                            const isCat = appt.pet.species?.toUpperCase().includes('GATO');
                            const isRecurring = appt.customer?.type === 'RECORRENTE';
                            const isSelected = selectedIds.includes(appt.id);

                            return (
                                <motion.div
                                    key={appt.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => actions.openDetailsModal(appt)}
                                    className={`group p-6 rounded-[32px] shadow-sm border-2 border-gray-100 dark:border-gray-700 flex items-center gap-6 hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden border-l-[12px] ${isSelected ? 'ring-4 ring-primary/30 bg-primary/10 border-primary/40' : 'bg-white dark:bg-gray-800'}`}
                                    style={!isSelected && appt.performer?.color ? {
                                        borderLeftColor: appt.performer.color,
                                        backgroundColor: `${appt.performer.color}08`
                                    } : isCat ? { borderLeftColor: '#F472B6' } : { borderLeftColor: '#60A5FA' }}
                                >
                                    {(isBulkMode || isSelected) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); actions.toggleSelect(appt.id); }}
                                            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md border-2 ${isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100'}`}
                                        >
                                            {isSelected ? <CheckSquare size={24} strokeWidth={3} /> : <Square size={24} strokeWidth={3} />}
                                        </button>
                                    )}

                                    <div className="w-28 shrink-0">
                                        <p className="text-[10px] font-black text-secondary/40 dark:text-gray-400 underline decoration-primary/30 decoration-2 underline-offset-4 uppercase tracking-[0.2em] mb-2">Horário</p>
                                        <p className="text-3xl font-black text-secondary dark:text-white tabular-nums drop-shadow-sm leading-none">
                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-secondary/40 dark:text-gray-400 uppercase tracking-[0.2em] mb-2">Pet & Tutor(a)</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white dark:bg-gray-700/50 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group-hover:border-primary/30 transition-colors">
                                                <div
                                                    className="w-3 h-3 rounded-full shadow-sm shrink-0"
                                                    style={{ backgroundColor: appt.performer?.color || (isCat ? '#F472B6' : '#60A5FA') }}
                                                ></div>
                                                <span className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter">
                                                    {isRecurring ? '(R)' : '(A)'} {appt.customer.name.split(' ')[0]} - {appt.pet.name}
                                                </span>
                                            </div>
                                            <div className="h-6 w-px bg-gray-100 dark:bg-gray-700"></div>
                                            <span className="font-black text-gray-500 dark:text-gray-300 text-lg group-hover:text-secondary dark:group-hover:text-white transition-colors">{appt.customer.name}</span>
                                            {appt.quote?.appointments?.some(a => a.category === 'LOGISTICA') && (
                                                <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-orange-500/20 animate-pulse">
                                                    COM LEVA E TRAZ
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hidden lg:block w-64">
                                        <p className="text-[10px] font-black text-secondary/40 dark:text-gray-400 uppercase tracking-[0.2em] mb-2">Serviços</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {appt.services?.map(s => (
                                                <span key={s.id} className="text-[10px] font-black bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl text-secondary dark:text-white shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                    {s.name}
                                                </span>
                                            )) || (appt.service && (
                                                <span className="text-[10px] font-black bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 px-3 py-1.5 rounded-xl text-secondary dark:text-white shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                    {appt.service.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ml-auto text-right">
                                        <span className={`px-6 py-3 rounded-2xl text-[12px] font-black border-2 shadow-lg uppercase tracking-widest ${appt.status === 'PENDENTE' ? 'bg-purple-600 text-white border-purple-700 shadow-purple-500/20' :
                                            appt.status === 'CONFIRMADO' ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/20' :
                                                appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-900 text-white border-purple-950 shadow-purple-900/20' :
                                                    'bg-green-600 text-white border-green-700 shadow-green-500/20'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays(selectedDate);
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {weekDays.map(day => {
                    const dayAppts = filteredAppointments
                        .filter(a => isSameDay(new Date(a.startAt), day))
                        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

                    return (
                        <div key={day.toISOString()} className="flex flex-col gap-4">
                            <div className={`p-4 rounded-[24px] text-center border-2 transition-all shadow-sm ${isSameDay(day, new Date()) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-secondary dark:text-white'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isSameDay(day, new Date()) ? 'text-white/80' : 'text-gray-400'}`}>
                                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </p>
                                <p className="text-2xl font-black">{day.getDate()}</p>
                            </div>

                            <div className="flex-1 space-y-3">
                                {dayAppts.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-[24px]">
                                        <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Vazio</p>
                                    </div>
                                ) : (
                                    dayAppts.map(appt => {
                                        const isSelected = selectedIds.includes(appt.id);
                                        const isCat = appt.pet.species?.toUpperCase().includes('GATO');
                                        const isRecurring = appt.customer?.type === 'RECORRENTE';

                                        return (
                                            <div
                                                key={appt.id}
                                                onClick={() => actions.openDetailsModal(appt)}
                                                className={`p-4 rounded-[24px] border-2 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden border-l-[8px] ${isSelected ? 'ring-4 ring-primary/20 bg-primary/5 border-primary/50' : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700'}`}
                                                style={!isSelected && appt.performer?.color ? {
                                                    borderLeftColor: appt.performer.color,
                                                    backgroundColor: `${appt.performer.color}08`
                                                } : isCat ? { borderLeftColor: '#F472B6' } : { borderLeftColor: '#60A5FA' }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm ${appt.status === 'PENDENTE' ? 'bg-purple-600 text-white' :
                                                        appt.status === 'CONFIRMADO' ? 'bg-blue-600 text-white' :
                                                            appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-800 text-white' :
                                                                'bg-green-600 text-white'
                                                        }`}>
                                                        {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {(isBulkMode || isSelected) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); actions.toggleSelect(appt.id); }}
                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-gray-700 border shadow-md ${isSelected ? 'bg-primary text-white border-primary' : 'text-gray-300 dark:text-gray-500 border-gray-100 dark:border-gray-600'}`}
                                                        >
                                                            <CheckSquare size={16} strokeWidth={3} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black uppercase truncate drop-shadow-sm leading-tight flex items-center gap-2 text-secondary dark:text-white">
                                                    <div
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: appt.performer?.color || (isCat ? '#F472B6' : '#60A5FA') }}
                                                    ></div>
                                                    <span>{isRecurring ? '(R)' : '(A)'} {appt.customer.name.split(' ')[0]} - {appt.pet.name}</span>
                                                    {appt.quote?.appointments?.some(a => a.category === 'LOGISTICA') && (
                                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] opacity-70 font-bold truncate">{appt.customer.name}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderKanbanView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
            {statusColumns.map((col) => (
                <div key={col.key} className="flex flex-col h-full min-h-0">
                    <div className="flex items-center justify-between mb-3 px-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${col.color} shadow-lg shadow-current/20`}></div>
                            <h3 className="font-black text-secondary dark:text-gray-300 uppercase tracking-[0.2em] text-[11px]">{col.label}</h3>
                        </div>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                            {getColumnItems(col.key).length}
                        </span>
                    </div>
                    <div className="flex-1 bg-gray-50/50 dark:bg-gray-800/20 rounded-[40px] p-5 overflow-y-auto space-y-4 custom-scrollbar border border-dashed border-gray-200 dark:border-gray-800">
                        {getColumnItems(col.key).map((appt) => {
                            const isSelected = selectedIds.includes(appt.id);
                            const isCat = appt.pet.species?.toUpperCase().includes('GATO');
                            const isRecurring = appt.customer?.type === 'RECORRENTE';

                            return (
                                <div
                                    key={appt.id}
                                    onClick={() => actions.openDetailsModal(appt)}
                                    className={`p-5 rounded-[28px] shadow-sm border-2 group hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden border-l-[10px] ${isSelected ? 'ring-4 ring-primary/20 bg-white dark:bg-gray-700 border-primary/50 shadow-primary/10' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                                    style={!isSelected && appt.performer?.color ? {
                                        borderLeftColor: appt.performer.color,
                                        backgroundColor: `${appt.performer.color}08`
                                    } : isCat ? { borderLeftColor: '#F472B6' } : { borderLeftColor: '#60A5FA' }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-secondary dark:text-gray-300 border border-gray-100 dark:border-gray-600 shadow-sm">
                                            <Clock size={12} className="text-primary" />
                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {(isBulkMode || isSelected) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); actions.toggleSelect(appt.id); }}
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-white dark:bg-gray-600 border shadow-md ${isSelected ? 'bg-primary text-white border-primary' : 'text-gray-300 dark:text-gray-400 border-gray-100 dark:border-gray-500'}`}
                                            >
                                                <CheckSquare size={16} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                    <h4 className="font-black text-secondary dark:text-white text-base group-hover:text-primary transition-colors truncate uppercase drop-shadow-sm leading-tight flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: appt.performer?.color || (isCat ? '#F472B6' : '#60A5FA') }}
                                            ></div>
                                            <span className="truncate">{isRecurring ? '(R)' : '(A)'} {appt.customer.name.split(' ')[0]} - {appt.pet.name}</span>
                                        </div>
                                        {appt.quote?.appointments?.some(a => a.category === 'LOGISTICA') && (
                                            <span className="bg-orange-500 text-white text-[8px] px-2 py-0.5 rounded-full shrink-0">TR</span>
                                        )}
                                    </h4>
                                    <p className="text-[11px] opacity-70 font-bold truncate mt-1">{appt.customer.name}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    // COMPACT view renders as full-screen mobile layout (Mobile First Default)
    if (view === 'COMPACT') {
        return (
            <>
                <MobileCalendarCompactView
                    appointments={filteredAppointments}
                    isLoading={isLoading}
                    selectedDayDate={selectedDayDate}
                    onSelectDay={actions.setSelectedDayDate}
                    onAppointmentClick={actions.openDetailsModal}
                    onCreateNew={() => actions.openCreateModal()}
                    performers={performers}
                    selectedPerformerId={selectedPerformerId}
                    onPerformerChange={actions.setSelectedPerformerId}
                    tab={tab}
                    onTabChange={actions.setTab}
                    isBulkMode={isBulkMode}
                    onBulkModeToggle={() => actions.setIsBulkMode(!isBulkMode)}
                    selectedIds={selectedIds}
                    onBulkDelete={actions.bulkDelete}
                    onBulkRestore={actions.bulkRestore}
                />
                <AgendaDebugPanel module="SPA" vm={{ ...state, filteredCount: filteredAppointments.length }} />
                <AnimatePresence>
                    {isFormOpen && (
                        <AppointmentFormModal
                            isOpen={isFormOpen}
                            onClose={actions.closeModals}
                            onSuccess={actions.refresh}
                            appointment={selectedAppointment as any}
                            isCopy={isCopying}
                            preFill={preFillData}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isDetailsOpen && (
                        <AppointmentDetailsModal
                            isOpen={isDetailsOpen}
                            onClose={actions.closeModals}
                            onSuccess={actions.refresh}
                            appointment={selectedAppointment as any}
                            onModify={actions.openEditModal}
                            onCopy={actions.openCopyModal}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    // DESKTOP LAYOUT (WebArenaLayout)
    return (
        <>
            <WebAgendaLayout
                appointments={filteredAppointments}
                selectedDate={selectedDate}
                onSelectedDateChange={actions.setSelectedDate}
                searchTerm={searchTerm}
                onSearchChange={actions.setSearchTerm}
                performers={performers}
                selectedPerformerId={selectedPerformerId}
                onPerformerChange={actions.setSelectedPerformerId}
                view={view}
                onViewChange={actions.setView}
                onCreateNew={() => actions.openCreateModal()}
                tab={tab}
                onTabChange={actions.setTab}
                isLoading={isLoading}
                onRefresh={actions.refresh}
                onAppointmentClick={actions.openDetailsModal}
                breadcrumb="7Pet > Agenda SPA"
            >
                {view === 'KANBAN' && renderKanbanView()}
                {view === 'DAY' && renderDayView()}
                {view === 'WEEK' && renderWeekView()}
            </WebAgendaLayout>

            {/* Modals for Desktop */}
            <AgendaDebugPanel module="SPA" vm={{ ...state, filteredCount: filteredAppointments.length }} />
            <AnimatePresence>
                {isFormOpen && (
                    <AppointmentFormModal
                        isOpen={isFormOpen}
                        onClose={actions.closeModals}
                        onSuccess={actions.refresh}
                        appointment={selectedAppointment as any}
                        isCopy={isCopying}
                        preFill={preFillData}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDetailsOpen && (
                    <AppointmentDetailsModal
                        isOpen={isDetailsOpen}
                        onClose={actions.closeModals}
                        onSuccess={actions.refresh}
                        appointment={selectedAppointment as any}
                        onModify={actions.openEditModal}
                        onCopy={actions.openCopyModal}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
