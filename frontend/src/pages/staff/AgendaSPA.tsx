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
            const response = await api.get('/appointments?category=SPA');
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
                            <div className="flex-1 relative p-1 bg-white group-hover:bg-primary/5 transition-colors">
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
                <div className="grid grid-cols-8 border-b border-gray-100 bg-gray-50/50">
                    <div className="p-4 border-r border-gray-100"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={`p-4 text-center border-r border-gray-100 last:border-none ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                            <p className={`text-xl font-black ${isSameDay(day, new Date()) ? 'text-primary' : 'text-secondary'}`}>{day.getDate()}</p>
                        </div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {timeSlots.map(slot => (
                        <div key={slot} className="grid grid-cols-8 border-b border-gray-50 group min-h-[45px]">
                            <div className="py-2 px-4 text-[10px] font-black text-gray-300 border-r border-gray-50 bg-gray-50/10 flex items-start justify-center">
                                {slot.endsWith(':00') ? slot : ''}
                            </div>
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className={`border-r border-gray-50 last:border-none p-1 relative min-h-[45px] group-hover:bg-gray-50/30 transition-colors ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                                    {filteredAppointments
                                        .filter(a => {
                                            const aDate = new Date(a.startAt);
                                            const hour = aDate.getHours().toString().padStart(2, '0');
                                            const m = aDate.getMinutes();
                                            const min = m < 15 ? '00' : m < 30 ? '15' : m < 45 ? '30' : '45';
                                            return isSameDay(aDate, day) && `${hour}:${min}` === slot;
                                        })
                                        .map(appt => (
                                            <div
                                                key={appt.id}
                                                onClick={() => handleOpenDetails(appt)}
                                                className="p-2 bg-primary text-white rounded-xl cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all mb-1"
                                            >
                                                <p className="text-[9px] font-black uppercase truncate">{appt.pet.name}</p>
                                                <p className="text-[8px] opacity-80 truncate">{appt.customer.name}</p>
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    ))}
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
                                            ${isToday ? 'bg-primary/5' : ''}
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
                                            {dayAppts.slice(0, 5).map(appt => {
                                                const time = new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                                                            <span className="truncate text-[10px] font-bold text-secondary uppercase shrink-0">{appt.pet.name}</span>
                                                            <span className="text-[10px] font-black text-gray-400 shrink-0 tabular-nums">
                                                                {time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {dayAppts.length > 5 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedDate(day);
                                                        setView('DAY');
                                                    }}
                                                    className="w-full mt-1 py-1 text-[9px] font-black text-primary/60 hover:text-primary uppercase flex items-center justify-center gap-1 hover:bg-primary/5 rounded-md transition-all"
                                                >
                                                    + {dayAppts.length - 5} mais
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
                            <button onClick={prevDay} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={setToday} className="px-6 py-2 text-[11px] font-black text-secondary hover:text-primary uppercase tracking-[0.2em] transition-colors">
                                Hoje
                            </button>
                            <button onClick={nextDay} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary">
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
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-[22px] font-black shadow-xl shadow-primary/30 transition-all text-[11px] tracking-[0.1em] flex items-center gap-3 uppercase"
                        >
                            <Plus size={18} strokeWidth={3} /> NOVO ITEM
                        </button>
                    </div>
                </header>

                <div className="relative mb-8">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por tutor, pet ou serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-[32px] pl-16 pr-8 py-5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-40">
                        <RefreshCcw className="animate-spin text-primary" size={48} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {view === 'KANBAN' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {statusColumns.map((col) => (
                                    <div key={col.key} className="flex flex-col h-[calc(100vh-320px)]">
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
                                            {getColumnItems(col.key).map((appt) => (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => handleOpenDetails(appt)}
                                                    className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 group hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-secondary border border-gray-100">
                                                            <Clock size={12} className="text-gray-400" />
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-black text-secondary text-sm group-hover:text-primary transition-colors truncate uppercase">{appt.pet.name}</h4>
                                                    <p className="text-[11px] text-gray-400 font-bold truncate">{appt.customer.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {view === 'DAY' && renderDayView()}
                                {view === 'WEEK' && renderWeekView()}
                                {view === 'MONTH' && renderMonthView()}
                            </>
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
