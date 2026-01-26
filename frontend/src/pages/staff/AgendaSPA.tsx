import { useState, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useAgendaDay, useAgendaWeek, useAgendaDashboard, AgendaFilters } from '../../query/hooks/useAgenda';
import { AnimatePresence } from 'framer-motion';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import MobileCalendarCompactView from '../../components/staff/calendar/MobileCalendarCompactView';
import WebAgendaLayout from '../../components/staff/calendar/WebAgendaLayout';
import { queryKeys } from '../../query/keys';
import { useAuthStore } from '../../store/authStore';
import { useModalStore } from '../../store/modalStore';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { useRegisterMobileAction } from '../../hooks/useMobileActions';
import { queryClient } from '../../lib/queryClient';

const statusColumns = [
    { key: 'PENDENTE', label: 'Solicitados', color: 'bg-orange-500' },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-green-500' },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'bg-purple-600' },
    { key: 'FINALIZADO', label: 'Finalizados', color: 'bg-teal-500' },
];

export default function AgendaSPA() {
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
        openDetailsModal,
        closeAppointmentModal,
        closeDetailsModal
    } = useModalStore();

    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState<AgendaFilters>({
        module: 'SPA',
        performerId: user?.division === 'MASTER' ? 'ALL' : user?.id,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT'>('WEEK');
    const [tab, setTab] = useState<'active' | 'trash'>('active');

    // React Query hooks
    const agendaDayQuery = useAgendaDay(
        selectedDate.toISOString().split('T')[0],
        filters,
        { enabled: true }
    );

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
        'SPA',
        { enabled: !isMobile }
    );

    const dashboardQuery = useAgendaDashboard(
        selectedDate.toISOString().split('T')[0],
        { start: weekStart, end: weekEnd },
        filters
    );

    const isLoading = isMobile
        ? agendaDayQuery.isLoading
        : agendaWeekQuery.isLoading || dashboardQuery.isLoading;

    const summary = useMemo(() => {
        const dayData = agendaDayQuery.data || { summary: { total: 0, revenue: 0, byStatus: {} } };
        const weekData = agendaWeekQuery.data || { summary: { totalAppointments: 0, totalRevenue: 0 } };

        return {
            total: isMobile
                ? ((dayData.summary as any)?.total || 0)
                : ((weekData.summary as any)?.totalAppointments || 0),
            byStatus: (dayData.summary as any)?.byStatus || {
                PENDENTE: 0,
                CONFIRMADO: 0,
                EM_ATENDIMENTO: 0,
                FINALIZADO: 0,
            },
            revenue: isMobile
                ? ((dayData.summary as any)?.revenue || 0)
                : ((weekData.summary as any)?.totalRevenue || 0),
        };
    }, [agendaDayQuery.data, agendaWeekQuery.data, isMobile]);

    const navigateToDay = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const navigateToPrevDay = useCallback(() => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    }, [selectedDate]);

    const navigateToNextDay = useCallback(() => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    }, [selectedDate]);

    const goToToday = useCallback(() => {
        setSelectedDate(new Date());
    }, []);

    const handleFilterChange = useCallback((key: keyof AgendaFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleRefresh = useCallback(() => {
        if (isMobile) {
            agendaDayQuery.refetch();
        } else {
            agendaWeekQuery.refetch();
            dashboardQuery.refetch();
        }
    }, [isMobile]);

    const handleBulkSelectAll = useCallback(() => {
        const allIds = (agendaDayQuery.data as any)?.appointments?.map((apt: any) => apt.id) || [];
        queryClient.setQueryData(
            queryKeys.agenda.day(selectedDate.toISOString().split('T')[0], filters.module, filters),
            (prev: any) => {
                if (!prev) return prev;
                return { ...prev, selectedIds: allIds };
            }
        );
    }, [agendaDayQuery.data, selectedDate, filters]);

    useRegisterMobileAction('bulk_select_all', handleBulkSelectAll);

    const handleNewAppointmentAction = useCallback(() => {
        openAppointmentModal({
            preFill: { startAt: selectedDate.toISOString(), category: 'SPA' }
        });
    }, [selectedDate, openAppointmentModal]);

    useRegisterMobileAction('new_appointment', handleNewAppointmentAction);

    if (!isMobile) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
                <WebAgendaLayout
                    appointments={agendaWeekQuery.data?.days?.flatMap((d: any) => d.appointments) || agendaDayQuery.data?.appointments || []}
                    weekData={agendaWeekQuery.data}
                    selectedDate={selectedDate}
                    onSelectedDateChange={navigateToDay}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    view={view}
                    onViewChange={setView}
                    performers={[]}
                    selectedPerformerId={filters.performerId || 'ALL'}
                    onPerformerChange={(id) => handleFilterChange('performerId', id)}
                    onCreateNew={() => {
                        openAppointmentModal({
                            preFill: { startAt: selectedDate.toISOString(), category: 'SPA' }
                        });
                    }}
                    tab={tab}
                    onTabChange={setTab}
                    isLoading={isLoading}
                    onRefresh={handleRefresh}
                    onAppointmentClick={(apt) => {
                        const allAppointments = [
                            ...(agendaWeekQuery.data?.days?.flatMap((d: any) => d.appointments) || []),
                            ...(agendaDayQuery.data?.appointments || [])
                        ];
                        const fullApt = allAppointments.find(a => a.id === apt.id) || apt;
                        openDetailsModal(fullApt.id);
                    }}
                    breadcrumb="7Pet > Agenda SPA"
                />

                <div className="bg-white border-t border-gray-200 px-4 py-2 shrink-0 z-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {statusColumns.map((status) => (
                                <button
                                    key={status.key}
                                    onClick={() => handleFilterChange('status', status.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.status === status.key
                                        ? `${status.color} text-white`
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <select
                                value={filters.module}
                                onChange={(e) => handleFilterChange('module', e.target.value)}
                                className="mr-4 px-2 py-1 border border-gray-300 rounded text-xs"
                            >
                                <option value="SPA">SPA</option>
                                <option value="LOG">LOG</option>
                                <option value="ALL">TODOS</option>
                            </select>

                            <span>{summary.total} agendamentos</span>
                            {summary.revenue > 0 && (
                                <span className="ml-4 text-green-600 font-medium">
                                    R$ {summary.revenue.toLocaleString('pt-BR')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

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
                        appointment={(() => {
                            const allAppointments = [
                                ...(agendaWeekQuery.data?.days?.flatMap((d: any) => d.appointments) || []),
                                ...(agendaDayQuery.data?.appointments || [])
                            ];
                            return allAppointments.find(a => a.id === appointmentId) || { id: appointmentId };
                        })()}
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

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">SPA</p>
                        <button
                            onClick={handleRefresh}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <MobileCalendarCompactView
                    appointments={agendaDayQuery.data?.appointments || []}
                    isLoading={isLoading}
                    selectedDayDate={selectedDate}
                    onSelectDay={navigateToDay}
                    onAppointmentClick={(apt) => openDetailsModal(apt.id)}
                    onCreateNew={() => openAppointmentModal({ preFill: { startAt: selectedDate.toISOString(), category: 'SPA' } })}
                    onBulkModeToggle={() => { }}
                    isBulkMode={false}
                    selectedIds={[]}
                    tab="active"
                    onTabChange={() => { }}
                    performers={[]}
                    selectedPerformerId={filters.performerId || 'ALL'}
                    onPerformerChange={(id) => handleFilterChange('performerId', id)}
                    onBulkDelete={() => { }}
                    onBulkRestore={() => { }}
                />
            </div>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center gap-4 z-40">
                <button
                    onClick={goToToday}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                >
                    Hoje
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={navigateToPrevDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                        onClick={navigateToNextDay}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

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
                    appointment={(() => {
                        const allAppointments = agendaDayQuery.data?.appointments || [];
                        return allAppointments.find(a => a.id === appointmentId) || { id: appointmentId };
                    })()}
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