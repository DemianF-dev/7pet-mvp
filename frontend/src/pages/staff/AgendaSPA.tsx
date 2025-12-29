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
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
    Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
    const [preFillData, setPreFillData] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (location.state?.prefill) {
            setPreFillData(location.state.prefill);
            setIsFormOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/appointments?category=SPA');
            setAppointments(response.data);
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir PERMANENTEMENTE os ${selectedIds.length} agendamentos selecionados?`)) return;
        try {
            await api.post('/appointments/bulk-delete', { ids: selectedIds });
            fetchAppointments();
            setSelectedIds([]);
        } catch (err) {
            alert('Erro ao excluir agendamentos');
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

    const nextDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() + 1);
        else if (view === 'WEEK') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const prevDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() - 1);
        else if (view === 'WEEK') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };

    const setToday = () => setSelectedDate(new Date());

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const renderDayView = () => {
        const dayAppts = filteredAppointments
            .filter(a => isSameDay(new Date(a.startAt), selectedDate))
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
            <div className="space-y-4">
                {dayAppts.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-200 shadow-inner">
                        <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Nenhum agendamento para este dia.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {dayAppts.map(appt => {
                            const statusColor = appt.status === 'PENDENTE' ? 'border-l-purple-600 bg-purple-50/30' :
                                appt.status === 'CONFIRMADO' ? 'border-l-blue-600 bg-blue-50/30' :
                                    appt.status === 'EM_ATENDIMENTO' ? 'border-l-purple-800 bg-purple-100/50' :
                                        'border-l-green-600 bg-green-50/30';

                            return (
                                <motion.div
                                    key={appt.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleOpenDetails(appt)}
                                    className={`group p-6 rounded-[32px] shadow-sm border-2 border-gray-100 flex items-center gap-6 hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden border-l-[12px] ${statusColor} ${selectedIds.includes(appt.id) ? 'ring-4 ring-primary/30 bg-primary/10' : ''}`}
                                >
                                    <button
                                        onClick={(e) => toggleSelect(appt.id, e)}
                                        className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white shadow-sm border ${selectedIds.includes(appt.id) ? 'bg-primary text-white border-primary' : 'text-gray-300 hover:text-primary border-gray-100'}`}
                                    >
                                        {selectedIds.includes(appt.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>

                                    <div className="w-28 shrink-0">
                                        <p className="text-[10px] font-black text-secondary/40 underline decoration-primary/30 decoration-2 underline-offset-4 uppercase tracking-[0.2em] mb-2">Horário</p>
                                        <p className="text-2xl font-black text-secondary tabular-nums drop-shadow-sm">
                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-2">Pet & Tutor(a)</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl font-black text-secondary uppercase tracking-tighter bg-white px-3 py-1 rounded-xl shadow-sm border border-gray-100">{appt.pet.name}</span>
                                            <span className="text-primary font-black text-lg">›</span>
                                            <span className="font-black text-gray-700 text-lg">{appt.customer.name}</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:block w-56">
                                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-2">Serviços</p>
                                        <div className="flex flex-wrap gap-1">
                                            {appt.services?.map(s => (
                                                <span key={s.id} className="text-[9px] font-black bg-white border border-gray-100 px-2 py-1 rounded-md text-secondary shadow-sm">
                                                    {s.name}
                                                </span>
                                            )) || (appt.service && (
                                                <span className="text-[9px] font-black bg-white border border-gray-100 px-2 py-1 rounded-md text-secondary shadow-sm">
                                                    {appt.service.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ml-auto text-right">
                                        <span className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border-2 shadow-sm uppercase tracking-widest ${appt.status === 'PENDENTE' ? 'bg-purple-600 text-white border-purple-700' :
                                            appt.status === 'CONFIRMADO' ? 'bg-blue-600 text-white border-blue-700' :
                                                appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-900 text-white border-purple-950' :
                                                    'bg-green-600 text-white border-green-700'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        return Array.from({ length: 6 }, (_, i) => { // Mon to Sat
            const dayOfweek = new Date(monday);
            dayOfweek.setDate(monday.getDate() + i);
            return dayOfweek;
        });
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays(selectedDate);
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {weekDays.map(day => {
                    const dayAppts = filteredAppointments
                        .filter(a => isSameDay(new Date(a.startAt), day))
                        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

                    return (
                        <div key={day.toISOString()} className="flex flex-col gap-4">
                            <div className={`p-4 rounded-[24px] text-center border-2 transition-all shadow-sm ${isSameDay(day, new Date()) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-white border-gray-100 text-secondary'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isSameDay(day, new Date()) ? 'text-white/80' : 'text-gray-400'}`}>
                                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </p>
                                <p className="text-2xl font-black">{day.getDate()}</p>
                            </div>

                            <div className="flex-1 space-y-3">
                                {dayAppts.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-[24px]">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Vazio</p>
                                    </div>
                                ) : (
                                    dayAppts.map(appt => (
                                        <div
                                            key={appt.id}
                                            onClick={() => handleOpenDetails(appt)}
                                            className={`p-4 bg-white rounded-[24px] border-2 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden border-l-[8px] ${appt.status === 'PENDENTE' ? 'border-l-purple-500' :
                                                appt.status === 'CONFIRMADO' ? 'border-l-blue-500' :
                                                    appt.status === 'EM_ATENDIMENTO' ? 'border-l-purple-700' :
                                                        'border-l-green-500'
                                                } ${selectedIds.includes(appt.id) ? 'ring-4 ring-primary/20 bg-primary/5 border-primary/50' : 'border-gray-100'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-sm ${appt.status === 'PENDENTE' ? 'bg-purple-600 text-white' :
                                                    appt.status === 'CONFIRMADO' ? 'bg-blue-600 text-white' :
                                                        appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-800 text-white' :
                                                            'bg-green-600 text-white'
                                                    }`}>
                                                    {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button
                                                    onClick={(e) => toggleSelect(appt.id, e)}
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white border border-gray-100 shadow-sm ${selectedIds.includes(appt.id) ? 'bg-primary text-white border-primary' : 'opacity-0 group-hover:opacity-100 text-gray-300'}`}
                                                >
                                                    <CheckSquare size={14} />
                                                </button>
                                            </div>
                                            <p className="text-xs font-black text-secondary uppercase truncate drop-shadow-sm">{appt.pet.name}</p>
                                            <p className="text-[10px] text-gray-700 font-black truncate">{appt.customer.name}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
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
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                    {weekHeaders.map(wh => (
                        <div key={wh} className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 last:border-none">
                            {wh}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {days.map((day, idx) => {
                        const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                        const isToday = isSameDay(day, new Date());
                        const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.startAt), day));

                        return (
                            <div
                                key={idx}
                                className={`min-h-[140px] p-2 border-r border-b border-gray-100 transition-all ${!isCurrentMonth ? 'bg-gray-100/50 opacity-40' : 'bg-white'} ${isToday ? 'bg-primary/10' : ''}`}
                            >
                                <div className="flex justify-end mb-2">
                                    <span className={`text-[13px] font-black w-8 h-8 flex items-center justify-center rounded-xl shadow-sm ${isToday ? 'bg-primary text-white shadow-lg' : 'text-secondary/60 bg-gray-50'}`}>
                                        {day.getDate()}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    {dayAppts.slice(0, 4).map(appt => (
                                        <div
                                            key={appt.id}
                                            onClick={() => handleOpenDetails(appt)}
                                            className={`p-2 rounded-xl border shadow-sm text-[10px] font-black uppercase truncate cursor-pointer hover:scale-[1.02] transition-all flex items-center gap-2 ${appt.status === 'PENDENTE' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                appt.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-200 text-purple-900 border-purple-300' :
                                                        'bg-green-100 text-green-700 border-green-200'
                                                } ${selectedIds.includes(appt.id) ? 'ring-2 ring-primary' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${appt.status === 'PENDENTE' ? 'bg-purple-500' :
                                                appt.status === 'CONFIRMADO' ? 'bg-blue-500' :
                                                    appt.status === 'EM_ATENDIMENTO' ? 'bg-purple-700' : 'bg-green-500'
                                                }`} />
                                            {appt.pet.name}
                                        </div>
                                    ))}
                                    {dayAppts.length > 4 && (
                                        <p className="text-[10px] font-black text-primary text-center mt-2 bg-primary/10 py-1 rounded-lg">+ {dayAppts.length - 4} mais</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-8">
                <header className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                            <div className="h-[2px] w-6 bg-primary"></div>
                            CENTRAL DE AGENDAMENTOS SPA
                        </div>
                        <div className="flex items-center gap-6">
                            <h1 className="text-4xl font-black text-secondary tracking-tight capitalize">
                                {view === 'DAY' ? selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) :
                                    selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h1>
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                <button onClick={prevDate} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={setToday} className="px-6 py-2 text-[10px] font-black text-secondary hover:text-primary uppercase tracking-[0.2em] transition-colors">
                                    Hoje
                                </button>
                                <button onClick={nextDate} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-primary">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[32px] border border-white shadow-xl shadow-black/5">
                        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-[26px]">
                            {['KANBAN', 'DAY', 'WEEK', 'MONTH'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => { setView(v as ViewType); setSelectedIds([]); }}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-[22px] text-[10px] font-black transition-all ${view === v ? 'bg-white text-primary shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    {v === 'KANBAN' ? <Layout size={14} /> : v === 'DAY' ? <List size={14} /> : <CalendarIcon size={14} />}
                                    <span className="uppercase tracking-widest">{v}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleCreateNew}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-[26px] font-black shadow-lg shadow-primary/20 transition-all text-[11px] tracking-widest flex items-center gap-3 uppercase"
                        >
                            <Plus size={18} strokeWidth={3} /> NOVO ITEM
                        </button>
                    </div>
                </header>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-8 min-w-[400px]"
                        >
                            <p className="text-sm font-bold flex items-center gap-2">
                                <span className="bg-primary px-3 py-1 rounded-full text-xs font-black">{selectedIds.length}</span>
                                Selecionados
                            </p>
                            <div className="h-8 w-px bg-white/10"></div>
                            <div className="flex items-center gap-4 ml-auto">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="text-xs font-bold hover:text-gray-300 transition-colors uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl transition-all shadow-lg"
                                    title="Excluir selecionados"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative mb-8">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por tutor, pet ou serviço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border-none rounded-[32px] pl-16 pr-8 py-5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold placeholder:text-gray-300"
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
                                                    className={`p-5 rounded-[28px] shadow-sm border-2 group hover:shadow-2xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden border-l-[10px] ${col.key === 'PENDENTE' ? 'bg-purple-50 border-purple-100 border-l-purple-600' :
                                                        col.key === 'CONFIRMADO' ? 'bg-blue-50 border-blue-100 border-l-blue-600' :
                                                            col.key === 'EM_ATENDIMENTO' ? 'bg-purple-100 border-purple-200 border-l-purple-800' :
                                                                'bg-green-50 border-green-100 border-l-green-600'
                                                        } ${selectedIds.includes(appt.id) ? 'ring-4 ring-primary/20' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black text-secondary border border-gray-100 shadow-sm">
                                                            <Clock size={12} className="text-primary" />
                                                            {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <button
                                                            onClick={(e) => toggleSelect(appt.id, e)}
                                                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all bg-white border border-gray-100 shadow-sm ${selectedIds.includes(appt.id) ? 'bg-primary text-white border-primary' : 'opacity-0 group-hover:opacity-100 text-gray-300'}`}
                                                        >
                                                            <CheckSquare size={14} />
                                                        </button>
                                                    </div>
                                                    <h4 className="font-black text-secondary text-base group-hover:text-primary transition-colors truncate uppercase drop-shadow-sm">{appt.pet.name}</h4>
                                                    <p className="text-[11px] text-gray-700 font-black truncate">{appt.customer.name}</p>
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
