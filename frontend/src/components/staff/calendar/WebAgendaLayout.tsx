
import React from 'react';
import WebAgendaToolbar from './WebAgendaToolbar';
import WebMonthGrid from './WebMonthGrid';
import { Container } from '../../layout/LayoutHelpers';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customer: { name: string; type: string };
    pet: { name: string; species: string };
    services?: { name: string }[];
    service?: { name: string };
    performer?: { color?: string };
    quote?: { appointments?: { category: string }[] };
    [key: string]: any;
}

interface WebAgendaLayoutProps {
    appointments: Appointment[];
    selectedDate: Date;
    onSelectedDateChange: (date: Date) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    performers: any[];
    selectedPerformerId: string;
    onPerformerChange: (id: string) => void;
    view: 'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT';
    onViewChange: (view: any) => void; // Using any to avoid strict type conflicts with parent
    onCreateNew: () => void;
    tab: 'active' | 'trash';
    onTabChange: (tab: 'active' | 'trash') => void;
    isLoading: boolean;
    onRefresh: () => void;
    onAppointmentClick: (appt: Appointment) => void;
    breadcrumb?: string;
    children?: React.ReactNode; // For other views if needed
}

export default function WebAgendaLayout({
    appointments,
    selectedDate,
    onSelectedDateChange,
    searchTerm,
    onSearchChange,
    performers,
    selectedPerformerId,
    onPerformerChange,
    view,
    onViewChange,
    onCreateNew,
    tab,
    onTabChange,
    isLoading,
    onRefresh,
    onAppointmentClick,
    breadcrumb,
    children
}: WebAgendaLayoutProps) {

    // Handlers for toolbar
    const handleNextDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() + 1);
        else if (view === 'WEEK') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        onSelectedDateChange(d);
    };

    const handlePrevDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() - 1);
        else if (view === 'WEEK') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        onSelectedDateChange(d);
    };

    const handleToday = () => {
        onSelectedDateChange(new Date());
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-white dark:bg-gray-950 overflow-hidden">
            <WebAgendaToolbar
                selectedDate={selectedDate}
                onNextDate={handleNextDate}
                onPrevDate={handlePrevDate}
                onToday={handleToday}
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                performers={performers}
                selectedPerformerId={selectedPerformerId}
                onPerformerChange={onPerformerChange}
                view={view}
                onViewChange={onViewChange}
                onCreateNew={onCreateNew}
                tab={tab}
                onTabChange={onTabChange}
                isLoading={isLoading}
                onRefresh={onRefresh}
                breadcrumb={breadcrumb}
            />

            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {view === 'MONTH' ? (
                    <WebMonthGrid
                        currentDate={selectedDate}
                        appointments={appointments}
                        onSelectDay={(date) => {
                            onSelectedDateChange(date);
                            onViewChange('DAY');
                        }}
                        onAppointmentClick={onAppointmentClick}
                    />
                ) : (
                    <Container fluid className="py-6 h-full">
                        {children}
                    </Container>
                )}
            </div>
        </div>
    );
}
