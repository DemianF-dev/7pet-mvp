import { useState, useEffect } from 'react';
import {
    Clock, PlayCircle, CheckCircle, Search,
    Filter, PawPrint, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../../layouts/MobileShell';
import api from '../../../services/api';
import AppointmentDetailsModal from '../../../components/staff/AppointmentDetailsModal';
import { useModalStore } from '../../../store/modalStore';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    customer: { name: string; phone?: string };
    pet: { name: string; species: string; breed: string };
    services?: { name: string; basePrice: number }[];
    service?: { name: string; basePrice: number };
    transportLegs?: any[];
    transportSnapshot?: any;
    category?: string;
}

const statusColumns = [
    { key: 'PENDENTE', label: 'Pendentes', color: 'bg-orange-500', icon: Clock },
    { key: 'CONFIRMADO', label: 'Confirmados', color: 'bg-blue-500', icon: CheckCircle },
    { key: 'EM_ATENDIMENTO', label: 'Em Curso', color: 'bg-purple-600', icon: PlayCircle },
    { key: 'FINALIZADO', label: 'Concluídos', color: 'bg-emerald-500', icon: CheckCircle }
];

export const MobileKanban = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDENTE');
    const [searchTerm, setSearchTerm] = useState('');
    const { openDetailsModal } = useModalStore();

    const fetchAppointments = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/appointments');
            const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setAppointments(data);
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        const labels: any = {
            'CONFIRMADO': 'confirmar',
            'EM_ATENDIMENTO': 'iniciar',
            'FINALIZADO': 'finalizar'
        };

        if (!window.confirm(`Deseja realmente ${labels[status]}?`)) return;

        try {
            await api.patch(`/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        const matchesStatus = a.status === activeTab;
        const matchesSearch = searchTerm === '' ||
            a.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <MobileShell
            title="Service Kanban"
            rightAction={
                <button className="p-2 text-blue-600">
                    <Filter size={20} />
                </button>
            }
        >
            <div className="space-y-4 pb-20">
                {/* 1. Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="search"
                        placeholder="Buscar pet ou tutor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {/* 2. Status Tabs (Segmented Control) */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                    {statusColumns.map((col) => {
                        const count = appointments.filter(a => a.status === col.key).length;
                        const isActive = activeTab === col.key;
                        return (
                            <button
                                key={col.key}
                                onClick={() => setActiveTab(col.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${isActive
                                    ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                {col.label}
                                <span className="opacity-50 font-bold">{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 3. Cards List */}
                <div className="space-y-3 min-h-[50vh]">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <PawPrint size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium">Nenhum agendamento nesta fase.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredAppointments.map((appt) => (
                                <motion.div
                                    key={appt.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="mobile-card !p-0 !mb-0 overflow-hidden active:scale-[0.98] transition-transform"
                                    onClick={() => openDetailsModal(appt.id)}
                                >
                                    <div className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase leading-tight">
                                                    {appt.pet.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                    <User size={12} />
                                                    {appt.customer.name}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                                                <Clock size={12} />
                                                {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-50 dark:border-zinc-800/50">
                                            {(appt.services || [appt.service]).map((s: any, idx) => s && (
                                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase border border-gray-100 dark:border-zinc-700">
                                                    <span>{s.name}</span>
                                                    <span className="opacity-40">R$ {Number(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                            {appt.transportLegs?.map((l: any, idx: number) => (
                                                <div key={`leg-${idx}`} className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-bold uppercase border border-orange-100 dark:border-orange-800/30">
                                                    <span>{l.legType}</span>
                                                    <span className="opacity-40">R$ {Number(l.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                            {(!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-bold uppercase border border-orange-100 dark:border-orange-800/30">
                                                    <span>Transporte</span>
                                                    <span className="opacity-40">R$ {Number(appt.transportSnapshot.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/30 p-2 rounded-xl">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                                R$ {(
                                                    (appt.services || (appt.service ? [appt.service] : [])).reduce((acc: number, s: any) => acc + Number(s?.basePrice || 0), 0) +
                                                    (appt.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                                                    ((!appt.transportLegs?.length && appt.category === 'LOGISTICA' && appt.transportSnapshot) ? Number(appt.transportSnapshot.totalAmount || 0) : 0)
                                                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Bar (Only for actionable statuses) */}
                                    {activeTab !== 'FINALIZADO' && (
                                        <div className="flex border-t border-gray-100 dark:border-zinc-800">
                                            {activeTab === 'PENDENTE' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'CONFIRMADO'); }}
                                                    className="flex-1 py-3 text-xs font-bold text-blue-600 bg-blue-50/30 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> CONFIRMAR
                                                </button>
                                            )}
                                            {activeTab === 'CONFIRMADO' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'EM_ATENDIMENTO'); }}
                                                    className="flex-1 py-3 text-xs font-bold text-purple-600 bg-purple-50/30 flex items-center justify-center gap-2"
                                                >
                                                    <PlayCircle size={14} /> INICIAR
                                                </button>
                                            )}
                                            {activeTab === 'EM_ATENDIMENTO' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(appt.id, 'FINALIZADO'); }}
                                                    className="flex-1 py-3 text-xs font-bold text-emerald-600 bg-emerald-50/30 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={14} /> FINALIZAR
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </MobileShell>
    );
};
