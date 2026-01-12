import React from 'react';
import AgendaItemCompact from './AgendaItemCompact';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customer: { name: string; type?: string };
    pet: { name: string; species?: string };
    services?: { id: string; name: string }[];
    service?: { name: string };
    performer?: { color?: string };
    quote?: {
        appointments?: { category: string }[];
    };
    address?: string;
}

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

    // Empty state
    if (!isLoading && appointments.length === 0) {
        return (
            <div className="w-full">
                {/* Date Header */}
                <div className="px-5 py-5 border-b border-[var(--color-border)] opacity-80">
                    <h3 className="text-[13px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                        {displayDate}
                    </h3>
                </div>

                {/* Empty Message */}
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                    <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mb-6 opacity-30">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-tertiary)]"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
                    </div>
                    <p className="text-[var(--color-text-tertiary)] text-sm font-medium mb-1">
                        Dia livre
                    </p>
                    <p className="text-[var(--color-text-quaternary)] text-[12px] mb-6">
                        Nenhum agendamento para esta data
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="bg-[var(--color-accent-primary)] text-white px-6 py-3 rounded-xl font-black text-[12px] uppercase tracking-wider shadow-lg shadow-[var(--color-accent-primary)]/10"
                    >
                        Criar Agendamento
                    </button>
                </div>
            </div>
        );
    }

    // List with appointments
    return (
        <div className="w-full pb-24">
            {/* Date Header */}
            <div className="px-5 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] sticky top-0 z-10 backdrop-blur-md">
                <h3 className="text-[13px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                    {displayDate}
                </h3>
            </div>

            {/* List Items */}
            <div className="divide-y divide-[var(--color-border)]/50">
                {isLoading ? (
                    // Skeleton
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-[var(--color-bg-tertiary)] animate-pulse mb-0.5 mx-4 rounded-xl opacity-20" />
                    ))
                ) : (
                    appointments.map(appt => (
                        <AgendaItemCompact
                            key={appt.id}
                            appointment={appt}
                            onClick={onAppointmentClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

