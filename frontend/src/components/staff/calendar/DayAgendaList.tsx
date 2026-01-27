import AgendaItemCompact from './AgendaItemCompact';
import VirtualList from '../../system/VirtualList';
import QueryState from '../../system/QueryState';
import { EmptyState } from '../../ui';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

// Import the AgendaItem type for compatibility
import { AgendaItem } from '../../../features/agenda/domain/types';

// Use AgendaItem directly to ensure type compatibility
type Appointment = AgendaItem;

interface DayAgendaListProps {
    selectedDate: Date;
    appointments: Appointment[];
    isLoading: boolean;
    onAppointmentClick: (appt: Appointment) => void;
    onCreateNew: () => void;
}

export default function DayAgendaList({
    selectedDate,
    appointments,
    isLoading,
    onAppointmentClick,
    onCreateNew
}: DayAgendaListProps) {
    // Format: "Terça-feira, 13 de janeiro"
    const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    const DateHeader = () => (
        <div className="px-[var(--space-5)] py-[var(--space-4)] border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 sticky top-0 z-20 backdrop-blur-xl flex items-center justify-between">
            <h3 className="text-[var(--font-size-xs)] font-[var(--font-weight-black)] text-[var(--color-text-secondary)] uppercase tracking-[0.2em] opacity-70">
                {displayDate}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[var(--color-accent-primary)]/10 rounded-full border border-[var(--color-accent-primary)]/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-primary)] animate-pulse" />
                <span className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-accent-primary)] uppercase">Hoje</span>
            </div>
        </div>
    );

    const EmptyStateView = () => (
        <div className="w-full flex-1 flex flex-col">
            <DateHeader />
            <div className="flex-1 flex flex-col items-center justify-center">
                <EmptyState
                    icon={CalendarIcon}
                    title="Dia Livre"
                    description={`Nenhum agendamento para ${displayDate.split(',')[0].toLowerCase()}. Aproveite para organizar sua pauta!`}
                    action={{
                        label: "NOVO AGENDAMENTO",
                        onClick: onCreateNew,
                        icon: Plus,
                        props: {
                            className: "shadow-[0_12px_24px_-8px_var(--color-accent-primary-alpha)]"
                        }
                    }}
                />
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col">
            <QueryState
                isLoading={isLoading}
                isEmpty={appointments.length === 0}
                emptyState={<EmptyStateView />}
                className="flex-1"
            >
                <div className="w-full h-full pb-24">
                    <DateHeader />
                    <VirtualList
                        items={appointments}
                        estimateSize={90}
                        renderItem={(appt) => (
                            <div className="border-b border-[var(--color-border)]/50">
                                <AgendaItemCompact
                                    appointment={appt}
                                    onClick={onAppointmentClick}
                                />
                            </div>
                        )}
                    />
                </div>
            </QueryState>
        </div>
    );
}


