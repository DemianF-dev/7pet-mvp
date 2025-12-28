import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Clock,
    PlayCircle,
    CheckCircle,
    Plus,
    Calendar as CalendarIcon,
    Layout,
    List,
    ChevronLeft,
    ChevronRight,
    Search,
    Trash2,
    RefreshCcw,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import BackButton from '../../components/BackButton';

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
    const [view, setView] = useState<ViewType>('WEEK');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [isTrashView, setIsTrashView] = useState(false);
    const [trashAppointments, setTrashAppointments] = useState<Appointment[]>([]);
    const [preFillData, setPreFillData] = useState<any>(null);
    const [columnFilters, setColumnFilters] = useState({
        pet: '',
        customer: '',
        service: '',
        time: ''
    });

    useEffect(() => {
        if (location.state?.prefill) {
            setPreFillData(location.state.prefill);
            setIsFormOpen(true);
            // Clear state to avoid reopening on refresh
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
        // Direct state update ensures consistency
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

        const matchesPet = !columnFilters.pet || a.pet.name.toLowerCase().includes(columnFilters.pet.toLowerCase());
        const matchesCustomer = !columnFilters.customer || a.customer.name.toLowerCase().includes(columnFilters.customer.toLowerCase());
        const matchesService = !columnFilters.service ||
            (a.services && a.services.some(s => s.name.toLowerCase().includes(columnFilters.service.toLowerCase()))) ||
            (a.service && a.service.name.toLowerCase().includes(columnFilters.service.toLowerCase()));

        const apptTime = new Date(a.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const matchesTime = !columnFilters.time || apptTime.includes(columnFilters.time);

        return matchesGlobal && matchesPet && matchesCustomer && matchesService && matchesTime;
    });

    const getColumnItems = (status: string) => filteredAppointments.filter(a => a.status === status);

    const timeSlots: string[] = [];
    for (let i = 9; i <= 18; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    timeSlots.push('19:00');

    const nextDay = () => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
    const prevDay = () => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000));
    const setToday = () => setSelectedDate(new Date());

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const dayAppointments = appointments.filter(a => isSameDay(new Date(a.startAt), selectedDate));

    const renderDayView = () => (
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                    <button onClick={prevDay} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                        <ChevronLeft size={20} className="text-gray-400" />
                    </button>
                    <h2 className="text-xl font-black text-secondary uppercase tracking-tight">
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </h2>
                    <button onClick={nextDay} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                        <ChevronRight size={20} className="text-gray-400" />
                    </button>
                    <button onClick={setToday} className="text-xs font-bold text-primary hover:underline ml-2">Hoje</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="flex flex-col min-h-full">
                    {timeSlots.map((slot) => (
                        <div key={slot} className="flex border-b border-gray-50 group min-h-[80px]">
                            <div className="w-20 py-4 px-4 text-[10px] font-black text-gray-400 border-r border-gray-50 bg-gray-50/30 flex items-start justify-center">
                                {slot}
                            </div>
                            <div className="flex-1 relative p-2 bg-white group-hover:bg-gray-50/50 transition-colors">
                                {dayAppointments
                                    .filter(a => {
                                        const date = new Date(a.startAt);
                                        const hour = date.getHours().toString().padStart(2, '0');
                                        const min = date.getMinutes() < 30 ? '00' : '30';
                                        return `${hour}:${min}` === slot;
                                    })
                                    .map(appt => (
                                        <div
                                            key={appt.id}
                                            onClick={() => handleOpenDetails(appt)}
                                            className="mb-2 p-3 bg-primary/10 border-l-4 border-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-black text-primary uppercase">
                                                    {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${appt.status === 'FINALIZADO' ? 'bg-green-100 text-green-600' : 'bg-primary/20 text-primary'}`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                            <p className="font-bold text-secondary text-xs truncate">
                                                {appt.services && appt.services.length > 0
                                                    ? appt.services.map(s => s.name).join(', ')
                                                    : appt.service?.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{appt.pet.name} • {appt.customer.name}</p>
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
        // Adjust to Monday (1). In JS, Sunday is 0.
        // If it's Sunday (0), we go back 6 days to Monday.
        // Otherwise, move back to (day - 1) days.
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
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                            <ChevronLeft size={20} className="text-gray-400" />
                        </button>
                        <h2 className="text-xl font-black text-secondary uppercase tracking-tight">
                            Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </h2>
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar relative">
                    <div className="min-w-[1000px]">
                        <div className="flex border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                            <div className="w-20 border-r border-gray-100"></div>
                            {weekDays.map(d => (
                                <div key={d.toString()} className={`flex-1 p-3 text-center border-r border-gray-100 last:border-none ${isSameDay(d, new Date()) ? 'bg-primary/10 ring-1 ring-inset ring-primary/20' : ''}`}>
                                    <p className={`text-[10px] font-black uppercase ${isSameDay(d, new Date()) ? 'text-primary' : 'text-gray-400'}`}>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                    <p className={`text-lg font-black ${isSameDay(d, new Date()) ? 'text-primary' : 'text-secondary'}`}>{d.getDate()}</p>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot} className={`flex border-b border-gray-50 group ${slot.endsWith(':00') ? 'min-h-[70px]' : 'min-h-[60px]'}`}>
                                <div className={`w-20 p-3 text-[10px] font-black border-r border-gray-100 flex items-start justify-center ${slot.endsWith(':00') ? 'text-gray-400 bg-gray-50/30' : 'text-gray-300 bg-gray-50/10'}`}>
                                    {slot}
                                </div>
                                {weekDays.map(day => (
                                    <div key={day.toString()} className={`flex-1 border-r border-gray-50 last:border-none p-1 relative hover:bg-gray-50/50 transition-colors ${isSameDay(day, new Date()) ? 'bg-primary/[0.02]' : ''}`}>
                                        {appointments
                                            .filter(a => {
                                                const d = new Date(a.startAt);
                                                const hour = d.getHours().toString().padStart(2, '0');
                                                const min = d.getMinutes() < 30 ? '00' : '30';
                                                return isSameDay(d, day) && `${hour}:${min}` === slot;
                                            })
                                            .map(appt => (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => handleOpenDetails(appt)}
                                                    className="p-1 px-2 bg-primary/10 border-l-2 border-primary rounded-lg cursor-pointer hover:bg-primary/20 transition-all text-left mb-1 shadow-sm"
                                                >
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <p className="text-[8px] font-black text-primary">
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <span className="text-[7px] font-black text-gray-400 capitalize">{appt.status.toLowerCase()}</span>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-secondary leading-tight line-clamp-1">
                                                        {appt.pet.name} • {appt.customer.name}
                                                    </p>
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

    const renderMonthView = () => {
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

        const days = [];
        const current = new Date(startDate);
        while (current <= lastDayOfMonth || days.length % 7 !== 0) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        return (
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                            <ChevronLeft size={20} className="text-gray-400" />
                        </button>
                        <h2 className="text-xl font-black text-secondary uppercase tracking-tight">
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button onClick={setToday} className="text-xs font-bold text-primary hover:underline ml-2">Hoje</button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                        {weekDays.map(wd => (
                            <div key={wd} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase border-r border-gray-100 last:border-none">
                                {wd}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 flex-1 min-h-[600px]">
                        {days.map((day, idx) => {
                            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                            const dayAppts = appointments.filter(a => isSameDay(new Date(a.startAt), day));

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[120px] p-2 border-r border-b border-gray-50 group hover:bg-gray-50/50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/20 opacity-40' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/[0.02]' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[11px] font-black rounded-full w-6 h-6 flex items-center justify-center ${isSameDay(day, new Date()) ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-secondary opacity-60'}`}>
                                            {day.getDate()}
                                        </span>
                                        {dayAppts.length > 0 && (
                                            <span className="bg-gray-100 text-[8px] font-black text-gray-400 px-1.5 py-0.5 rounded-full">
                                                {dayAppts.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        {dayAppts.slice(0, 3).map(appt => (
                                            <div
                                                key={appt.id}
                                                onClick={() => handleOpenDetails(appt)}
                                                className="p-1 px-2 bg-primary/10 border-l-2 border-primary rounded text-[9px] font-bold text-secondary truncate cursor-pointer hover:bg-primary/20 transition-all"
                                            >
                                                {new Date(appt.startAt).getHours()}:{new Date(appt.startAt).getMinutes().toString().padStart(2, '0')} {appt.pet.name}
                                            </div>
                                        ))}
                                        {dayAppts.length > 3 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDate(day);
                                                    setView('DAY');
                                                }}
                                                className="w-full text-[8px] font-black text-primary uppercase hover:underline text-left pl-2"
                                            >
                                                + {dayAppts.length - 3} mais
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                <header className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <BackButton className="ml-[-0.5rem]" />
                        <div>
                            <h1 className="text-4xl font-extrabold text-secondary">Agenda <span className="text-purple-600 underline decoration-wavy decoration-2 underline-offset-8">SPA</span></h1>
                            <p className="text-gray-400 text-xs font-medium">Fluxo operacional e atendimentos.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-6">
                        <div className="flex-1 min-w-[150px]">
                            <input
                                type="text"
                                placeholder="Filtrar por Pet..."
                                value={columnFilters.pet}
                                onChange={(e) => setColumnFilters({ ...columnFilters, pet: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <input
                                type="text"
                                placeholder="Filtrar por Tutor..."
                                value={columnFilters.customer}
                                onChange={(e) => setColumnFilters({ ...columnFilters, customer: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <input
                                type="text"
                                placeholder="Filtrar por Serviço..."
                                value={columnFilters.service}
                                onChange={(e) => setColumnFilters({ ...columnFilters, service: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                            <input
                                type="text"
                                placeholder="Filtrar por Hora (HH:MM)..."
                                value={columnFilters.time}
                                onChange={(e) => setColumnFilters({ ...columnFilters, time: e.target.value })}
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <button
                            onClick={() => setColumnFilters({ pet: '', customer: '', service: '', time: '' })}
                            className="text-[10px] font-black text-primary hover:text-secondary uppercase px-2"
                        >
                            Limpar
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search in Agenda */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filtrar agenda..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border-none rounded-2xl pl-12 pr-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-64"
                            />
                        </div>

                        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setIsTrashView(false)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isTrashView ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-secondary'}`}
                            >
                                <Layout size={16} /> Agenda
                            </button>
                            <button
                                onClick={() => setIsTrashView(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isTrashView ? 'bg-red-50 text-red-500 shadow-sm' : 'text-gray-400 hover:text-red-400'}`}
                            >
                                <Trash2 size={16} /> Lixeira
                            </button>
                        </div>

                        {/* View Selector (only in active view) */}
                        {!isTrashView && (
                            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1">
                                {['KANBAN', 'DAY', 'WEEK', 'MONTH'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v as ViewType)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === v ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-secondary'}`}
                                    >
                                        {v === 'KANBAN' ? <Layout size={16} /> : v === 'DAY' ? <List size={16} /> : <CalendarIcon size={16} />}
                                        <span className="hidden sm:inline">{v.charAt(0) + v.slice(1).toLowerCase()}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={fetchAppointments}
                            disabled={isLoading}
                            className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 shadow-sm hover:text-primary hover:border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                            title="Atualizar Agenda"
                        >
                            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={handleCreateNew}
                            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center gap-2"
                        >
                            <Plus size={16} /> Novo Agendamento
                        </button>
                    </div>
                </header>

                {view === 'KANBAN' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statusColumns.map((col) => (
                            <div
                                key={col.key}
                                className="flex flex-col h-[calc(100vh-280px)]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const apptId = e.dataTransfer.getData('apptId');
                                    if (apptId) {
                                        updateStatus(apptId, col.key);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${col.color} shadow-sm`}></div>
                                        <h3 className="font-black text-secondary uppercase tracking-widest text-[11px]">{col.label}</h3>
                                    </div>
                                    <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full">
                                        {getColumnItems(col.key).length}
                                    </span>
                                </div>

                                <div className="flex-1 bg-gray-100/50 rounded-[32px] p-4 overflow-y-auto space-y-3 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {getColumnItems(col.key).map((appt) => (
                                            <motion.div
                                                key={appt.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                onClick={() => handleOpenDetails(appt)}
                                                draggable
                                                onDragStart={(e) => {
                                                    // @ts-ignore
                                                    e.dataTransfer.setData('apptId', appt.id);
                                                }}
                                                className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100 group hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="bg-primary/5 px-2 py-1 rounded-lg flex items-center gap-1 text-[9px] font-black text-primary border border-primary/10">
                                                        <Clock size={10} />
                                                        {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">#{appt.id.substring(0, 4)}</span>
                                                </div>

                                                <div className="space-y-0.5 mb-3">
                                                    <h4 className="font-black text-secondary text-xs group-hover:text-primary transition-colors truncate">
                                                        {appt.pet.name}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate">
                                                        {appt.customer.name}
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    {col.key === 'PENDENTE' && (
                                                        <button
                                                            onClick={(e) => updateStatus(appt.id, 'CONFIRMADO', e)}
                                                            className="flex-1 py-2 bg-purple-500 text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-purple-600 transition-all shadow-md shadow-purple-500/10"
                                                        >
                                                            <CheckCircle size={12} /> OK
                                                        </button>
                                                    )}
                                                    {col.key === 'CONFIRMADO' && (
                                                        <button
                                                            onClick={(e) => updateStatus(appt.id, 'EM_ATENDIMENTO', e)}
                                                            className="flex-1 py-2 bg-secondary text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-primary transition-all shadow-md shadow-secondary/10"
                                                        >
                                                            <PlayCircle size={12} /> INICIAR
                                                        </button>
                                                    )}
                                                    {col.key === 'EM_ATENDIMENTO' && (
                                                        <button
                                                            onClick={(e) => updateStatus(appt.id, 'FINALIZADO', e)}
                                                            className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-green-600 transition-all shadow-md shadow-green-500/10"
                                                        >
                                                            <CheckCircle size={12} /> FIM
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {getColumnItems(col.key).length === 0 && !isLoading && (
                                        <div className="text-center py-16 opacity-30 select-none">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <List size={20} className="text-gray-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Lista Vazia</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : view === 'DAY' ? (
                    renderDayView()
                ) : view === 'WEEK' ? (
                    renderWeekView()
                ) : (
                    renderMonthView()
                )}

                {isTrashView && (
                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 min-h-[500px]">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                                <Trash2 size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-secondary">Lixeira de Agendamentos</h2>
                                <p className="text-gray-400 text-sm">Itens excluídos nos últimos 15 dias.</p>
                            </div>
                        </div>

                        {trashAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                                <Trash2 size={64} className="mb-4 opacity-50" />
                                <p className="font-bold">Lixeira Vazia</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trashAppointments.map(appt => (
                                    <div key={appt.id} className="border border-gray-100 p-6 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all relative group">
                                        <div className="absolute top-4 right-4 text-[10px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">
                                            Excluído em {appt.deletedAt ? new Date(appt.deletedAt).toLocaleDateString() : '-'}
                                        </div>

                                        <h4 className="font-bold text-secondary mb-1">
                                            {appt.services && appt.services.length > 0
                                                ? appt.services.map(s => s.name).join(', ')
                                                : appt.service?.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-4">{appt.customer.name} - {appt.pet.name}</p>

                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                                            <CalendarIcon size={14} />
                                            {new Date(appt.startAt).toLocaleDateString()} às {new Date(appt.startAt).toLocaleTimeString()}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRestore(appt.id)}
                                                className="flex-1 py-3 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCcw size={16} /> Restaurar
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(appt.id)}
                                                className="px-4 py-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors"
                                                title="Excluir Permanentemente"
                                            >
                                                <XCircle size={20} />
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
