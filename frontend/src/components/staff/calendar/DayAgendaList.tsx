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
                <div className="px-4 py-4 border-b border-gray-800/30">
                    <h3 className="text-[14px] text-gray-400 capitalize">
                        {displayDate}
                    </h3>
                </div>

                {/* Empty Message */}
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <p className="text-gray-600 text-sm mb-4">
                        Nenhum agendamento neste dia
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="text-blue-500 font-medium text-sm hover:underline"
                    >
                        + Criar novo
                    </button>
                </div>
            </div>
        );
    }

    // List with appointments
    return (
        <div className="w-full pb-20">
            {/* Date Header */}
            <div className="px-4 py-4 border-b border-gray-800/30 bg-[#121212] sticky top-0 z-10">
                <h3 className="text-[14px] text-gray-400 capitalize">
                    {displayDate}
                </h3>
            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-800/30">
                {isLoading ? (
                    // Skeleton
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-[56px] bg-gray-900/50 animate-pulse" />
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
