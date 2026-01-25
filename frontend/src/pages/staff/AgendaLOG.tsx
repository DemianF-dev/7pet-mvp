import React, { useState, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import MobileCalendarCompactView from '../../components/staff/calendar/MobileCalendarCompactView';
import WebAgendaLayout from '../../components/staff/calendar/WebAgendaLayout';
import { useAgendaDay, useAgendaWeek, useAgendaDashboard, AgendaFilters } from '../../query/hooks/useAgenda';
import { useAuthStore } from '../../store/authStore';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import { useModalStore } from '../../store/modalStore';

const statusColumns = [
    { key: 'PENDENTE', label: 'Solicitados', color: 'bg-orange-500' },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-green-500' },
    { key: 'EM_ANDAMENTO', label: 'Em Atendimento', color: 'bg-purple-600' },
    { key: 'FINALIZADO', label: 'Finalizado', color: 'bg-teal-500' },
    { key: 'CANCELADO', label: 'Cancelado', color: 'bg-gray-500' },
];

export default function AgendaLOG() {
    const { user } = useAuthStore();
    const { isMobile } = useDeviceInfo();
    const {
        appointmentModalOpen,
        detailsModalOpen,
        appointmentData,
        appointmentId,
        preFill,
        isCopy,
        openAppointmentModal,
        closeAppointmentModal,
        closeDetailsModal,
        openDetailsModal
    } = useModalStore();

    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT'>('WEEK');
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

    // Mobile: Use compact view with React Query
    const agendaDayQueryMobile = useAgendaDay(
        selectedDate.toISOString().split('T')[0],
        filters,
        { enabled: true }
    );

    // Desktop: Use week view with better performance
    const weekStart = useMemo(() => {
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - start.getDay());
        return start.toISOString().split('T')[0];
    }, [selectedDate]);

    const weekEnd = useMemo(() => {
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + (6 - end.getDay()));
        return end.toISOString().split('T')[0];
    }, [selectedDate]);

    const agendaWeekQuery = useAgendaWeek(
        weekStart,
        weekEnd,
        'LOG',
        { enabled: !isMobile }
    );

    // Dashboard hook for metrics
    const dashboardQuery = useAgendaDashboard(
        selectedDate.toISOString().split('T')[0],
        { start: weekStart, end: weekEnd },
        filters
    );

    // Determine which query to use based on device
    const dayQuery = isMobile ? agendaDayQueryMobile : agendaDayQuery;
    const weekQuery = agendaWeekQuery;

    // Combine data from both queries
    const dayData = dayQuery.data || { appointments: [], summary: {} };
    const weekData: any = weekQuery.data || { days: [], summary: {} };
    const dashboardData = dashboardQuery || { day: { summary: {} } };

    // Define centralized loading state
    const isLoading = isMobile ? dayQuery.isLoading : (weekQuery.isLoading || dashboardQuery.isLoading);

    // Calculate combined metrics
    const summary = useMemo(() => {
        const daySummary = dayData?.summary || {};
        const weekSummary = weekData?.summary || {};
        const dashboardSummary = dashboardQuery.day?.summary || {};

        return {
            total: (daySummary.total || 0) + (weekSummary.totalAppointments || 0) + (dashboardSummary.total || 0),
            byStatus: {
                PENDENTE: (daySummary.byStatus?.PENDENTE || 0),
                CONFIRMADO: (daySummary.byStatus?.CONFIRMADO || 0),
                EM_ANDAMENTO: (daySummary.byStatus?.EM_ANDAMENTO || 0),
                FINALIZADO: (daySummary.byStatus?.FINALIZADO || 0),
                CANCELADO: (daySummary.byStatus?.CANCELADO || 0),
            },
        };
    }, [dayData, weekData, dashboardQuery]);

    // Utility functions
    const navigateToDay = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const updateFilters = useCallback((newFilters: Partial<AgendaFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Navigation handlers
    const handlePrevWeek = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 7);
        setSelectedDate(prev);
    }, [selectedDate]);

    const handleNextWeek = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 7);
        setSelectedDate(next);
    }, [selectedDate]);

    const handleToday = useCallback(() => {
        const today = new Date();
        setSelectedDate(today);
    }, []);

    // Optimized refresh for mobile
    const handleRefresh = useCallback(() => {
        if (isMobile) {
            dayQuery.refetch();
        } else {
            weekQuery.refetch();
            dashboardQuery.refetch();
        }
    }, [isMobile, selectedDate, weekStart, weekEnd, filters]);

    // Register mobile FAB
    useRegisterMobileAction('new_appointment', () => {
        openAppointmentModal({
            startAt: selectedDate.toISOString(),
            category: 'LOG',
        });
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {isMobile ? (
                // Mobile Layout (Keep existing implementation for stability)
                <>
                    <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Agenda LOG</h1>
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                                <p className="text-sm text-gray-600">Logística</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePrevWeek}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Semana anterior"
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                </button>
                                <button
                                    onClick={handleToday}
                                    className="p-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/600 transition-colors"
                                >
                                    Hoje
                                </button>
                                <button
                                    onClick={handleNextWeek}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Próxima semana"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            {statusColumns.map((status) => (
                                <button
                                    key={status.key}
                                    onClick={() => updateFilters({ status: status.key })}
                                    className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${filters.status === status.key
                                        ? `${status.color} text-white`
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <MobileCalendarCompactView
                            appointments={(dayData as any).appointments || []}
                            isLoading={dayQuery.isLoading}
                            selectedDayDate={selectedDate}
                            onSelectDay={navigateToDay}
                            onAppointmentClick={(apt) => {
                                openDetailsModal(apt.id);
                            }}
                            onCreateNew={() => {
                                openAppointmentModal({
                                    startAt: selectedDate.toISOString(),
                                    category: 'LOG',
                                });
                            }}
                            performers={[]}
                            selectedPerformerId={filters.performerId}
                            onPerformerChange={(id) => updateFilters({ performerId: id })}
                            tab="active"
                            onTabChange={() => { }}
                            onBulkModeToggle={() => { }}
                            selectedIds={[]}
                            onBulkDelete={() => { }}
                            onBulkRestore={() => { }}
                        />
                    </div>
                </>
            ) : (
                // Desktop Layout (Standardized)
                <div className="flex flex-col h-full overflow-hidden">
                    <WebAgendaLayout
                        appointments={weekData?.days ? weekData.days.flatMap((d: any) => d.appointments || []) : (dayData as any).appointments || []}
                        weekData={weekData}
                        selectedDate={selectedDate}
                        onSelectedDateChange={navigateToDay}
                        searchTerm={filters.search || ''}
                        onSearchChange={(term) => updateFilters({ search: term })}
                        performers={[]}
                        selectedPerformerId={filters.performerId || 'ALL'}
                        onPerformerChange={(id) => updateFilters({ performerId: id })}
                        view={isMobile ? 'COMPACT' : view}
                        onViewChange={setView}
                        onCreateNew={() => {
                            window.dispatchEvent(new CustomEvent('openAppointmentModal', {
                                detail: {
                                    startAt: selectedDate.toISOString(),
                                    category: 'LOG',
                                }
                            }));
                        }}
                        tab="active"
                        onTabChange={() => { }}
                        isLoading={isLoading}
                        onRefresh={handleRefresh}
                        onAppointmentClick={(apt) => {
                            window.dispatchEvent(new CustomEvent('openAppointmentModal', {
                                detail: { id: apt.id }
                            }));
                        }}
                        breadcrumb="7Pet > Agenda Logística"
                    />

                    {/* Status Bar for LOG */}
                    <div className="bg-white border-t border-gray-200 px-4 py-2 shrink-0 z-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {statusColumns.map((status) => (
                                    <button
                                        key={status.key}
                                        onClick={() => updateFilters({ status: status.key })}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.status === status.key
                                            ? `${status.color} text-white`
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Additional Metrics for LOG */}
                                <div className="flex gap-4 text-xs font-medium text-gray-600 border-r pr-4 border-gray-200">
                                    <span className="text-orange-600">Pend: {summary.byStatus?.PENDENTE || 0}</span>
                                    <span className="text-purple-600">And: {summary.byStatus?.EM_ANDAMENTO || 0}</span>
                                    <span className="text-teal-600">Fim: {summary.byStatus?.FINALIZADO || 0}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{summary.total} agendamentos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                <AppointmentFormModal
                    isOpen={appointmentModalOpen}
                    appointment={appointmentData}
                    isCopy={isCopy}
                    preFill={preFill}
                    onClose={closeAppointmentModal}
                    onSuccess={() => {
                        handleRefresh();
                        closeAppointmentModal();
                    }}
                />
                <AppointmentDetailsModal
                    isOpen={detailsModalOpen}
                    appointment={{ id: appointmentId }}
                    onClose={closeDetailsModal}
                    onSuccess={() => {
                        handleRefresh();
                        closeDetailsModal();
                    }}
                    onModify={(apt) => openAppointmentModal({ appointment: apt })}
                    onCopy={(apt) => openAppointmentModal({ appointment: apt, isCopy: true })}
                />
            </AnimatePresence>
        </div>
    );
}