import {
    X, User, Dog, Calendar, Clock, MapPin,
    CheckCircle, Printer, Send,
    Edit, Trash2, Copy, RefreshCcw, DollarSign, ShoppingCart, Lock,
    FileText, MoreHorizontal, ChevronRight, Phone
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAppointmentStatusColor } from '../../utils/statusColors';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import PaymentReceiptModal from '../PaymentReceiptModal';
import { calculateAppointmentTotal, formatCurrency, getServicePricingBreakdown } from '../../utils/appointmentPricing';

interface Staff {
    id: string;
    name: string;
    role: string;
    color?: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment: any;
    onModify: (appt: any) => void;
    onCopy: (appt: any) => void;
    onOpenCustomer?: (customerId: string) => void;
}

export default function AppointmentDetailsModal({ isOpen, onClose, onSuccess, appointment, onModify, onCopy, onOpenCustomer }: ModalProps) {
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [rescheduleData, setRescheduleData] = useState<{
        active: boolean;
        targetStatus: string;
        newDate: string;
    }>({ active: false, targetStatus: '', newDate: '' });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastPayment, setLastPayment] = useState<any>(null);
    const [localAppointment, setLocalAppointment] = useState(appointment);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditingPerformer, setIsEditingPerformer] = useState(false);
    const [performers, setPerformers] = useState<Staff[]>([]);
    const [selectedPerformerId, setSelectedPerformerId] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    const { user: currentUser } = useAuthStore();
    const isAdmin = currentUser && ['ADMIN', 'MASTER'].includes(currentUser.role || '');
    const isBilled = localAppointment && ['INVOICED', 'PAID'].includes(localAppointment.billingStatus);
    const isLocked = isBilled && !isAdmin;

    useEffect(() => {
        if (appointment && isOpen) {
            setLocalAppointment(appointment);
            refreshData();
        }
    }, [appointment, isOpen]);

    const refreshData = async () => {
        if (!appointment?.id) return;
        setIsRefreshing(true);
        try {
            const res = await api.get(`/appointments/${appointment.id}`);
            setLocalAppointment(res.data);
        } catch (err) {
            console.error('Error refreshing appointment:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!isOpen || !appointment || !localAppointment) return null;

    const handleDelete = async () => {
        const confirmed = window.confirm('Tem certeza que deseja excluir permanentemente este agendamento?');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await api.delete(`/appointments/${localAppointment.id}`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Erro ao excluir agendamento');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSendWhatsApp = () => {
        const serviceNames = localAppointment.services && localAppointment.services.length > 0
            ? localAppointment.services.map((s: any) => s.name).join(', ')
            : localAppointment.service?.name;

        const message = `Olá ${localAppointment.customer?.name || 'Cliente'}! Confirmamos o agendamento de ${serviceNames} para o ${localAppointment.pet?.name || 'seu pet'} no dia ${new Date(localAppointment.startAt).toLocaleDateString('pt-BR')} às ${new Date(localAppointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Até breve!`;
        const url = `https://wa.me/${localAppointment.customer?.phone || ''}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEditPerformer = async () => {
        setIsEditingPerformer(true);
        setSelectedPerformerId(localAppointment.performerId || '');
        if (performers.length === 0) {
            try {
                let allUsers = [];
                try {
                    const res = await api.get('/management/users');
                    allUsers = Array.isArray(res.data) ? res.data : [];
                } catch {
                    const resFallback = await api.get('/staff');
                    allUsers = Array.isArray(resFallback.data) ? resFallback.data : [];
                }
                const staff = allUsers.filter((u: any) => u.role !== 'CLIENTE');
                setPerformers(staff);
            } catch (err) {
                toast.error('Erro ao carregar profissionais');
            }
        }
    };

    const handleSavePerformer = async () => {
        try {
            await api.patch(`/appointments/${localAppointment.id}`, {
                performerId: selectedPerformerId || null
            });
            toast.success('Profissional atualizado!');
            setIsEditingPerformer(false);
            refreshData();
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao atualizar profissional');
        }
    };

    const pricingBreakdown = getServicePricingBreakdown(localAppointment);
    const totalPrice = calculateAppointmentTotal(localAppointment);
    const servicesList = localAppointment.services || (localAppointment.service ? [localAppointment.service] : []);
    const transportLegs = localAppointment.transportLegs || [];
    const totalDuration = servicesList.reduce((acc: number, s: any) => acc + (s?.duration || 0), 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md print:hidden"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#0F1113] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-white/10"
            >
                {/* Header Section */}
                <div className="relative p-6 pt-8 pb-4 shrink-0 overflow-hidden">
                    {/* Background Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${localAppointment.category === 'LOGISTICA'
                                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                    : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}>
                                    {localAppointment.category === 'LOGISTICA' ? 'Logística' : 'Estética'}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-white/5">
                                    #{String(localAppointment.seqId || 0).padStart(4, '0')}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-secondary dark:text-white tracking-tighter uppercase">
                                {localAppointment.category === 'LOGISTICA' ? 'Transporte' : (localAppointment.pet?.name || 'Agendamento')}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                                    className="p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                <AnimatePresence>
                                    {showActionsMenu && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowActionsMenu(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10, x: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10, x: -10 }}
                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1D1F] rounded-2xl shadow-2xl border border-zinc-100 dark:border-white/10 z-20 overflow-hidden"
                                            >
                                                <button onClick={() => { onModify(localAppointment); setShowActionsMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                    <Edit size={14} className="text-blue-500" /> Modificar
                                                </button>
                                                <button onClick={() => { onCopy(localAppointment); setShowActionsMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                    <Copy size={14} className="text-purple-500" /> Copiar
                                                </button>
                                                <button onClick={() => { handlePrint(); setShowActionsMenu(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                    <Printer size={14} /> Imprimir
                                                </button>
                                                <div className="h-px bg-zinc-100 dark:bg-white/5 mx-2 my-1" />
                                                <button onClick={handleDelete} className="w-full px-4 py-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <select
                                disabled={isLocked}
                                value={localAppointment.status}
                                onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    if (nextStatus === 'CANCELADO' || nextStatus === 'NO_SHOW') {
                                        setRescheduleData({ active: true, targetStatus: nextStatus, newDate: '' });
                                    } else {
                                        if (window.confirm(`Alterar status para ${nextStatus}?`)) {
                                            api.patch(`/appointments/${localAppointment.id}/status`, { status: nextStatus })
                                                .then(() => { onSuccess(); refreshData(); })
                                                .catch(() => toast.error('Erro ao atualizar status'));
                                        }
                                    }
                                }}
                                className={`pl-4 pr-10 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest border-2 transition-all appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-primary/5 ${getAppointmentStatusColor(localAppointment.status)
                                    }`}
                            >
                                <option value="PENDENTE">Aguardando</option>
                                <option value="CONFIRMADO">Confirmado</option>
                                <option value="EM_ATENDIMENTO">Em Operação</option>
                                <option value="FINALIZADO">Concluído</option>
                                <option value="CANCELADO">Cancelado</option>
                                <option value="NO_SHOW">No-Show</option>
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-current opacity-50 pointer-events-none" size={12} />
                        </div>

                        {localAppointment.quoteId && (
                            <button
                                onClick={() => { onClose(); navigate(`/staff/quotes/${localAppointment.quoteId}`); }}
                                className="px-4 py-2.5 bg-purple-500/10 text-purple-500 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all border border-purple-500/20 active:scale-95"
                            >
                                <FileText size={14} className="inline mr-2" /> Orçamento
                            </button>
                        )}

                        <button
                            onClick={handleSendWhatsApp}
                            className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 active:scale-95"
                        >
                            <Send size={14} className="inline mr-2" /> WhatsApp
                        </button>

                        {(() => {
                            const activeInvoice = localAppointment.invoice || localAppointment.quote?.invoice;
                            const totalCovered = activeInvoice?.amount || localAppointment.posOrder?.finalAmount || 0;
                            const isFullyPaid = (localAppointment.billingStatus === 'PAID' || activeInvoice?.status === 'PAGO' || localAppointment.posOrder?.status === 'PAID') && totalPrice <= (totalCovered + 0.1);
                            const isBilledOnly = localAppointment.billingStatus === 'INVOICED' || !!activeInvoice || !!localAppointment.posOrder;

                            if (isFullyPaid) {
                                return (
                                    <div className="px-4 py-2.5 bg-emerald-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in duration-300">
                                        <CheckCircle size={14} /> PAGO
                                    </div>
                                );
                            }
                            if (isBilledOnly) {
                                return (
                                    <div className="px-4 py-2.5 bg-amber-500 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-500/20">
                                        <FileText size={14} /> FATURADO
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-6 pb-24">
                    {/* Time/Date Section */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="bg-zinc-50 dark:bg-white/5 p-5 rounded-[2rem] border border-zinc-100 dark:border-white/5 group hover:bg-primary/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 text-primary">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-0.5">Data</p>
                                    <p className="text-lg font-black text-secondary dark:text-white leading-none">
                                        {new Date(localAppointment.startAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 dark:bg-white/5 p-5 rounded-[2rem] border border-zinc-100 dark:border-white/5 group hover:bg-indigo-500/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 text-indigo-500">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-0.5">Horário</p>
                                    <p className="text-lg font-black text-secondary dark:text-white leading-none">
                                        {new Date(localAppointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Entities Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Tutor */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-2 pl-2">
                                <div className="w-1 h-1 bg-primary rounded-full" /> Tutor
                            </h3>
                            <div
                                onClick={() => onOpenCustomer && localAppointment.customer?.id && onOpenCustomer(localAppointment.customer.id)}
                                className={`flex items-center gap-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-[2rem] border border-zinc-100 dark:border-white/5 group transition-all ${onOpenCustomer ? 'cursor-pointer hover:border-primary/40 hover:bg-primary/5' : ''}`}
                            >
                                <div className="w-12 h-12 bg-primary/20 dark:bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl border border-primary/20 shrink-0 group-hover:scale-110 transition-transform">
                                    {localAppointment.customer?.name?.[0].toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-secondary dark:text-white truncate uppercase text-xs leading-none mb-1">{localAppointment.customer?.name || 'Cliente'}</p>
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <Phone size={10} className="text-zinc-400 shrink-0" />
                                        <p className="text-[10px] text-zinc-400 font-bold truncate uppercase">{localAppointment.customer?.phone || 'Sem fone'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paciente */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-2 pl-2">
                                <div className="w-1 h-1 bg-secondary dark:bg-zinc-400 rounded-full" /> Pet
                            </h3>
                            <div className="flex items-center gap-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-[2rem] border border-zinc-100 dark:border-white/5 group transition-all">
                                <div className="w-12 h-12 bg-zinc-200 dark:bg-white/10 rounded-2xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0 group-hover:scale-110 transition-transform">
                                    <Dog size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-secondary dark:text-white truncate uppercase text-xs leading-none mb-1">{localAppointment.pet?.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold truncate uppercase">{localAppointment.pet?.breed || 'SRD'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Staff */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full" /> Profissional
                                </h3>
                                {!isEditingPerformer && (
                                    <button onClick={handleEditPerformer} className="text-[9px] text-primary font-black uppercase tracking-widest hover:brightness-125 transition-all">Alterar</button>
                                )}
                            </div>
                            {isEditingPerformer ? (
                                <div className="p-3 bg-white dark:bg-[#1A1D1F] border-2 border-primary/20 rounded-[2rem] shadow-2xl space-y-3">
                                    <select
                                        value={selectedPerformerId}
                                        onChange={(e) => setSelectedPerformerId(e.target.value)}
                                        className="w-full text-xs font-black uppercase p-3 bg-zinc-50 dark:bg-black/20 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Ninguém</option>
                                        {performers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingPerformer(false)} className="flex-1 py-2 bg-zinc-100 dark:bg-white/5 text-[9px] font-black uppercase rounded-xl">Cancelar</button>
                                        <button onClick={handleSavePerformer} className="flex-1 py-2 bg-primary text-white text-[9px] font-black uppercase rounded-xl shadow-lg shadow-primary/20">Salvar</button>
                                    </div>
                                </div>
                            ) : localAppointment.performer ? (
                                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-white/5 p-4 rounded-[2rem] border border-zinc-100 dark:border-white/5 group transition-all">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: localAppointment.performer?.color || '#6366f1' }}
                                    >
                                        {localAppointment.performer?.name?.[0].toUpperCase() || 'P'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-secondary dark:text-white truncate uppercase text-xs leading-none mb-1">{localAppointment.performer?.name?.split(' ')[0]}</p>
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block">
                                            {localAppointment.performer?.role}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={handleEditPerformer} className="w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 rounded-[2rem] group hover:bg-primary/5 hover:border-primary/20 transition-all">
                                    <p className="text-[10px] font-black text-zinc-400 group-hover:text-primary uppercase tracking-[0.2em]">Definir Profissional</p>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-2 pl-2">
                            <div className="w-1 h-1 bg-secondary rounded-full" /> Detalhamento do Serviço
                        </h3>
                        <div className={`relative p-8 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all ${localAppointment.category === 'LOGISTICA'
                            ? 'bg-orange-600 text-white shadow-orange-500/20'
                            : 'bg-zinc-900 dark:bg-black text-white shadow-zinc-900/40 border border-white/5'
                            }`}>
                            {/* Decorative background element */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                            <div className="relative space-y-4">
                                {localAppointment.category === 'SPA' && (
                                    <>
                                        {pricingBreakdown.length > 0 ? (
                                            <div className="space-y-3">
                                                {pricingBreakdown.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-black uppercase tracking-tight block truncate group-hover/item:translate-x-1 transition-transform">
                                                                {item.serviceName}
                                                                {item.isManual && <span className="ml-2 text-[10px] bg-primary/20 text-primary-light px-2 py-0.5 rounded-full border border-primary/20">Ajuste</span>}
                                                            </span>
                                                            {item.discount > 0 && (
                                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                                    R$ {item.price.toFixed(2)} - R$ {item.discount.toFixed(2)} desc
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-lg font-black tabular-nums">R$ {item.total.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            servicesList.length > 0 ? (
                                                <div className="space-y-3">
                                                    {servicesList.map((s: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                                            <div className="min-w-0">
                                                                <span className="text-sm font-black uppercase tracking-tight block truncate group-hover/item:translate-x-1 transition-transform">{s.name}</span>
                                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{s.duration || 0} min</span>
                                                            </div>
                                                            <span className="text-lg font-black tabular-nums">R$ {(s.basePrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center py-4 italic">Sem serviços definidos</p>
                                            )
                                        )}
                                    </>
                                )}

                                {localAppointment.category === 'LOGISTICA' && (
                                    <div className="space-y-3">
                                        {pricingBreakdown.length > 0 ? (
                                            pricingBreakdown.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors">
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-black uppercase tracking-tight block group-hover/item:translate-x-1 transition-transform">{item.serviceName}</span>
                                                        {item.description && <span className="text-[10px] font-bold text-white/60 tracking-wider"> {item.description} </span>}
                                                    </div>
                                                    <span className="text-lg font-black tabular-nums">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))
                                        ) : transportLegs.length > 0 ? (
                                            transportLegs.map((l: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded-xl transition-colors border-t border-white/10 pt-3 first:border-0 first:pt-0">
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-black uppercase tracking-tight block group-hover/item:translate-x-1 transition-transform">Transporte: {l.legType || 'Trecho'}</span>
                                                        <span className="text-[10px] font-bold text-white/60 tracking-widest">{l.kms || 0} km</span>
                                                    </div>
                                                    <span className="text-lg font-black tabular-nums">R$ {(l.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center py-4 italic">Transporte sob consulta</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Final</p>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-tight">{totalDuration}m alocados</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                                        <span className="text-lg mr-1 opacity-40">R$</span>{totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logistics specific info */}
                    {localAppointment.transport && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest flex items-center gap-2 pl-2">
                                <div className="w-1 h-1 bg-orange-500 rounded-full" /> Itinerário de Logística
                            </h3>
                            <div className="bg-zinc-50 dark:bg-white/5 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-white/5 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="relative pl-6 border-l-4 border-orange-500/30">
                                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">Origem</p>
                                        <div className="flex gap-2">
                                            <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                                            <p className="text-xs font-black text-secondary dark:text-white leading-relaxed uppercase">{localAppointment.transport.origin}</p>
                                        </div>
                                    </div>
                                    <div className="relative pl-6 border-l-4 border-primary/30">
                                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-2">Destino</p>
                                        <div className="flex gap-2">
                                            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs font-black text-secondary dark:text-white leading-relaxed uppercase">{localAppointment.transport.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-white dark:bg-black/20 rounded-[2rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" /> Coleta
                                        </p>
                                        <p className="text-sm font-black text-secondary dark:text-white truncate uppercase">
                                            {localAppointment.pickupProvider?.name?.split(' ')[0] || 'Aguardo'}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-white dark:bg-black/20 rounded-[2rem] border border-zinc-100 dark:border-white/5 shadow-sm">
                                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary" /> Entrega
                                        </p>
                                        <p className="text-sm font-black text-secondary dark:text-white truncate uppercase">
                                            {localAppointment.dropoffProvider?.name?.split(' ')[0] || 'Aguardo'}
                                        </p>
                                    </div>
                                </div>

                                {localAppointment.category === 'LOGISTICA' && (
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {[
                                            { label: 'EXECUTADO', color: 'bg-emerald-500 shadow-emerald-500/20' },
                                            { label: 'ATRASADO', color: 'bg-amber-500 shadow-amber-500/20' },
                                            { label: 'REAGENDAR', color: 'bg-primary shadow-primary/20' }
                                        ].map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/appointments/${localAppointment.id}/logistics-status`, {
                                                            status: action.label === 'EXECUTADO' ? 'EXECUTED' :
                                                                action.label === 'ATRASADO' ? 'DELAYED' : 'RESCHEDULE'
                                                        });
                                                        toast.success('Logística atualizada');
                                                        refreshData();
                                                    } catch (err) { toast.error('Erro'); }
                                                }}
                                                className={`px-5 py-2.5 ${action.color} text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg`}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Footer with Primary Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#0F1113] via-white/90 dark:via-[#0F1113]/90 to-transparent shrink-0 z-30">
                    <div className="flex items-center gap-4 bg-white dark:bg-[#1A1D1F] p-4 rounded-[2.5rem] border border-zinc-100 dark:border-white/10 shadow-2xl">
                        {(() => {
                            const activeInvoice = localAppointment.invoice || localAppointment.quote?.invoice;
                            const totalCovered = activeInvoice?.amount || localAppointment.posOrder?.finalAmount || 0;
                            // Relaxed check: if the system says PAID and we don't have a huge mismatch, trust it.
                            const isPaid = (localAppointment.billingStatus === 'PAID' || activeInvoice?.status === 'PAGO' || localAppointment.posOrder?.status === 'PAID') &&
                                (totalPrice <= (totalCovered + 0.5)); // Larger margin for rounding

                            if (isPaid) {
                                return (
                                    <div className="flex-1 px-6 py-4 bg-emerald-600 font-black text-white rounded-3xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30">
                                        <CheckCircle size={20} /> <span>Agendamento Totalmente Pago</span>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate(`/staff/pos?appointmentId=${localAppointment.id}`);
                                        }}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 group active:scale-[0.98]"
                                    >
                                        <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" /> <span>PDV</span>
                                    </button>

                                    {localAppointment.invoice ? (
                                        <button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-3xl transition-all flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-[0.98]"
                                        >
                                            <DollarSign size={18} /> <span>Receber</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                const useQuote = localAppointment.quoteId && window.confirm('Gerar fatura baseada no ORÇAMENTO COMPLETO?');
                                                try {
                                                    const amount = useQuote ? (localAppointment.quote?.totalAmount || 0) : totalPrice;
                                                    await api.post('/invoices', {
                                                        customerId: localAppointment.customer?.id,
                                                        amount: amount,
                                                        dueDate: new Date().toISOString(),
                                                        appointmentId: useQuote ? undefined : localAppointment.id,
                                                        quoteId: localAppointment.quoteId
                                                    });
                                                    toast.success('Fatura gerada!');
                                                    refreshData();
                                                    setIsPaymentModalOpen(true);
                                                } catch (err) {
                                                    toast.error('Erro ao gerar fatura');
                                                }
                                            }}
                                            className="px-8 py-4 bg-primary hover:brightness-110 text-white rounded-3xl transition-all flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-[0.98]"
                                        >
                                            <DollarSign size={18} /> <span>Faturar</span>
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Reschedule Overlay */}
                <AnimatePresence>
                    {rescheduleData.active && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            className="absolute inset-0 bg-white/90 dark:bg-black/90 shadow-inner z-50 p-8 flex flex-col justify-center"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter">
                                    Ajuste de <span className="text-primary italic">Status</span>
                                </h3>
                                <button onClick={() => setRescheduleData({ active: false, targetStatus: '', newDate: '' })} className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl text-zinc-400">
                                    <X size={24} />
                                </button>
                            </div>

                            {!rescheduleData.newDate ? (
                                <div className="space-y-6">
                                    <div className="bg-red-500/5 p-6 rounded-[2.5rem] border border-red-500/20">
                                        <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">
                                            Justificativa do {rescheduleData.targetStatus}
                                        </label>
                                        <textarea
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder="..."
                                            className="w-full bg-white dark:bg-black/40 border-2 border-red-500/10 rounded-[1.5rem] p-4 text-sm text-secondary dark:text-white focus:ring-4 focus:ring-red-500/5 resize-none outline-none font-bold"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={async () => {
                                                if (!cancellationReason.trim()) { toast.error('Justificativa obrigatória'); return; }
                                                try {
                                                    await api.patch(`/appointments/${localAppointment.id}/status`, {
                                                        status: rescheduleData.targetStatus,
                                                        reason: cancellationReason.trim()
                                                    });
                                                    toast.success('Atualizado');
                                                    setCancellationReason('');
                                                    onSuccess();
                                                    onClose();
                                                } catch (err) { toast.error('Erro'); }
                                            }}
                                            disabled={!cancellationReason.trim()}
                                            className={`py-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all border-2 ${cancellationReason.trim()
                                                ? 'bg-red-500 text-white border-red-500/20 shadow-xl shadow-red-500/20 active:scale-95'
                                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-300 dark:text-zinc-700 border-transparent cursor-not-allowed'
                                                }`}
                                        >
                                            <X size={32} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Confirmar {rescheduleData.targetStatus}</span>
                                        </button>

                                        <button
                                            onClick={() => setRescheduleData({ ...rescheduleData, newDate: localAppointment.startAt.split('.')[0] })}
                                            className="py-6 bg-zinc-900 dark:bg-white text-secondary dark:text-black rounded-[2rem] flex flex-col items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                                        >
                                            <RefreshCcw size={32} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Reagendar Horário</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-primary/5 p-6 rounded-[2.5rem] border-2 border-primary/20">
                                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 text-center">Novo Horário do Paciente</label>
                                        <div className="relative">
                                            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
                                            <input
                                                type="datetime-local"
                                                value={rescheduleData.newDate.substring(0, 16)}
                                                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                                                className="w-full bg-white dark:bg-black/40 border-none rounded-[1.5rem] pl-16 py-5 text-xl font-black text-secondary dark:text-white focus:ring-4 focus:ring-primary/10 tracking-tighter"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setRescheduleData({ ...rescheduleData, newDate: '' })}
                                            className="flex-1 py-5 bg-zinc-100 dark:bg-white/10 text-zinc-500 font-black uppercase text-[10px] tracking-widest rounded-[1.5rem] active:scale-95 transition-all"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (rescheduleData.targetStatus === 'CANCELADO') {
                                                        await api.patch(`/appointments/${localAppointment.id}`, {
                                                            startAt: new Date(rescheduleData.newDate).toISOString(),
                                                            status: 'CONFIRMADO'
                                                        });
                                                    } else {
                                                        const { id, createdAt, services, customer, pet, performer, transport, ...copyData } = localAppointment;
                                                        await api.post('/appointments', {
                                                            ...copyData,
                                                            customerId: customer?.id,
                                                            petId: pet?.id,
                                                            serviceIds: (services || []).map((s: any) => s.id),
                                                            performerId: performer?.id,
                                                            startAt: new Date(rescheduleData.newDate).toISOString(),
                                                            status: 'CONFIRMADO',
                                                            transport: transport ? { origin: transport.origin, destination: transport.destination, requestedPeriod: transport.requestedPeriod } : undefined
                                                        });
                                                        await api.patch(`/appointments/${localAppointment.id}/status`, { status: 'NO_SHOW' });
                                                    }
                                                    toast.success('Sucesso!');
                                                    onSuccess();
                                                    onClose();
                                                } catch (err) { toast.error('Erro'); }
                                            }}
                                            className="flex-[2] py-5 bg-secondary dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                                        >
                                            Confirmar Reagendamento
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Sub-modals */}
            <AnimatePresence>
                {isPaymentModalOpen && (localAppointment.invoice || localAppointment.quote?.invoice) && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        invoice={localAppointment.invoice || localAppointment.quote?.invoice}
                        onSuccess={async (payment) => {
                            setLastPayment(payment);
                            setIsPaymentModalOpen(false);
                            setShowReceipt(true);
                            refreshData();
                            onSuccess();
                        }}
                    />
                )}
            </AnimatePresence>

            <PaymentReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                payment={lastPayment}
                customerName={localAppointment.customer?.name || 'Cliente'}
            />
        </div>
    );
}
