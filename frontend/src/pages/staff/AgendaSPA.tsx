import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Plus,
    Calendar as CalendarIcon,
    Layout,
    List,
    RefreshCcw,
    Clock,
    Search,
    Trash2,
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customerId: string;
    customer: { name: string; phone?: string; user: { email: string } };
    petId: string;
    pet: { name: string; species: string; breed: string };
    serviceId?: string; // Legacy
    services?: { id: string; name: string; basePrice: number; duration: number }[];
    service?: { name: string; basePrice: number; duration: number }; // Legacy
    transport?: any;
    deletedAt?: string;
}

type ViewType = 'KANBAN' | 'DAY' | 'WEEK' | 'MONTH';

const statusColumns = [
    { key: 'PENDENTE', label: 'Solicitados', color: 'bg-purple-500' },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-blue-500' },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'bg-purple-600' },
    { key: 'FINALIZADO', label: 'Finalizado', color: 'bg-green-500' }
];

export default function AgendaSPA() {
    const location = useLocation();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<ViewType>('MONTH');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrashView, setIsTrashView] = useState(false);
    const [trashAppointments, setTrashAppointments] = useState<Appointment[]>([]);
    const [preFillData, setPreFillData] = useState<any>(null);

    useEffect(() => {
        if (location.state?.prefill) {
            setPreFillData(location.state.prefill);
            setIsFormOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            setAppointments(response.data);
            if (isTrashView) fetchTrash();
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrash = async () => {
        try {
            const response = await api.get('/appointments/trash');
            setTrashAppointments(response.data);
        } catch (err) {
            console.error('Erro ao buscar lixeira:', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
        if (isTrashView) fetchTrash();
    }, [isTrashView]);

    const handleRestore = async (id: string) => {
        if (!window.confirm('Deseja restaurar este agendamento?')) return;
        try {
            await api.patch(`/appointments/${id}/restore`);
            fetchTrash();
            fetchAppointments();
        } catch (err) {
            alert('Erro ao restaurar agendamento');
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!window.confirm('ATENÇÃO: Esta ação é irreversível. Deseja excluir permanentemente?')) return;
        try {
            await api.delete(`/appointments/${id}/permanent`);
            fetchTrash();
        } catch (err) {
            alert('Erro ao excluir permanentemente');
        }
    };

    const updateStatus = async (id: string, status: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        const statusLabels: any = {
            'CONFIRMADO': 'confirmar',
            'EM_ATENDIMENTO': 'iniciar atendimento para',
            'FINALIZADO': 'finalizar',
            'CANCELADO': 'cancelar'
        };

        if (!window.confirm(`Deseja realmente ${statusLabels[status] || 'mudar o status de'} este agendamento?`)) return;

        try {
            await api.patch(`/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        }
    };

    const handleOpenDetails = (appt: Appointment) => {
        setSelectedAppointment(appt);
        setIsDetailsOpen(true);
    };

    const handleModify = (appt: Appointment) => {
        setIsDetailsOpen(false);
        setSelectedAppointment(appt);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const handleCopy = (appt: Appointment) => {
        setIsDetailsOpen(false);
        setSelectedAppointment(appt);
        setIsCopying(true);
        setIsFormOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedAppointment(null);
        setPreFillData(null);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesGlobal = a.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.services && a.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (a.service && a.service.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesGlobal;
    });

    const getColumnItems = (status: string) => filteredAppointments.filter(a => a.status === status);

    const timeSlots: string[] = [];
    for (let i = 0; i <= 23; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:15`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:45`);
    }

    const nextDay = () => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    const prevDay = () => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));
    const setToday = () => setSelectedDate(new Date());

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const dayAppointments = filteredAppointments.filter(a => isSameDay(new Date(a.startAt), selectedDate));

    const renderDayView = () => (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="flex flex-col min-h-full">
                    {timeSlots.map((slot) => (
                        <div key={slot} className="flex border-b border-gray-50 group min-h-[45px]">
                            <div className="w-20 py-2 px-4 text-[11px] font-black text-gray-400 border-r border-gray-50 bg-gray-50/20 flex items-start justify-center">
                                {slot.endsWith(':00') ? slot : ''}
                            </div>
                            <div className="flex-1 relative p-1 bg-white group-hover:bg-gray-50/30 transition-colors">
                                {dayAppointments
                                    .filter(a => {
                                        const date = new Date(a.startAt);
                                        const hour = date.getHours().toString().padStart(2, '0');
                                        const m = date.getMinutes();
                                        const min = m < 15 ? '00' : m < 30 ? '15' : m < 45 ? '30' : '45';
                                        return `${hour}:${min}` === slot;
                                    })
                                    .map(appt => (
                                        <div
                                            key={appt.id}
                                            onClick={() => handleOpenDetails(appt)}
                                            className="px-4 py-2 bg-primary/5 hover:bg-primary/10 border-l-4 border-primary rounded-xl cursor-pointer transition-all mb-1 relative group overflow-hidden shadow-sm"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-secondary">
                                                    {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-gray-200">|</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pet</span>
                                                    <span className="font-black text-secondary uppercase tracking-tight text-xs">{appt.pet.name}</span>
                                                </div>
                                                <span className="text-gray-200">|</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tutor(a)</span>
                                                    <span className="font-bold text-secondary text-xs">{appt.customer.name}</span>
                                                </div>
                                                <span className="ml-auto bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{appt.status}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return Array.from({ length: 7 }, (_, i) => {
            const dayOfweek = new Date(monday);
            dayOfweek.setDate(monday.getDate() + i);
            return dayOfweek;
        });
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays(selectedDate);
        return (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <div className="min-w-[1000px]">
                        <div className="flex border-b border-gray-100 bg-gray-50/50 sticky top-0 z-20">
                            <div className="w-20 border-r border-gray-100 bg-gray-50/50"></div>
                            {weekDays.map(d => (
                                <div key={d.toString()} className={`flex-1 p-3 text-center border-r border-gray-100 last:border-none ${isSameDay(d, new Date()) ? 'bg-primary/10' : ''}`}>
                                    <p className={`text-[10px] font-black uppercase ${isSameDay(d, new Date()) ? 'text-primary' : 'text-gray-400'}`}>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                    <p className={`text-lg font-black ${isSameDay(d, new Date()) ? 'text-primary' : 'text-secondary'}`}>{d.getDate()}</p>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot} className={`flex border-b border-gray-50 group min-h-[40px]`}>
                                <div className={`w-20 p-2 text-[10px] font-black border-r border-gray-100 flex items-start justify-center bg-gray-50/20 ${slot.endsWith(':00') ? 'text-gray-400' : 'text-transparent'}`}>
                                    {slot.endsWith(':00') ? slot : ''}
                                </div>
                                {weekDays.map(day => (
                                    <div key={day.toString()} className={`flex-1 border-r border-gray-50 last:border-none p-0.5 relative hover:bg-gray-50/30 transition-colors ${isSameDay(day, new Date()) ? 'bg-primary/[0.01]' : ''}`}>
                                        {filteredAppointments
                                            .filter(a => {
                                                const d = new Date(a.startAt);
                                                const hour = d.getHours().toString().padStart(2, '0');
                                                const m = d.getMinutes();
                                                const min = m < 15 ? '00' : m < 30 ? '15' : m < 45 ? '30' : '45';
                                                return isSameDay(d, day) && `${hour}:${min}` === slot;
                                            })
                                            .map(appt => (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => handleOpenDetails(appt)}
                                                    className="p-1 bg-primary/5 hover:bg-primary/10 border-l-2 border-primary rounded-lg cursor-pointer transition-all mb-0.5 shadow-sm group overflow-hidden"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                            <span className="text-[8px] font-black text-secondary truncate uppercase">{appt.pet.name}</span>
                                                            <span className="text-[7px] font-black text-primary shrink-0">
                                                                {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const renderMonthView = () => {
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const startDate = new Date(firstDayOfMonth);
        const day = startDate.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        startDate.setDate(firstDayOfMonth.getDate() + diff);

        const days = [];
        const current = new Date(startDate);
        while (days.length < 42) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const weekHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

        return (
            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-gray-100 bg-white">
                    <div className="p-3 border-r border-gray-50 flex items-center justify-center text-[10px] font-black text-gray-300">W</div>
                    {weekHeaders.map(wh => (
                        <div key={wh} className="p-3 text-center text-[11px] font-black text-gray-500 uppercase tracking-[0.15em] border-r border-gray-50 last:border-none">
                            {wh}
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    <div className="grid grid-cols-[50px_repeat(7,1fr)] h-full min-h-[800px]">
                        {days.map((day, idx) => {
                            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                            const isToday = isSameDay(day, new Date());
                            const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.startAt), day));
                            const weekNum = idx % 7 === 0 ? getWeekNumber(day) : null;

                            return (
                                <React.Fragment key={idx}>
                                    {weekNum !== null && (
                                        <div className="border-r border-b border-gray-100 flex flex-col items-center justify-start pt-4 bg-gray-50/20 text-[12px] font-black text-gray-300">
                                            {weekNum}
                                        </div>
                                    )}
                                    <div
                                        className={`min-h-[160px] p-2 border-r border-b border-gray-100 group transition-all relative
                                            ${!isCurrentMonth ? 'bg-gray-50/10' : 'bg-white'}
                                            ${isToday ? 'bg-blue-50/20' : ''}
                                        `}
                                    >
                                        <div className="flex justify-end mb-2">
                                            <span className={`text-[12px] font-black w-7 h-7 flex items-center justify-center rounded-full
                                                ${!isCurrentMonth ? 'text-gray-200' : 'text-secondary'}
                                                ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : ''}
                                            `}>
                                                {day.getDate()}
                                            </span>
                                        </div>

                                        <div className="space-y-[4px]">
                                            {dayAppts.slice(0, 10).map(appt => {
                                                const time = new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                                const prefix = appt.status === 'FINALIZADO' ? '(R)' : '(A)';
                                                const dotColor = appt.status === 'PENDENTE' ? 'bg-purple-500' :
                                                    appt.status === 'CONFIRMADO' ? 'bg-blue-500' :
                                                        appt.status === 'EM_ATENDIMENTO' ? 'bg-orange-500' : 'bg-green-500';

                                                return (
                                                    <div
                                                        key={appt.id}
                                                        onClick={() => handleOpenDetails(appt)}
                                                        className="flex items-center gap-2 group/item cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-all"
                                                    >
                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor} shadow-sm`} />
                                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                                                            <div className="truncate text-[10px] font-medium text-gray-600">
                                                                <span className="font-black text-gray-400 mr-1">{prefix}</span>
                                                                <span className="font-bold">Pet: <span className="font-black uppercase text-secondary">{appt.pet.name}</span></span>
                                                                <span className="mx-1 text-gray-300">|</span>
                                                                <span className="font-bold">Tutor: <span className="text-gray-500">{appt.customer.name}</span></span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-400 shrink-0 tabular-nums">
                                                                {time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {dayAppts.length > 10 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedDate(day);
                                                        setView('DAY');
                                                    }}
                                                    className="w-full mt-1 py-1 text-[9px] font-black text-primary/60 hover:text-primary uppercase flex items-center justify-center gap-1 hover:bg-primary/5 rounded-md transition-all border border-transparent hover:border-primary/20"
                                                >
                                                    Mostrar tudo {dayAppts.length}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8">
                {/* Modern Header - Adjusted to match image style */}
                <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-3">
                                <div className="h-[2px] w-6 bg-primary"></div>
                                CENTRAL DE AGENDAMENTOS
                            </div>
                            <h1 className="text-4xl font-black text-secondary tracking-tight capitalize">
                                {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h1>
                        </div>

                        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-100 mt-6 lg:mt-0">
                            <button
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                                className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="px-6 py-2 text-[11px] font-black text-secondary hover:text-primary uppercase tracking-[0.2em] transition-colors"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                                className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[28px] border border-white shadow-xl shadow-black/5">
                        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-[22px]">
                            {['KANBAN', 'DAY', 'WEEK', 'MONTH'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v as ViewType)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-[18px] text-[10px] font-black transition-all ${view === v ? 'bg-white text-primary shadow-lg shadow-black/10 scale-[1.02]' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    {v === 'KANBAN' ? <Layout size={14} /> : v === 'DAY' ? <List size={14} /> : <CalendarIcon size={14} />}
                                    <span className="hidden sm:inline uppercase tracking-[0.15em]">{v}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCreateNew}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-[22px] font-black shadow-xl shadow-primary/30 hover:shadow-primary/40 active:scale-95 transition-all text-[11px] tracking-[0.1em] flex items-center gap-3 uppercase"
                        >
                            <Plus size={18} strokeWidth={3} /> NOVO ITEM
                        </button>
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por pet, tutor ou serviço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-transparent border-2 rounded-[22px] pl-12 pr-6 py-3.5 text-sm shadow-sm focus:border-primary/20 focus:ring-0 w-[400px] transition-all"
                        />
                    </div>

                    <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-[22px] shadow-sm border border-gray-100">
                        <button
                            onClick={() => setIsTrashView(false)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black transition-all ${!isTrashView ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Layout size={16} /> ATIVOS
                        </button>
                        <button
                            onClick={() => setIsTrashView(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[10px] font-black transition-all ${isTrashView ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <Trash2 size={16} /> LIXEIRA
                        </button>
                    </div>

                    <button
                        onClick={fetchAppointments}
                        disabled={isLoading}
                        className="p-3.5 bg-white text-gray-400 rounded-[18px] border border-gray-100 shadow-sm hover:text-primary hover:border-primary/30 transition-all active:scale-90 disabled:opacity-50"
                        title="Atualizar Agenda"
                    >
                        <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {!isTrashView ? (
                    view === 'KANBAN' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statusColumns.map((col) => (
                                <div
                                    key={col.key}
                                    className="flex flex-col h-[calc(100vh-320px)]"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const apptId = e.dataTransfer.getData('apptId');
                                        if (apptId) {
                                            updateStatus(apptId, col.key);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-5 px-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${col.color} shadow-lg shadow-current/20`}></div>
                                            <h3 className="font-black text-secondary uppercase tracking-[0.2em] text-[11px]">{col.label}</h3>
                                        </div>
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-gray-200">
                                            {getColumnItems(col.key).length}
                                        </span>
                                    </div>

                                    <div className="flex-1 bg-gray-50/50 rounded-[40px] p-5 overflow-y-auto space-y-4 custom-scrollbar border border-dashed border-gray-200">
                                        <AnimatePresence mode="popLayout">
                                            {getColumnItems(col.key).map((appt) => (
                                                <motion.div
                                                    key={appt.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    onClick={() => handleOpenDetails(appt)}
                                                    draggable
                                                    onDragStart={(e) => {
                                                        // @ts-ignore
                                                        e.dataTransfer.setData('apptId', appt.id);
                                                    }}
                                                    className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 group hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-secondary border border-gray-100">
                                                            <Clock size={12} className="text-gray-400" />
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">#{appt.id.substring(0, 4)}</span>
                                                    </div>

                                                    <div className="space-y-1 mb-5">
                                                        <h4 className="font-black text-secondary text-sm group-hover:text-primary transition-colors truncate uppercase tracking-tight">
                                                            {appt.pet.name}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 font-bold truncate">
                                                            {appt.customer.name}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {col.key === 'PENDENTE' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'CONFIRMADO', e)}
                                                                className="flex-1 py-2.5 bg-blue-500 text-white rounded-[14px] text-[10px] font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                                            >
                                                                <CheckCircle size={14} /> OK
                                                            </button>
                                                        )}
                                                        {col.key === 'CONFIRMADO' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'EM_ATENDIMENTO', e)}
                                                                className="flex-1 py-2.5 bg-purple-600 text-white rounded-[14px] text-[10px] font-black flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                                                            >
                                                                <PlayCircle size={14} /> INICIAR
                                                            </button>
                                                        )}
                                                        {col.key === 'EM_ATENDIMENTO' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'FINALIZADO', e)}
                                                                className="flex-1 py-2.5 bg-green-500 text-white rounded-[14px] text-[10px] font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                                            >
                                                                <CheckCircle size={14} /> FIM
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {getColumnItems(col.key).length === 0 && !isLoading && (
                                            <div className="text-center py-20 opacity-20 select-none">
                                                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-5 flex items-center justify-center">
                                                    <List size={28} className="text-gray-400" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Vazio</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {view === 'DAY' && renderDayView()}
                            {view === 'WEEK' && renderWeekView()}
                            {view === 'MONTH' && renderMonthView()}
                        </div>
                    )
                ) : (
                    <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-50">
                            <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 shadow-xl shadow-red-500/5">
                                <Trash2 size={40} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-secondary tracking-tight">Lixeira de Agendamentos</h2>
                                <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-widest">Itens arquivados para auditoria</p>
                            </div>
                        </div>

                        {trashAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-300">
                                <Trash2 size={80} className="mb-6 opacity-30" />
                                <p className="font-black text-xs uppercase tracking-[0.4em]">Nenhum item na lixeira</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {trashAppointments.map(appt => (
                                    <div key={appt.id} className="border border-gray-100 p-8 rounded-[36px] bg-gray-50 hover:bg-white hover:shadow-2xl hover:border-red-100 transition-all relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="text-[9px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                                                EXCLUÍDO EM {appt.deletedAt ? new Date(appt.deletedAt).toLocaleDateString() : '-'}
                                            </div>
                                        </div>

                                        <h4 className="font-black text-secondary text-lg mb-2 uppercase tracking-tight">
                                            {appt.pet.name}
                                        </h4>
                                        <p className="text-sm text-gray-400 font-bold mb-6 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                            {appt.customer.name}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs font-black text-gray-500 mb-8 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                                            <CalendarIcon size={16} className="text-primary" />
                                            {new Date(appt.startAt).toLocaleDateString()} às {new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleRestore(appt.id)}
                                                className="flex-1 py-4 bg-green-500 text-white rounded-[20px] text-[11px] font-black hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <RefreshCcw size={18} /> RESTAURAR
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(appt.id)}
                                                className="w-16 h-14 bg-red-50 text-red-500 rounded-[20px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90"
                                                title="Excluir Permanentemente"
                                            >
                                                <XCircle size={22} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {isFormOpen && (
                    <AppointmentFormModal
                        isOpen={isFormOpen}
                        onClose={() => { setIsFormOpen(false); setPreFillData(null); }}
                        onSuccess={fetchAppointments}
                        appointment={selectedAppointment}
                        isCopy={isCopying}
                        preFill={preFillData}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDetailsOpen && (
                    <AppointmentDetailsModal
                        isOpen={isDetailsOpen}
                        onClose={() => setIsDetailsOpen(false)}
                        onSuccess={fetchAppointments}
                        appointment={selectedAppointment}
                        onModify={handleModify}
                        onCopy={handleCopy}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
