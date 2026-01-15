import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Calendar, Clock, Truck, Droplets, CheckCircle,
    AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface PackageSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    packageId?: string;
    quoteId?: string;
    packageData?: {
        id: string;
        frequency: string;
        customer: { id: string; name: string };
        pet: { id: string; name: string };
        items: { description: string; quantity: number }[];
    };
    onSuccess: (appointments: any[]) => void;
}

interface ScheduledAppointment {
    id: string;
    serviceDescription: string;
    startAt: Date;
    performerId?: string;
    isTransport: boolean;
    transportType?: 'LEVA' | 'TRAZ';
}

const FREQUENCY_CONFIG = {
    SEMANAL: { baths: 4, label: 'Semanal', description: '4 banhos/mês' },
    QUINZENAL: { baths: 2, label: 'Quinzenal', description: '2 banhos/mês' },
    MENSAL: { baths: 1, label: 'Mensal', description: '1 banho/mês' }
};

export default function PackageSchedulerModal({
    isOpen,
    onClose,
    packageId,
    quoteId,
    packageData,
    onSuccess
}: PackageSchedulerModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState<ScheduledAppointment[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [performers, setPerformers] = useState<any[]>([]);

    const frequency = packageData?.frequency as keyof typeof FREQUENCY_CONFIG;
    const config = FREQUENCY_CONFIG[frequency] || FREQUENCY_CONFIG.MENSAL;

    useEffect(() => {
        if (isOpen) {
            fetchPerformers();
            initializeAppointments();
        }
    }, [isOpen, packageData]);

    const fetchPerformers = async () => {
        try {
            const res = await api.get('/staff');
            setPerformers(res.data || []);
        } catch (error) {
            console.error('Error fetching performers:', error);
        }
    };

    const initializeAppointments = () => {
        if (!packageData) return;

        const newAppointments: ScheduledAppointment[] = [];
        const today = new Date();
        today.setHours(9, 0, 0, 0);

        // Create empty slots for required services
        packageData.items.forEach((item, idx) => {
            for (let i = 0; i < item.quantity; i++) {
                const isTransport = item.description.toLowerCase().includes('transporte') ||
                    item.description.toLowerCase().includes('leva') ||
                    item.description.toLowerCase().includes('traz');

                newAppointments.push({
                    id: `${idx}-${i}`,
                    serviceDescription: item.description,
                    startAt: new Date(today.getTime() + (i * 7 * 24 * 60 * 60 * 1000)), // Weekly intervals
                    isTransport,
                    transportType: isTransport ? (item.description.toLowerCase().includes('traz') ? 'TRAZ' : 'LEVA') : undefined
                });
            }
        });

        setAppointments(newAppointments);
    };

    const updateAppointment = (id: string, field: string, value: any) => {
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, [field]: value } : a
        ));
    };

    const addAppointment = () => {
        const newId = `new-${Date.now()}`;
        setAppointments(prev => [...prev, {
            id: newId,
            serviceDescription: 'Novo Serviço',
            startAt: selectedDate || new Date(),
            isTransport: false
        }]);
    };

    const removeAppointment = (id: string) => {
        setAppointments(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = async () => {
        if (appointments.length === 0) {
            return toast.error('Adicione pelo menos um agendamento');
        }

        const unscheduled = appointments.filter(a => !a.startAt);
        if (unscheduled.length > 0) {
            return toast.error('Todos os agendamentos precisam de data/hora');
        }

        setIsLoading(true);
        try {
            const payload = {
                appointments: appointments.map(a => ({
                    serviceDescription: a.serviceDescription,
                    startAt: a.startAt.toISOString(),
                    performerId: a.performerId,
                    isTransport: a.isTransport,
                    transportType: a.transportType
                }))
            };

            const endpoint = packageId
                ? `/packages/${packageId}/schedule`
                : `/packages/quote/${quoteId}/schedule`;

            const res = await api.post(endpoint, payload);

            if (res.data.success) {
                toast.success(`${res.data.appointments?.length || 0} agendamentos criados!`);
                onSuccess(res.data.appointments || []);
                onClose();
            } else {
                toast.error(res.data.message || 'Erro ao agendar');
            }
        } catch (error: any) {
            console.error('Error scheduling package:', error);
            toast.error(error.response?.data?.error || 'Erro ao agendar pacote');
        } finally {
            setIsLoading(false);
        }
    };

    // Calendar helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const isSameDay = (d1: Date | null, d2: Date | null) => {
        if (!d1 || !d2) return false;
        return d1.toDateString() === d2.toDateString();
    };

    const hasAppointmentOnDay = (date: Date) => {
        return appointments.some(a => isSameDay(a.startAt, date));
    };

    const handleDayClick = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);
    };

    const navigateMonth = (delta: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Calendar size={24} className="text-purple-500" />
                                    Agendar Pacote
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                                    {packageData?.customer?.name} • {packageData?.pet?.name} •
                                    <span className="text-purple-500 font-black ml-1">{config.label}</span>
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Calendar Section */}
                            <div className="w-1/3 border-r border-gray-100 dark:border-gray-700 p-4">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => navigateMonth(-1)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="font-black text-sm uppercase tracking-wide">
                                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                        <div key={i} className="text-[10px] font-black text-gray-400 uppercase py-2">
                                            {d}
                                        </div>
                                    ))}
                                    {getDaysInMonth(currentMonth).map((date, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleDayClick(date)}
                                            disabled={!date}
                                            className={`
                                                aspect-square rounded-xl text-xs font-bold transition-all
                                                ${!date ? 'invisible' : ''}
                                                ${isSameDay(date, selectedDate) ? 'bg-purple-500 text-white shadow-lg scale-110' : ''}
                                                ${isSameDay(date, new Date()) && !isSameDay(date, selectedDate) ? 'ring-2 ring-purple-300' : ''}
                                                ${hasAppointmentOnDay(date!) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''}
                                                ${!isSameDay(date, selectedDate) && !hasAppointmentOnDay(date!) ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                                            `}
                                        >
                                            {date?.getDate()}
                                        </button>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="space-y-2 text-[10px] font-bold">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-purple-500" />
                                        <span className="text-gray-500">Selecionado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-100" />
                                        <span className="text-gray-500">Com agendamento</span>
                                    </div>
                                </div>

                                {/* Selected Date Actions */}
                                {selectedDate && (
                                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                                        <p className="text-xs font-black text-purple-600 mb-2">
                                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <button
                                            onClick={addAppointment}
                                            className="w-full py-2 bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Adicionar Nesta Data
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Appointments List */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">
                                        Agendamentos ({appointments.length})
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        {config.description}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {appointments.map((appt) => (
                                        <div
                                            key={appt.id}
                                            className={`
                                                p-4 rounded-2xl border transition-all
                                                ${appt.isTransport
                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-10 h-10 rounded-xl flex items-center justify-center
                                                        ${appt.isTransport ? 'bg-orange-500/20 text-orange-600' : 'bg-blue-500/20 text-blue-600'}
                                                    `}>
                                                        {appt.isTransport ? <Truck size={20} /> : <Droplets size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-white">
                                                            {appt.serviceDescription}
                                                        </p>
                                                        {appt.transportType && (
                                                            <span className="text-[10px] font-black uppercase text-orange-600">
                                                                {appt.transportType === 'LEVA' ? '📦 Coleta' : '🏠 Entrega'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeAppointment(appt.id)}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Data</label>
                                                    <input
                                                        type="date"
                                                        value={appt.startAt.toISOString().split('T')[0]}
                                                        onChange={(e) => updateAppointment(appt.id, 'startAt', new Date(e.target.value))}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-none rounded-xl text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Horário</label>
                                                    <input
                                                        type="time"
                                                        value={appt.startAt.toTimeString().slice(0, 5)}
                                                        onChange={(e) => {
                                                            const [h, m] = e.target.value.split(':');
                                                            const newDate = new Date(appt.startAt);
                                                            newDate.setHours(parseInt(h), parseInt(m));
                                                            updateAppointment(appt.id, 'startAt', newDate);
                                                        }}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-none rounded-xl text-sm font-bold"
                                                    />
                                                </div>
                                            </div>

                                            {performers.length > 0 && (
                                                <div className="mt-3">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Responsável</label>
                                                    <select
                                                        value={appt.performerId || ''}
                                                        onChange={(e) => updateAppointment(appt.id, 'performerId', e.target.value || undefined)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-none rounded-xl text-sm font-bold"
                                                    >
                                                        <option value="">Auto (qualquer)</option>
                                                        {performers.map((p: any) => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {appointments.length === 0 && (
                                        <div className="text-center py-12 text-gray-400">
                                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-bold">Nenhum agendamento ainda</p>
                                            <p className="text-xs mt-1">Clique em um dia no calendário para adicionar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                            <div className="flex items-center gap-2 text-sm">
                                {appointments.length > 0 && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle size={16} />
                                        <span className="font-bold">{appointments.length} agendamentos prontos</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading || appointments.length === 0}
                                    className={`
                                        px-8 py-3 rounded-2xl font-black text-white uppercase tracking-wide transition-all
                                        ${appointments.length > 0
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg hover:scale-105'
                                            : 'bg-gray-300 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isLoading ? 'Agendando...' : `Confirmar ${appointments.length} Agendamentos`}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
