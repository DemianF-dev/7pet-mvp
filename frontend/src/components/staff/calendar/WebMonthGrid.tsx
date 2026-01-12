
import React, { useState } from 'react';
import { Clock, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface WebMonthGridProps {
    currentDate: Date;
    appointments: Appointment[];
    onSelectDay: (date: Date) => void;
    onAppointmentClick: (appt: Appointment) => void;
}

export default function WebMonthGrid({
    currentDate,
    appointments,
    onSelectDay,
    onAppointmentClick
}: WebMonthGridProps) {
    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    // Calendar generation
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysFromMonday = (dayOfWeek + 6) % 7; // Mon=0

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - daysFromMonday);

    const days: Date[] = [];
    const current = new Date(startDate);
    // Standard 6 rows (42 days) to keep grid stable
    for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const weekHeaders = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const today = new Date();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'CONFIRMADO': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'EM_ATENDIMENTO': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'FINALIZADO': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-none shadow-sm flex flex-col h-full overflow-hidden">
            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {weekHeaders.map((day, i) => (
                    <div key={i} className="py-2 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-[800px]">
                {days.map((day, colIdx) => {
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = isSameDay(day, today);

                    const dayAppts = appointments
                        .filter(a => isSameDay(new Date(a.startAt), day))
                        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

                    // Slice for display, showing max 5 items per cell
                    const MAX_ITEMS = 5;
                    const displayedAppts = dayAppts.slice(0, MAX_ITEMS);
                    const remaining = dayAppts.length - MAX_ITEMS;

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => onSelectDay(day)}
                            className={`
                                border-b border-r border-gray-200 dark:border-gray-800 relative p-1 group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80
                                ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-900'}
                            `}
                        >
                            {/* Day Number */}
                            <div className="flex items-center justify-between mb-1 px-1">
                                <span className={`
                                    text-[11px] font-bold rounded-full w-6 h-6 flex items-center justify-center
                                    ${isToday
                                        ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                                        : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-700'
                                    }
                                `}>
                                    {day.getDate()}
                                </span>
                                {dayAppts.length > 0 && (
                                    <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors">
                                        {dayAppts.length} agend.
                                    </span>
                                )}
                            </div>

                            {/* Appointments List */}
                            <div className="space-y-0.5">
                                {displayedAppts.map(appt => {
                                    const time = new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    const statusClass = getStatusColor(appt.status);

                                    return (
                                        <div
                                            key={appt.id}
                                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(appt); }}
                                            className={`
                                                px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1.5 cursor-pointer truncate
                                                hover:brightness-95 hover:scale-[1.01] transition-all relative group/event
                                                ${statusClass}
                                            `}
                                            title={`${time} - ${appt.pet.name} (${appt.customer.name}) - ${appt.status}`}
                                            style={appt.performer?.color ? { borderLeft: `3px solid ${appt.performer.color}` } : { borderLeft: '3px solid transparent' }}
                                        >
                                            <span className="opacity-70 tabular-nums shrink-0">{time}</span>
                                            <span className="font-bold truncate">{appt.pet.name}</span>
                                        </div>
                                    );
                                })}

                                {remaining > 0 && (
                                    <div className="text-[10px] text-gray-400 font-bold text-center hover:text-primary cursor-pointer py-0.5">
                                        + {remaining} mais...
                                    </div>
                                )}
                            </div>

                            {/* Add Button on Hover (Bitrix style) */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-primary">
                                    <PlusIcon size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const PlusIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
