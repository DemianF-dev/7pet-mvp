import { useState } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle, Calendar, Filter, CalendarDays, Grid3X3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MobileShell } from '../../../layouts/MobileShell';
import api from '../../../services/api';
import { motion } from 'framer-motion';

// Mock types for Agenda (to match real API)
interface Appointment {
    id: string;
    startAt: string;
    endAt: string;
    status: 'PENDENTE' | 'CONFIRMADO' | 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO';
    pet: { name: string; photo?: string };
    customer: { name: string };
    services: { name: string }[];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDENTE': return 'bg-orange-100 text-orange-600 border-orange-200';
        case 'CONFIRMADO': return 'bg-green-100 text-green-600 border-green-200';
        case 'EM_ATENDIMENTO': return 'bg-purple-100 text-purple-600 border-purple-200';
        case 'FINALIZADO': return 'bg-blue-100 text-blue-600 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export const MobileAgenda = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 1. Fetch Appointments for the selected day
    const { data: dayData, isLoading } = useQuery({
        queryKey: ['agenda-day', selectedDate.toISOString().split('T')[0]],
        queryFn: async () => {
            // Reusing the existing endpoint logic
            const dateStr = selectedDate.toISOString().split('T')[0];
            const res = await api.get(`/agenda/day?date=${dateStr}&module=SPA`);
            return res.data;
        }
    });

    const appointments: Appointment[] = dayData?.appointments || [];

    // Week navigation logic
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(selectedDate, { weekStartsOn: 0 })
    });

    return (
        <MobileShell
            title="Agenda"
            rightAction={
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                        <button
                            className="p-2 rounded-lg bg-white dark:bg-zinc-700 text-blue-600 shadow-sm"
                            title="Dia"
                        >
                            <CalendarDays size={16} />
                        </button>
                        <button
                            className="p-2 rounded-lg text-gray-500"
                            title="Semana"
                        >
                            <Grid3X3 size={16} />
                        </button>
                        <button
                            className="p-2 rounded-lg text-gray-500"
                            title="Mês"
                        >
                            <Calendar size={16} />
                        </button>
                    </div>
                    <button className="p-2 text-blue-600">
                        <Filter size={20} />
                    </button>
                </div>
            }
        >
            <div className="pb-24 space-y-4">

                {/* 1. Date Selector (Strip) */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-2 sticky top-[calc(var(--header-height)+var(--safe-top)+10px)] z-30">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <button onClick={() => setSelectedDate(subDays(selectedDate, 7))} className="p-1 text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalise">
                            {format(selectedDate, 'MMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1 text-gray-400">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex justify-between">
                        {weekDays.map((date) => {
                            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={`flex flex-col items-center justify-center w-10 h-14 rounded-xl transition-all ${isSelected
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    <span className="text-[10px] uppercase font-bold opacity-70">
                                        {format(date, 'EEE', { locale: ptBR }).replace('.', '')}
                                    </span>
                                    <span className={`text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-gray-900 dark:text-gray-200'}`}>
                                        {format(date, 'dd')}
                                    </span>
                                    {isToday && !isSelected && (
                                        <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Timeline View */}
                <div className="space-y-3 min-h-[50vh]">
                    {isLoading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Calendar size={48} strokeWidth={1} className="mb-4 opacity-30" />
                            <p className="text-sm font-medium">Sem agendamentos para este dia.</p>
                            <button className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-full">
                                + Agendar
                            </button>
                        </div>
                    ) : (
                        appointments.map((apt) => (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center pt-2 w-12 shrink-0">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">
                                            {format(new Date(apt.startAt), 'HH:mm')}
                                        </span>
                                        <div className="h-full w-0.5 bg-gray-200 dark:bg-zinc-800 mt-2 relative">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                        </div>
                                    </div>

                                    <div className="flex-1 pb-4">
                                        <div className={`p-4 rounded-2xl border-l-4 shadow-sm bg-white dark:bg-zinc-900 ${getStatusColor(apt.status)} !bg-opacity-5 !border-opacity-100`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                    {apt.pet.name}
                                                </h4>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(apt.status)} bg-opacity-20`}>
                                                    {apt.status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 font-medium mb-1">
                                                {apt.customer.name}
                                            </p>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {apt.services.map((s, idx) => (
                                                    <span key={idx} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded text-xs">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* FAB (Floating Action Button) */}
                <button
                    className="fixed bottom-[calc(var(--tabbar-height)+20px)] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center z-40 active:scale-90 transition-transform"
                    onClick={() => {/* Trigger existing logic via store/context */ }}
                >
                    <PlusCircle size={28} />
                </button>
            </div>
        </MobileShell>
    );
};
