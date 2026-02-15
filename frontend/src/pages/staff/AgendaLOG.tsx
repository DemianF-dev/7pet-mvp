import { useState, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
} from 'lucide-react';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import MobileCalendarCompactView from '../../components/staff/calendar/MobileCalendarCompactView';
import WebAgendaLayout from '../../components/staff/calendar/WebAgendaLayout';
import { useAgendaDay, useAgendaWeek, useAgendaDashboard, AgendaFilters } from '../../query/hooks/useAgenda';
import { useAuthStore } from '../../store/authStore';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import { useModalStore } from '../../store/modalStore';

export default function AgendaLOG() {
    const { user } = useAuthStore();
    const { isMobile } = useDeviceInfo();

    const {
        appointmentModalOpen,
        detailsModalOpen,
        appointmentId,
        preFill,
        isCopy,
        appointmentData,
        openAppointmentModal,
        closeAppointmentModal,
        closeDetailsModal,
        openDetailsModal
    } = useModalStore();

    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT'>('MONTH');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<AgendaFilters>({
        module: 'LOG',
        performerId: user?.division === 'MASTER' ? 'ALL' : user?.id,
    });

    // React Query hooks
    const agendaDayQuery = useAgendaDay(
        selectedDate.toISOString().split('T')[0],
        filters,
        { enabled: true }
    );

    const fetchRange = useMemo(() => {
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);

        if (view === 'MONTH') {
            // Fetch the whole month plus surrounding days for the grid
            start.setDate(1);
            start.setDate(start.getDate() - 7);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setDate(end.getDate() + 7);
        } else {
            // Fetch standard week
            start.setDate(start.getDate() - start.getDay());
            end.setDate(end.getDate() + (6 - end.getDay()));
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }, [selectedDate, view]);

    const agendaWeekQuery = useAgendaWeek(
        fetchRange.start,
        fetchRange.end,
        filters.module,
        { enabled: !isMobile }
    );

    const dashboardQuery = useAgendaDashboard(
        selectedDate.toISOString().split('T')[0],
        fetchRange,
        filters
    );

    const dayData = agendaDayQuery.data || { appointments: [], summary: {} };
    const weekData: any = agendaWeekQuery.data || { days: [], summary: {} };

    // Find selected appointment for modals
    const selectedAppointment = useMemo(() => {
        if (!appointmentId) return null;
        const allAppointments = [
            ...(dayData.appointments || []),
            ...(weekData?.days ? weekData.days.flatMap((d: any) => d.appointments || []) : [])
        ];
        return allAppointments.find(a => a.id === appointmentId) || null;
    }, [appointmentId, dayData, weekData]);

    const isLoading = isMobile ? agendaDayQuery.isLoading : (agendaWeekQuery.isLoading || dashboardQuery.isLoading);

    void useMemo(() => { // summary - reserved for future dashboard display
        const daySummary: any = dayData?.summary || {};
        return {
            total: daySummary.total || 0,
            byStatus: daySummary.byStatus || {
                PENDENTE: 0,
                CONFIRMADO: 0,
                EM_ANDAMENTO: 0,
                FINALIZADO: 0,
                CANCELADO: 0,
            },
        };
    }, [dayData]);

    const navigateToDay = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const updateFilters = useCallback((newFilters: Partial<AgendaFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const handleRefresh = useCallback(() => {
        agendaDayQuery.refetch();
        if (!isMobile) {
            agendaWeekQuery.refetch();
            dashboardQuery.refetch();
        }
    }, [isMobile]);

    useRegisterMobileAction('new_appointment', () => {
        openAppointmentModal({
            preFill: { startAt: selectedDate.toISOString(), category: 'LOG' }
        });
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-secondary flex items-center gap-2">
                        <CalendarIcon className="text-primary h-6 w-6" /> Agenda LOG
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <div className={`h-4 w-4 border-2 border-primary border-t-transparent rounded-full ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => openAppointmentModal({ preFill: { startAt: new Date().toISOString(), category: 'LOG' } })}
                        className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Novo Agendamento
                    </button>
                </div>
            </div>

            {isMobile ? (
                <div className="flex-1 overflow-y-auto pb-20">
                    <MobileCalendarCompactView
                        appointments={dayData.appointments || []}
                        isLoading={agendaDayQuery.isLoading}
                        selectedDayDate={selectedDate}
                        onSelectDay={navigateToDay}
                        onAppointmentClick={(apt) => openDetailsModal(apt.id)}
                        onCreateNew={() => openAppointmentModal({ preFill: { startAt: selectedDate.toISOString(), category: 'LOG' } })}
                        performers={[]}
                        selectedPerformerId={filters.performerId || 'ALL'}
                        onPerformerChange={(id) => updateFilters({ performerId: id })}
                        tab="active"
                        onTabChange={() => { }}
                        onBulkModeToggle={() => { }}
                        isBulkMode={false}
                        selectedIds={[]}
                        onBulkDelete={() => { }}
                        onBulkRestore={() => { }}
                    />
                </div>
            ) : (
                <WebAgendaLayout
                    appointments={weekData?.days ? weekData.days.flatMap((d: any) => d.appointments || []) : dayData.appointments || []}
                    weekData={weekData}
                    selectedDate={selectedDate}
                    onSelectedDateChange={setSelectedDate}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    view={view}
                    onViewChange={setView}
                    performers={[]}
                    selectedPerformerId={filters.performerId || 'ALL'}
                    onPerformerChange={(id) => updateFilters({ performerId: id })}
                    onCreateNew={() => openAppointmentModal({ preFill: { startAt: selectedDate.toISOString(), category: 'LOG' } })}
                    tab="active"
                    onTabChange={() => { }}
                    isLoading={isLoading}
                    onRefresh={handleRefresh}
                    onAppointmentClick={(apt) => openDetailsModal(apt.id)}
                />
            )}

            <AppointmentFormModal
                isOpen={appointmentModalOpen}
                onClose={closeAppointmentModal}
                onSuccess={handleRefresh}
                appointment={appointmentData || selectedAppointment}
                isCopy={isCopy}
                preFill={preFill}
            />

            {detailsModalOpen && selectedAppointment && (
                <AppointmentDetailsModal
                    isOpen={detailsModalOpen}
                    onClose={closeDetailsModal}
                    onSuccess={handleRefresh}
                    appointment={selectedAppointment}
                    onModify={(apt) => openAppointmentModal({ appointment: apt })}
                    onCopy={(apt) => openAppointmentModal({ appointment: apt, isCopy: true })}
                />
            )}
        </div>
    );
}
