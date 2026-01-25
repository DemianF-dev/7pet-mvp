import React, { useState, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
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
import { toast } from 'react-hot-toast';

interface StatusColumn {
    key: string;
    label: string;
    color: string;
}

const statusColumns: StatusColumn[] = [
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

    // Desktop: week view with React Query
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

    // Dashboard hook for performance metrics
    const dashboardQuery = useAgendaDashboard(
        selectedDate.toISOString().split('T')[0],
        { start: weekStart, end: weekEnd },
        filters
    );

    // Determine loading states
    const isLoading = isMobile
        ? agendaDayQuery.isLoading
        : agendaWeekQuery.isLoading || dashboardQuery.isLoading;

    // Mobile: Use day data; Desktop: Use week data
    const data = isMobile ? agendaDayQuery.data || {} : {
        appointments: agendaWeekQuery.data?.days?.flatMap((day: any) => day.appointments) || [],
        summary: agendaWeekQuery.data?.summary || {
            totalAppointments: 0,
            totalRevenue: 0,
            totalSlots: 0,
        },
        conflicts: [],
        hasConflicts: false,
    };



    // Calculate combined metrics - Simplified for performance
    const summary = useMemo(() => {
        const dayData = agendaDayQuery.data || { summary: { total: 0, revenue: 0, byStatus: {} } };
        const weekData = agendaWeekQuery.data || { summary: { totalAppointments: 0, totalRevenue: 0 } };

        // Use day data for mobile, week data for desktop
        const sourceData = isMobile ? dayData : weekData;

        return {
            total: isMobile
                ? (dayData.summary?.total || 0)
                : (weekData.summary?.totalAppointments || 0),
            byStatus: dayData.summary?.byStatus || {
                PENDENTE: 0,
                CONFIRMADO: 0,
                EM_ATENDIMENTO: 0,
                FINALIZADO: 0,
            },
            revenue: isMobile
                ? (dayData.summary?.revenue || 0)
                : (weekData.summary?.totalRevenue || 0),
        };
    }, [agendaDayQuery.data, agendaWeekQuery.data, isMobile]);

    // Utility functions
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

    const updateFilters = useCallback((newFilters: Partial<AgendaFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Optimized handlers for mobile performance
    const handleFilterChange = useCallback((field: keyof AgendaFilters, value: any) => {
        updateFilters({ [field]: value });
    }, []);

    // Calendar navigation handlers
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

    const goToToday = useCallback(() => {
        navigateToDay(new Date());
    }, []);

    // Register mobile FAB
    useRegisterMobileAction('new_appointment', () => {
        // Open modal with pre-filled data using store
        openAppointmentModal({
            startAt: selectedDate.toISOString(),
            category: 'SPA',
        });
    });

    // Optimized bulk actions
    const handleSelectAll = useCallback(() => {
        if (!data.appointments?.length) return;

        queryClient.setQueriesData(
            queryKeys.agenda.day(selectedDate.toISOString().split('T')[0], filters.module, filters),
            (prev) => {
                if (!prev) return prev;
                const allIds = data.appointments?.map((apt: any) => apt.id) || [];
                return {
                    ...prev,
                    selectedIds: allIds,
                };
            }
        );
    }, [data.appointments, selectedDate, filters]);

    // Export functionality
    const handleExport = useCallback(() => {
        // Implementation would go here
        toast.success('Função de exportação em desenvolvimento');
    }, []);

    // Optimized refresh
    const handleRefresh = useCallback(() => {
        if (isMobile) {
            agendaDayQuery.refetch();
        } else {
            agendaWeekQuery.refetch();
            dashboardQuery.refetch();
        }
    }, [isMobile, selectedDate, weekStart, weekEnd, filters]);

    // Unified Render
    if (!isMobile) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
                <WebAgendaLayout
                    appointments={data.days?.flatMap((d: any) => d.appointments) || data.appointments || []}
                    weekData={agendaWeekQuery.data}
                    selectedDate={selectedDate}
                    onSelectedDateChange={navigateToDay}
                    searchTerm={filters.search || ''}
                    onSearchChange={(term) => handleFilterChange('search', term)}
                    performers={[]}
                    selectedPerformerId={filters.performerId || 'ALL'}
                    onPerformerChange={(id) => handleFilterChange('performerId', id)}
                    onViewChange={setView}
                    onCreateNew={() => {
                        openAppointmentModal({
                            startAt: selectedDate.toISOString(),
                            category: 'SPA',
                        });
                    }}
                    tab={tab}
                    onTabChange={setTab}
                    isLoading={isLoading}
                    onRefresh={() => {
                        agendaWeekQuery.refetch();
                        dashboardQuery.refetch();
                    }}
                    onAppointmentClick={(apt) => {
                        openDetailsModal(apt.id);
                    }}
                    breadcrumb="7Pet > Agenda SPA"
                />

                {/* Status Bar (Desktop) - Overlay or Bottom if needed. 
                    WebAgendaLayout is usually full height. 
                    If we want status bar, we should probably pass it as children or slot to WebAgendaLayout, 
                    OR WebAgendaLayout should be h-[calc(100vh-40px)]
                    
                    For now, let's inject it as children of WebAgendaLayout if view is not MONTH/WEEK/DAY,
                    BUT WebAgendaLayout manages the main grid area.
                    
                    Actually, WebAgendaLayout renders children in the "content" area if view is unknown.
                    
                    Better approach: WebAgendaLayout should perhaps accept a "footer" prop or we just put it below properly styled.
                    However, WebAgendaLayout (Step 636) is h-screen.
                    
                    Let's render it here but we need to fix WebAgendaLayout height first (NEXT STEP).
                    Assuming WebAgendaLayout will be h-full.
                */}
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
                            {/* Module Selector integrated in footer since WebToolbar doesn't have it yet? 
                                Or we should add it to WebToolbar. 
                                For now, let's keep it here or User accepts it's less visible.
                                Actually, user might need to switch modules.
                                Let's add module selector here for now.
                             */}
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
                            agendaWeekQuery.refetch();
                            dashboardQuery.refetch();
                            closeAppointmentModal();
                        }}
                    />
                    <AppointmentDetailsModal
                        isOpen={detailsModalOpen}
                        appointment={{ id: appointmentId }}
                        onClose={closeDetailsModal}
                        onSuccess={() => {
                            agendaWeekQuery.refetch();
                            dashboardQuery.refetch();
                            closeDetailsModal();
                        }}
                        onModify={(apt) => openAppointmentModal({ appointment: apt })}
                        onCopy={(apt) => openAppointmentModal({ appointment: apt, isCopy: true })}
                    />
                </AnimatePresence>
            </div>
        );
    }

    // MOBILE RENDER (Keep as is, just wrapped cleanly)
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                        <p className="text-sm text-gray-600">SPA</p>
                        <button
                            onClick={() => {
                                if (isMobile) {
                                    agendaDayQuery.refetch();
                                } else {
                                    agendaWeekQuery.refetch();
                                    dashboardQuery.refetch();
                                }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Recarregar dados"
                        >
                            <RefreshCw className="h-4 w-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
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
                <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <MobileCalendarCompactView
                    appointments={data.appointments || []}
                    isLoading={isLoading}
                    selectedDayDate={selectedDate}
                    onSelectDay={navigateToDay}
                    onAppointmentClick={(apt) => {
                        openDetailsModal(apt.id);
                    }}
                    onCreateNew={() => {
                        openAppointmentModal({
                            startAt: selectedDate.toISOString(),
                            category: 'SPA',
                        });
                    }}
                    onBulkModeToggle={() => { }}
                    selectedIds={[]}
                    tab="active"
                    onTabChange={() => { }}
                    performers={[]}
                    selectedPerformerId={filters.performerId}
                    onPerformerChange={(id) => handleFilterChange('performerId', id)}
                    onBulkDelete={() => { }}
                    onBulkRestore={() => { }}
                />
            </div>

            {/* Mobile Navigation */}
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
                        agendaDayQuery.refetch();
                        closeAppointmentModal();
                    }}
                />
                <AppointmentDetailsModal
                    isOpen={detailsModalOpen}
                    appointment={{ id: appointmentId }}
                    onClose={closeDetailsModal}
                    onSuccess={() => {
                        agendaDayQuery.refetch();
                        closeDetailsModal();
                    }}
                    onModify={(apt) => openAppointmentModal({ appointment: apt })}
                    onCopy={(apt) => openAppointmentModal({ appointment: apt, isCopy: true })}
                />
            </AnimatePresence>
        </div>
    );
}