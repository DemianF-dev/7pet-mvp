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
import api from '../../services/api';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import BackButton from '../../components/BackButton';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customerId: string;
    customer: { name: string; phone?: string; user: { email: string }; type: string };
    petId: string;
    pet: { name: string; species: string; breed: string };
    seqId?: number;
    serviceId?: string; // Legacy
    services?: { id: string; name: string; basePrice: number; duration: number }[];
    service?: { name: string; basePrice: number; duration: number }; // Legacy
    transport?: any;
    transportLegs?: any[];
    transportSnapshot?: any;
    category?: string;
    deletedAt?: string;
}

type ViewType = 'KANBAN' | 'DAY' | 'WEEK' | 'MONTH';

const statusColumns = [
    { key: 'PENDENTE', label: 'Solicitados', color: 'bg-purple-500' },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-blue-500' },
    { key: 'EM_ATENDIMENTO', label: 'Em Atendimento', color: 'bg-orange-500' },
    { key: 'FINALIZADO', label: 'Finalizado', color: 'bg-green-500' }
];

import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileKanban } from './kanban/MobileKanban';

export default function ServiceKanban() {
    const { isMobile } = useIsMobile();

    if (isMobile) {
        return <MobileKanban />;
    }

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
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setAppointments(data);
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

    const handleBulkPermanentDelete = async () => {
        if (trashAppointments.length === 0) return;
        if (!window.confirm(`ATENÇÃO: Você está prestes a excluir PERMANENTEMENTE ${trashAppointments.length} agendamentos. Esta ação não pode ser desfeita. Deseja continuar?`)) return;

        try {
            const ids = trashAppointments.map(a => a.id);
            await api.post('/appointments/bulk-permanent', { ids });
            fetchTrash();
            alert('Lixeira esvaziada com sucesso!');
        } catch (err) {
            console.error('Erro ao esvaziar lixeira:', err);
            alert('Erro ao esvaziar a lixeira');
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
        const matchesGlobal = (a.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.pet?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.services && a.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
            (a.service && a.service.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesPet = !columnFilters.pet || (a.pet?.name || '').toLowerCase().includes(columnFilters.pet.toLowerCase());
        const matchesCustomer = !columnFilters.customer || (a.customer?.name || '').toLowerCase().includes(columnFilters.customer.toLowerCase());
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                    <button onClick={prevDay} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-200">
                        <ChevronLeft size={18} className="text-gray-400" />
                    </button>
                    <h2 className="text-lg font-bold text-secondary uppercase tracking-tight">
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </h2>
                    <button onClick={nextDay} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-200">
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button onClick={setToday} className="text-[11px] font-bold text-primary hover:underline ml-2 uppercase tracking-wide">Hoje</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                <div className="flex flex-col min-h-full">
                    {timeSlots.map((slot) => (
                        <div key={slot} className="flex border-b border-gray-50 group min-h-[70px]">
                            <div className="w-16 py-4 px-2 text-[10px] font-bold text-gray-400 border-r border-gray-100 bg-gray-50/30 flex items-start justify-center">
                                {slot}
                            </div>
                            <div className="flex-1 relative p-2 bg-white group-hover:bg-zinc-50/30 transition-colors">
                                {dayAppointments
                                    .filter(a => {
                                        const date = new Date(a.startAt);
                                        const hour = date.getHours().toString().padStart(2, '0');
                                        const min = date.getMinutes() < 30 ? '00' : '30';
                                        return `${hour}:${min}` === slot;
                                    })
                                    .map(appt => {
                                        const isCat = appt.pet?.species?.toUpperCase().includes('GATO');
                                        const isRecurring = appt.customer?.type === 'RECORRENTE';

                                        return (
                                            <div
                                                key={appt.id}
                                                onClick={() => handleOpenDetails(appt)}
                                                className={`mb-3 p-4 rounded-xl cursor-pointer transition-all shadow-sm border border-black/5 hover:border-current/30 hover:shadow-md active:scale-[0.99] border-l-[6px] ${isCat
                                                    ? 'bg-rose-50/50 border-l-rose-500 text-rose-900 hover:bg-rose-50'
                                                    : 'bg-indigo-50/50 border-l-indigo-500 text-indigo-900 hover:bg-indigo-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-bold uppercase tracking-tight opacity-50`}>
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <h4 className="font-bold text-base leading-tight tracking-tight mt-0.5">
                                                            {appt.pet?.name || 'Pet'} {isRecurring ? '(R)' : '(A)'}
                                                        </h4>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-white/60 border border-black/5`}>
                                                        {appt.status}
                                                    </span>
                                                </div>

                                                <div className="mt-2 space-y-2">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(appt.services || (appt.service ? [appt.service] : [])).map((s: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-white/40 rounded-lg border border-current/5 uppercase whitespace-nowrap">
                                                                <span>{s.name}</span>
                                                                <span className="opacity-40 text-[9px]">R$ {Number(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                        {appt.transportLegs?.map((l: any, idx: number) => (
                                                            <div key={`leg-${idx}`} className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-white/40 rounded-lg border border-current/5 uppercase whitespace-nowrap">
                                                                <span>{l.legType}</span>
                                                                <span className="opacity-40 text-[9px]">R$ {Number(l.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        ))}
                                                        {(!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) && (
                                                            <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-white/40 rounded-lg border border-current/5 uppercase whitespace-nowrap">
                                                                <span>Transporte</span>
                                                                <span className="opacity-40 text-[9px]">R$ {Number(appt.transportSnapshot.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center bg-white/20 px-3 py-1.5 rounded-xl">
                                                        <p className="text-[12px] opacity-60 font-bold uppercase tracking-widest truncate">
                                                            {appt.customer?.name}
                                                        </p>
                                                        <span className="text-[13px] font-bold tabular-nums">
                                                            R$ {(
                                                                (appt.services || (appt.service ? [appt.service] : [])).reduce((acc: number, s: any) => acc + Number(s.basePrice || 0), 0) +
                                                                (appt.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                                                                ((!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) ? Number(appt.transportSnapshot.totalAmount || 0) : 0)
                                                            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                        <h2 className="text-xl font-bold text-secondary uppercase tracking-tight">
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
                                    <p className={`text-[10px] font-bold uppercase ${isSameDay(d, new Date()) ? 'text-primary' : 'text-gray-400'}`}>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                    <p className={`text-lg font-bold ${isSameDay(d, new Date()) ? 'text-primary' : 'text-secondary'}`}>{d.getDate()}</p>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot} className={`flex border-b border-gray-50 group ${slot.endsWith(':00') ? 'min-h-[70px]' : 'min-h-[60px]'}`}>
                                <div className={`w-20 p-3 text-[10px] font-bold border-r border-gray-100 flex items-start justify-center ${slot.endsWith(':00') ? 'text-gray-400 bg-gray-50/30' : 'text-gray-300 bg-gray-50/10'}`}>
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
                                            .map(appt => {
                                                const isCat = appt.pet?.species?.toUpperCase().includes('GATO');
                                                const isRecurring = appt.customer?.type === 'RECORRENTE';

                                                return (
                                                    <div
                                                        key={appt.id}
                                                        onClick={() => handleOpenDetails(appt)}
                                                        className={`p-2.5 rounded-xl cursor-pointer transition-all text-left mb-2 shadow-sm border border-black/5 hover:border-current/30 hover:z-20 active:scale-[0.99] border-l-[4px] ${isCat
                                                            ? "bg-rose-50/50 border-l-rose-500 text-rose-900 hover:bg-rose-50"
                                                            : "bg-indigo-50/50 border-l-indigo-500 text-indigo-900 hover:bg-indigo-50"
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <p className={`text-[10px] font-bold tracking-widest uppercase opacity-60`}>
                                                                {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/50 border border-current/10 uppercase tracking-tighter shadow-sm">{appt.status.substring(0, 3)}</span>
                                                        </div>
                                                        <p className="text-[13px] font-bold leading-none truncate uppercase tracking-tight mb-1">
                                                            {appt.pet?.name || 'Pet'}
                                                        </p>
                                                        <div className="space-y-0.5">
                                                            {(appt.services || (appt.service ? [appt.service] : [])).slice(0, 1).map((s: any, idx: number) => (
                                                                <p key={idx} className="text-[9px] font-bold opacity-70 uppercase truncate">
                                                                    {s.name} (R$ {Number(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })})
                                                                </p>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1 border-t border-current/5 pt-1">
                                                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                                                                AG-{String(appt.seqId || 0).padStart(4, '0')}
                                                            </p>
                                                            <p className="text-[11px] font-bold tabular-nums">
                                                                R$ {(
                                                                    (appt.services || (appt.service ? [appt.service] : [])).reduce((acc: number, s: any) => acc + Number(s.basePrice || 0), 0) +
                                                                    (appt.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                                                                    ((!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) ? Number(appt.transportSnapshot.totalAmount || 0) : 0)
                                                                ).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-200">
                            <ChevronLeft size={18} className="text-gray-400" />
                        </button>
                        <h2 className="text-lg font-bold text-secondary uppercase tracking-tight">
                            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-200">
                            <ChevronRight size={18} className="text-gray-400" />
                        </button>
                        <button onClick={setToday} className="text-[11px] font-bold text-primary uppercase tracking-wide hover:underline ml-2">Hoje</button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                        {weekDays.map(wd => (
                            <div key={wd} className="p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-100 last:border-none">
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
                                    className={`min-h-[140px] p-2 border-r border-b border-gray-50 group hover:bg-gray-50/50 transition-colors ${!isCurrentMonth ? 'bg-gray-50/20 opacity-40' : ''} ${isSameDay(day, new Date()) ? 'bg-primary/[0.05]' : 'bg-white'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-[12px] font-bold rounded-full w-7 h-7 flex items-center justify-center transition-all ${isSameDay(day, new Date()) ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'text-secondary/60'}`}>
                                            {day.getDate()}
                                        </span>
                                        {dayAppts.length > 0 && (
                                            <span className="bg-secondary text-[9px] font-bold text-white px-2 py-0.5 rounded-lg shadow-sm">
                                                {dayAppts.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {dayAppts.slice(0, 4).map(appt => {
                                            const isCat = appt.pet.species?.toUpperCase().includes('GATO');

                                            return (
                                                <div
                                                    key={appt.id}
                                                    onClick={() => handleOpenDetails(appt)}
                                                    className={`p-1.5 px-2.5 rounded-xl text-[10px] font-bold truncate cursor-pointer transition-all border-l-[4px] shadow-sm uppercase tracking-tight ${isCat
                                                        ? "bg-pink-50 border-pink-400 text-pink-700 hover:bg-pink-100 hover:scale-[1.02]"
                                                        : "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100 hover:scale-[1.02]"
                                                        }`}
                                                >
                                                    <span className="opacity-50 mr-1">{new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                                                        <span className="truncate">{appt.pet?.name || 'Pet'}</span>
                                                        <span className="text-[9px] font-bold opacity-50 shrink-0">
                                                            R${(
                                                                (appt.services || (appt.service ? [appt.service] : [])).reduce((acc: number, s: any) => acc + Number(s.basePrice || 0), 0) +
                                                                (appt.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                                                                ((!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) ? Number(appt.transportSnapshot.totalAmount || 0) : 0)
                                                            ).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {dayAppts.length > 4 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedDate(day);
                                                    setView('DAY');
                                                }}
                                                className="w-full text-[9px] font-bold text-primary uppercase tracking-widest hover:underline text-left pl-2 pt-1"
                                            >
                                                + {dayAppts.length - 4} atendimentos
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
        <>
            <main className="p-4 md:p-8">
                <header className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-primary/10 rounded-[28px] flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                <CalendarIcon size={32} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-secondary tracking-tighter uppercase leading-none mb-1">
                                    Agenda de <span className="text-primary">Serviços</span>
                                </h1>
                                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">Fluxo Operacional • Gestão de Atendimentos</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search in Agenda */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar pet, tutor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white border-2 border-gray-100 rounded-[24px] pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/20 w-72 transition-all outline-none"
                                />
                            </div>

                            <div className="flex bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-[24px] border border-gray-100">
                                <button
                                    onClick={() => setIsTrashView(false)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[11px] font-bold uppercase tracking-widest transition-all ${!isTrashView ? 'bg-white text-primary shadow-md' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    <Layout size={16} /> Fluxo
                                </button>
                                <button
                                    onClick={() => setIsTrashView(true)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-[18px] text-[11px] font-bold uppercase tracking-widest transition-all ${isTrashView ? 'bg-red-50 text-red-500 shadow-md' : 'text-gray-400 hover:text-red-400'}`}
                                >
                                    <Trash2 size={16} /> Lixeira
                                </button>
                            </div>
                        </div>
                    </div>

                    {!isTrashView && (
                        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 bg-gray-50/50 p-6 rounded-[40px] border border-gray-100 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-4 flex-1 gap-4">
                                <div className="relative">
                                    <span className="absolute -top-2.5 left-4 px-2 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pet</span>
                                    <input
                                        type="text"
                                        placeholder="Nome do Pet"
                                        value={columnFilters.pet}
                                        onChange={(e) => setColumnFilters({ ...columnFilters, pet: e.target.value })}
                                        className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute -top-2.5 left-4 px-2 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tutor</span>
                                    <input
                                        type="text"
                                        placeholder="Nome do Cliente"
                                        value={columnFilters.customer}
                                        onChange={(e) => setColumnFilters({ ...columnFilters, customer: e.target.value })}
                                        className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute -top-2.5 left-4 px-2 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Serviço</span>
                                    <input
                                        type="text"
                                        placeholder="Tipo de Atendimento"
                                        value={columnFilters.service}
                                        onChange={(e) => setColumnFilters({ ...columnFilters, service: e.target.value })}
                                        className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute -top-2.5 left-4 px-2 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Horário</span>
                                    <input
                                        type="text"
                                        placeholder="Horário"
                                        value={columnFilters.time}
                                        onChange={(e) => setColumnFilters({ ...columnFilters, time: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 h-12">
                                <button
                                    onClick={() => setColumnFilters({ pet: '', customer: '', service: '', time: '' })}
                                    className="p-3 bg-white text-gray-400 hover:text-primary rounded-2xl border-2 border-gray-100 transition-all shadow-sm active:scale-95"
                                    title="Limpar Filtros"
                                >
                                    <RefreshCcw size={18} />
                                </button>

                                <div className="flex bg-white border-2 border-gray-100 p-1 rounded-2xl shadow-sm">
                                    {['KANBAN', 'DAY', 'WEEK', 'MONTH'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setView(v as ViewType)}
                                            className={`p-2.5 rounded-xl transition-all ${view === v ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-primary'}`}
                                            title={v}
                                        >
                                            {v === 'KANBAN' ? <Layout size={18} /> : v === 'DAY' ? <List size={18} /> : <CalendarIcon size={18} />}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCreateNew}
                                    className="bg-primary text-white px-8 h-[48px] rounded-xl font-bold uppercase tracking-tight shadow-lg shadow-primary/25 hover:brightness-105 active:scale-95 transition-all text-sm flex items-center gap-3"
                                >
                                    <Plus size={18} strokeWidth={2.5} /> <span className="hidden lg:inline">Novo Agendamento</span>
                                </button>
                            </div>
                        </div>
                    )}
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
                                        <h3 className="font-bold text-secondary uppercase tracking-widest text-[11px]">{col.label}</h3>
                                    </div>
                                    <span className="bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full">
                                        {getColumnItems(col.key).length}
                                    </span>
                                </div>

                                <div className="flex-1 bg-gray-100/50 rounded-[32px] p-4 overflow-y-auto space-y-3 custom-scrollbar border border-dashed border-gray-200">
                                    <AnimatePresence mode="popLayout">
                                        {getColumnItems(col.key).map((appt) => {
                                            const isCat = appt.pet?.species?.toUpperCase().includes('GATO');
                                            const isRecurring = appt.customer?.type === 'RECORRENTE';

                                            return (
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
                                                    className={`p-4 rounded-xl shadow-sm group hover:shadow-md transition-all cursor-pointer relative overflow-hidden border border-gray-100 active:scale-[0.99] border-l-[6px] ${isCat
                                                        ? 'bg-rose-50/50 border-l-rose-500 text-rose-900 hover:bg-rose-50'
                                                        : 'bg-indigo-50/50 border-l-indigo-500 text-indigo-900 hover:bg-indigo-50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-bold bg-white shadow-sm border ${isCat ? 'text-pink-500 border-pink-100' : 'text-blue-500 border-blue-100'}`}>
                                                            <Clock size={12} />
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-lg border border-current/5">
                                                            AG-{String(appt.seqId || 0).padStart(4, '0')}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 mb-4">
                                                        <h4 className="font-bold text-secondary text-lg group-hover:text-primary transition-colors truncate tracking-tight">
                                                            {appt.pet?.name || 'Pet'} {isRecurring ? '(R)' : '(A)'}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(appt.services || (appt.service ? [appt.service] : [])).map((s: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 bg-white/60 rounded-md border border-black/5 uppercase whitespace-nowrap">
                                                                    <span>{s.name}</span>
                                                                    <span className="opacity-40">R$ {Number(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between items-center bg-black/5 px-2.5 py-1 rounded-lg mt-2">
                                                            <p className="text-[11px] opacity-60 font-medium uppercase tracking-tighter truncate">
                                                                {appt.customer?.name}
                                                            </p>
                                                            <span className="text-[13px] font-bold tabular-nums">
                                                                R$ {(
                                                                    (appt.services || (appt.service ? [appt.service] : [])).reduce((acc: number, s: any) => acc + Number(s.basePrice || 0), 0) +
                                                                    (appt.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                                                                    ((!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) ? Number(appt.transportSnapshot.totalAmount || 0) : 0)
                                                                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {col.key === 'PENDENTE' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'CONFIRMADO', e)}
                                                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                                                            >
                                                                <CheckCircle size={14} /> CONFIRMAR
                                                            </button>
                                                        )}
                                                        {col.key === 'CONFIRMADO' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'EM_ATENDIMENTO', e)}
                                                                className="flex-1 py-3 bg-secondary text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md shadow-secondary/20 active:scale-95"
                                                            >
                                                                <PlayCircle size={14} /> INICIAR
                                                            </button>
                                                        )}
                                                        {col.key === 'EM_ATENDIMENTO' && (
                                                            <button
                                                                onClick={(e) => updateStatus(appt.id, 'FINALIZADO', e)}
                                                                className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md shadow-green-500/20 active:scale-95"
                                                            >
                                                                <CheckCircle size={14} /> FINALIZAR
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    {getColumnItems(col.key).length === 0 && !isLoading && (
                                        <div className="text-center py-16 opacity-30 select-none">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                                <List size={20} className="text-gray-400" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 italic">Lista Vazia</span>
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
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-secondary">Lixeira de Agendamentos</h2>
                                <p className="text-gray-400 text-sm">Itens excluídos nos últimos 15 dias.</p>
                            </div>
                            {trashAppointments.length > 0 && (
                                <button
                                    onClick={handleBulkPermanentDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={18} /> Esvaziar Lixeira
                                </button>
                            )}
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
                                        <p className="text-xs text-gray-500 mb-4">{appt.customer?.name || 'Cliente'} - {appt.pet?.name || 'Pet'}</p>

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
            </main >

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
        </>
    );
}
