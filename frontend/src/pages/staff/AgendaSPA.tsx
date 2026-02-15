import { useState, useCallback, useMemo } from 'react';
import { useAgendaDay, useAgendaWeek, useAgendaDashboard, AgendaFilters } from '../../query/hooks/useAgenda';
import { AnimatePresence } from 'framer-motion';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import { MobileAgenda } from './agenda/MobileAgenda';
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
    const [view, setView] = useState<'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT'>('MONTH');
    const [tab, setTab] = useState<'active' | 'trash'>('active');

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

    if (isMobile) {
        return <MobileAgenda />;
    }

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

            <AnimatePresence mode="wait">
                {appointmentModalOpen && (
                    <AppointmentFormModal
                        key="appointment-form-modal"
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
                )}
                {detailsModalOpen && (
                    <AppointmentDetailsModal
                        key="appointment-details-modal"
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
                )}
            </AnimatePresence>
        </div>
    );
}
