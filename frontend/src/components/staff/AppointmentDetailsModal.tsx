import {
    X, User, Dog, Calendar, Clock, MapPin,
    CheckCircle, Clock3, Printer, Send,
    Edit, Trash2, Copy, RefreshCcw, DollarSign, ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useState, useEffect } from 'react';
import { getAppointmentStatusColor } from '../../utils/statusColors';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import PaymentReceiptModal from '../PaymentReceiptModal';

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

    // Sync local state when appointment prop changes
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

    if (!isOpen || !appointment) return null;

    const handleDelete = async () => {
        const confirmed = window.confirm('Tem certeza que deseja excluir permanentemente este agendamento?');
        if (!confirmed) {
            onClose();
            return;
        }
        setIsDeleting(true);
        try {
            await api.delete(`/appointments/${localAppointment.id}`);
            onSuccess();
            onClose();
        } catch (error) {
            alert('Erro ao excluir agendamento');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleModifyConfirm = () => {
        if (window.confirm('Deseja modificar este agendamento?')) {
            onModify(localAppointment);
        } else {
            onClose();
        }
    };

    const handleCopyConfirm = () => {
        if (window.confirm('Deseja copiar este agendamento?')) {
            onCopy(localAppointment);
        } else {
            onClose();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendWhatsApp = () => {
        const serviceNames = localAppointment.services && localAppointment.services.length > 0
            ? localAppointment.services.map((s: any) => s.name).join(', ')
            : localAppointment.service?.name;

        const message = `Olá ${localAppointment.customer.name}! Confirmamos o agendamento de ${serviceNames} para o ${localAppointment.pet.name} no dia ${new Date(localAppointment.startAt).toLocaleDateString('pt-BR')} às ${new Date(localAppointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Até breve!`;
        const url = `https://wa.me/${localAppointment.customer.phone || ''}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };


    // Fetch performers on demand
    const handleEditPerformer = async () => {
        setIsEditingPerformer(true);
        setSelectedPerformerId(localAppointment.performerId || '');
        if (performers.length === 0) {
            try {
                // Try management route first, then staff (fallback)
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
                console.error('Error fetching performers:', err);
                toast.error('Erro ao carregar lista de profissionais');
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

            // Force full refresh to ensure UI is in sync
            const res = await api.get(`/appointments/${localAppointment.id}`);
            setLocalAppointment(res.data);
            onSuccess();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.error || 'Erro ao atualizar profissional');
        }
    };

    // Calculate totals
    const servicesList = localAppointment.services || (localAppointment.service ? [localAppointment.service] : []);
    const totalDuration = servicesList.reduce((acc: number, s: any) => acc + s.duration, 0);
    const totalPrice = servicesList.reduce((acc: number, s: any) => acc + s.basePrice, 0);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-secondary/60 backdrop-blur-sm print:hidden"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:h-screen"
            >
                {isRefreshing && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 flex items-center justify-center">
                        <RefreshCcw className="animate-spin text-primary" size={32} />
                    </div>
                )}

                {/* Actions Header */}
                <div className="bg-gray-900 p-4 flex flex-wrap justify-between items-center gap-2 print:hidden">
                    <div className="flex gap-2">
                        <button onClick={handleModifyConfirm} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
                            <Edit size={16} /> Modificar
                        </button>
                        <button onClick={handleCopyConfirm} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
                            <Copy size={16} /> Copiar
                        </button>
                        <button onClick={handleDelete} disabled={isDeleting} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
                            <Trash2 size={16} /> {isDeleting ? 'Excluindo...' : 'Deletar'}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2.5 bg-primary text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-primary/20">
                            <Printer size={16} /> Imprimir
                        </button>
                        <button onClick={handleSendWhatsApp} className="p-2.5 bg-green-500 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-green-500/20">
                            <Send size={16} /> Enviar (WA)
                        </button>
                    </div>

                    {/* Financial Receipt Status / Payment Trigger / POS Checkout */}
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        {/* New POS Checkout Button */}
                        <button
                            onClick={() => {
                                onClose();
                                window.location.href = `/staff/pos?appointmentId=${localAppointment.id}`;
                            }}
                            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20"
                        >
                            <ShoppingCart size={16} /> Finalizar no Caixa (PDV)
                        </button>

                        {(() => {
                            const activeInvoice = localAppointment.invoice || localAppointment.quote?.invoice;

                            if (activeInvoice) {
                                if (activeInvoice.status === 'PAGO') {
                                    return (
                                        <div className="p-2.5 bg-green-100 text-green-700 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                            <CheckCircle size={16} /> Pago
                                        </div>
                                    );
                                }
                                return (
                                    <button
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="p-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-yellow-500/20"
                                    >
                                        <DollarSign size={16} /> Receber Pagamento
                                    </button>
                                );
                            }

                            return (
                                <button
                                    onClick={async () => {
                                        const useQuote = localAppointment.quoteId && window.confirm('Deseja gerar a fatura baseada no ORÇAMENTO COMPLETO? (Sim) ou apenas no valor deste agendamento? (Não)');

                                        try {
                                            const amount = useQuote ? localAppointment.quote.totalAmount : totalPrice;
                                            await api.post('/invoices', {
                                                customerId: localAppointment.customer.id,
                                                amount: amount,
                                                dueDate: new Date().toISOString(),
                                                appointmentId: useQuote ? undefined : localAppointment.id,
                                                quoteId: localAppointment.quoteId
                                            });
                                            toast.success('Fatura gerada com sucesso!');
                                            // Refresh details
                                            const refreshed = await api.get(`/appointments/${localAppointment.id}`);
                                            setLocalAppointment(refreshed.data);
                                            setIsPaymentModalOpen(true);
                                        } catch (err) {
                                            toast.error('Erro ao gerar fatura');
                                        }
                                    }}
                                    className="p-2.5 bg-primary text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                                >
                                    <DollarSign size={16} /> Gerar e Pagar
                                </button>
                            );
                        })()}
                    </div>
                </div>

                <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {localAppointment.category === 'LOGISTICA' ? (
                                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Transporte
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    SPA (Banho & Tosa)
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-secondary dark:text-white">
                            Detalhes do <span className={localAppointment.category === 'LOGISTICA' ? 'text-orange-500' : 'text-primary'}>
                                {localAppointment.category === 'LOGISTICA' ? 'Transporte' : 'Agendamento'}
                            </span>
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                            <select
                                value={localAppointment.status}
                                onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    if (nextStatus === 'CANCELADO' || nextStatus === 'NO_SHOW') {
                                        setRescheduleData({ active: true, targetStatus: nextStatus, newDate: '' });
                                    } else {
                                        if (window.confirm(`Deseja alterar o status para ${nextStatus}?`)) {
                                            api.patch(`/appointments/${localAppointment.id}/status`, { status: nextStatus })
                                                .then(() => { onSuccess(); onClose(); })
                                                .catch(() => toast.error('Erro ao atualizar status'));
                                        }
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm dark:bg-gray-700 dark:text-white ${getAppointmentStatusColor(localAppointment.status)}`}
                            >
                                <option value="PENDENTE">Solicitado</option>
                                <option value="CONFIRMADO">Confirmado</option>
                                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                                <option value="FINALIZADO">Finalizado</option>
                                <option value="CANCELADO">Cancelado</option>
                                <option value="NO_SHOW">No Show</option>
                            </select>
                        </div>
                    </div>

                    {/* Reschedule UI Overlay inside the header area if active */}
                    {rescheduleData.active && (
                        <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-20 p-8 flex flex-col justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* ... (Reschedule UI same as before, no changes needed inside logic) ... */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-secondary dark:text-white">
                                    O que deseja fazer com este <span className="text-primary">Agendamento</span>?
                                </h3>
                                <button onClick={() => setRescheduleData({ active: false, targetStatus: '', newDate: '' })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {!rescheduleData.newDate ? (
                                <div className="space-y-4">
                                    {/* Campo de Justificativa Obrigatória */}
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-500/30">
                                        <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-2">
                                            ⚠️ Justificativa Obrigatória
                                        </label>
                                        <textarea
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            placeholder={rescheduleData.targetStatus === 'CANCELADO'
                                                ? 'Por que este agendamento está sendo cancelado?'
                                                : 'Por que o cliente não compareceu?'}
                                            className="w-full bg-white dark:bg-gray-700 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-sm text-secondary dark:text-white focus:ring-2 focus:ring-red-500/20 resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={async () => {
                                                if (!cancellationReason.trim()) {
                                                    toast.error('Justificativa obrigatória para ' + (rescheduleData.targetStatus === 'CANCELADO' ? 'cancelamento' : 'no-show'));
                                                    return;
                                                }
                                                try {
                                                    await api.patch(`/appointments/${localAppointment.id}/status`, {
                                                        status: rescheduleData.targetStatus,
                                                        reason: cancellationReason.trim()
                                                    });
                                                    toast.success('Status atualizado com sucesso');
                                                    setCancellationReason('');
                                                    onSuccess();
                                                    onClose();
                                                } catch (err) {
                                                    toast.error('Erro ao atualizar status');
                                                }
                                            }}
                                            disabled={!cancellationReason.trim()}
                                            className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all group ${cancellationReason.trim()
                                                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-500/30'
                                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700'}`}
                                        >
                                            <X size={32} className={cancellationReason.trim() ? 'text-red-500' : 'text-gray-300'} />
                                            <span className="text-xs font-black uppercase tracking-widest">Confirmar {rescheduleData.targetStatus === 'CANCELADO' ? 'Cancelamento' : 'No-Show'}</span>
                                        </button>

                                        <button
                                            onClick={() => setRescheduleData({ ...rescheduleData, newDate: localAppointment.startAt.split('.')[0] })}
                                            className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-primary/10 hover:text-primary dark:bg-gray-700 dark:hover:bg-primary/20 rounded-3xl border border-gray-100 dark:border-gray-600 transition-all group"
                                        >
                                            <RefreshCcw size={32} className="text-gray-300 group-hover:text-primary" />
                                            <span className="text-xs font-black uppercase tracking-widest">Reagendar para Outra Data</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
                                        <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Selecione a Nova Data e Horário:</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                                            <input
                                                type="datetime-local"
                                                value={rescheduleData.newDate.substring(0, 16)}
                                                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                                                className="w-full bg-white dark:bg-gray-700 border-none rounded-xl pl-12 py-3 text-sm font-bold text-secondary dark:text-white focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setRescheduleData({ ...rescheduleData, newDate: '' })}
                                            className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (rescheduleData.targetStatus === 'CANCELADO') {
                                                        // Transfer: Update current
                                                        await api.patch(`/appointments/${localAppointment.id}`, {
                                                            startAt: new Date(rescheduleData.newDate).toISOString(),
                                                            status: 'CONFIRMADO' // Reset to confirmed when transferred
                                                        });
                                                        toast.success('Agendamento transferido com sucesso');
                                                    } else {
                                                        // NO_SHOW: Copy as new, keep old as NO_SHOW
                                                        const { id, createdAt, services, customer, pet, performer, transport, ...copyData } = localAppointment;
                                                        await api.post('/appointments', {
                                                            ...copyData,
                                                            customerId: customer.id,
                                                            petId: pet.id,
                                                            serviceIds: services.map((s: any) => s.id),
                                                            performerId: performer?.id,
                                                            startAt: new Date(rescheduleData.newDate).toISOString(),
                                                            status: 'CONFIRMADO',
                                                            transport: transport ? {
                                                                origin: transport.origin,
                                                                destination: transport.destination,
                                                                requestedPeriod: transport.requestedPeriod
                                                            } : undefined
                                                        });

                                                        // Update old one to NO_SHOW
                                                        await api.patch(`/appointments/${localAppointment.id}/status`, { status: 'NO_SHOW' });
                                                        toast.success('Novo agendamento criado (No-Show registrado)');
                                                    }
                                                    onSuccess();
                                                    onClose();
                                                } catch (err) {
                                                    toast.error('Erro ao processar reagendamento');
                                                }
                                            }}
                                            className="flex-2 grow py-4 bg-secondary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-secondary/20"
                                        >
                                            Confirmar e Reagendar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 print:hidden">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                    {/* Infos Principais */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                            <Calendar className={localAppointment.category === 'LOGISTICA' ? 'text-orange-500 mb-2' : 'text-primary mb-2'} size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data</p>
                            <p className="text-sm font-bold text-secondary dark:text-white">{new Date(localAppointment.startAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                            <Clock className={localAppointment.category === 'LOGISTICA' ? 'text-orange-500 mb-2' : 'text-primary mb-2'} size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {localAppointment.category === 'LOGISTICA' ? 'Horário Previsto' : 'Horário'}
                            </p>
                            <p className="text-sm font-bold text-secondary dark:text-white">{new Date(localAppointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Cliente & Pet & Performer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div
                                onClick={() => onOpenCustomer && onOpenCustomer(localAppointment.customer.id)}
                                className={`flex items-center gap-4 bg-white dark:bg-gray-700/50 p-3 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm ${onOpenCustomer ? 'cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all' : ''}`}
                            >

                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl uppercase">
                                    {localAppointment.customer?.name ? localAppointment.customer.name[0] : '?'}
                                </div>
                                <div className="overflow-hidden text-left">
                                    <p className="font-bold text-secondary dark:text-white truncate">{localAppointment.customer?.name || 'Cliente'}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{localAppointment.customer?.user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <Dog size={14} /> Pet
                            </h3>
                            <div className="flex items-center gap-4 bg-white dark:bg-gray-700/50 p-3 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm">
                                <div className="w-12 h-12 bg-secondary/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-secondary dark:text-white border border-gray-100 dark:border-gray-600">
                                    <Dog size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-secondary dark:text-white truncate">{localAppointment.pet?.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{localAppointment.pet?.species} • {localAppointment.pet?.breed || 'SRD'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> Profissional
                                </h3>
                                {!isEditingPerformer && (
                                    <button onClick={handleEditPerformer} className="text-[10px] text-primary font-bold hover:underline">
                                        ALTERAR
                                    </button>
                                )}
                            </div>
                            {isEditingPerformer ? (
                                <div className="p-3 bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm space-y-3">
                                    <select
                                        value={selectedPerformerId}
                                        onChange={(e) => setSelectedPerformerId(e.target.value)}
                                        className="w-full text-xs font-bold p-2 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Sem profissional definido</option>
                                        {performers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                        ))}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingPerformer(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-600 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500">CANCELAR</button>
                                        <button onClick={handleSavePerformer} className="flex-1 py-2 bg-primary text-white rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 hover:bg-primary-dark">SALVAR</button>
                                    </div>
                                </div>
                            ) : localAppointment.performer ? (
                                <div
                                    className="flex items-center gap-4 bg-white dark:bg-gray-700/50 p-3 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden"
                                    style={{ borderLeft: `4px solid ${localAppointment.performer.color || '#3B82F6'}` }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl uppercase shadow-sm shrink-0"
                                        style={{ backgroundColor: localAppointment.performer.color || '#3B82F6' }}
                                    >
                                        {localAppointment.performer.name ? localAppointment.performer.name[0] : 'P'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-secondary dark:text-white truncate">{localAppointment.performer.name}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg inline-block mt-1">
                                            {localAppointment.performer.role}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={handleEditPerformer} className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 rounded-3xl text-center cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:border-primary/50 transition-all group">
                                    <p className="text-[10px] font-bold text-gray-400 group-hover:text-primary mb-1">Deseja atribuir alguém?</p>
                                    <p className="text-xs font-black text-gray-500 dark:text-gray-300 group-hover:text-primary">Selecionar Profissional</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Serviço */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            {localAppointment.category === 'LOGISTICA' ? <MapPin size={14} /> : <CheckCircle size={14} />}
                            {localAppointment.category === 'LOGISTICA' ? 'Serviços de Transporte' : `Serviços (${servicesList.length})`}
                        </h3>
                        <div className={`p-6 rounded-[32px] shadow-xl relative overflow-hidden group ${localAppointment.category === 'LOGISTICA' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-secondary dark:bg-gray-700 text-white shadow-secondary/20'}`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                {localAppointment.category === 'LOGISTICA' ? <MapPin size={80} /> : <Clock3 size={80} />}
                            </div>
                            <div className="space-y-1 mb-4">
                                {servicesList.length > 0 ? (
                                    servicesList.map((s: any, idx: number) => (
                                        <h4 key={idx} className="text-lg font-bold flex justify-between">
                                            <span>{s.name}</span>
                                            <span className="text-sm opacity-60 font-normal">R$ {s.basePrice}</span>
                                        </h4>
                                    ))
                                ) : (
                                    <h4 className="text-lg font-bold flex justify-between">
                                        <span>{localAppointment.category === 'LOGISTICA' ? 'Leva e Traz (Ver detalhes abaixo)' : 'Serviço sob consulta'}</span>
                                        <span className="text-sm opacity-60 font-normal">-</span>
                                    </h4>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <p className="text-white/60 text-xs">{totalDuration} min • Status: {localAppointment.status}</p>
                                <p className={localAppointment.category === 'LOGISTICA' ? 'text-2xl font-black text-white' : 'text-2xl font-black text-primary'}>
                                    R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transporte (Detalhes) */}
                    {localAppointment.transport && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Detalhes da Logística
                            </h3>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-[32px] border border-orange-100 dark:border-orange-500/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Origem</p>
                                        <p className="text-sm font-bold text-secondary dark:text-white leading-relaxed">{localAppointment.transport.origin}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Destino</p>
                                        <p className="text-sm font-bold text-secondary dark:text-white leading-relaxed">{localAppointment.transport.destination}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="inline-block bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-bold text-orange-600 border border-orange-100 dark:border-orange-500/30">
                                        Período: {localAppointment.transport.requestedPeriod === 'MORNING' ? 'Manhã' : localAppointment.transport.requestedPeriod === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                                    </div>
                                </div>

                                {/* Seção dos Motoristas por Perna */}
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-orange-500/10 shadow-sm">
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Motorista LEVA
                                        </p>
                                        <p className="text-xs font-black text-secondary dark:text-white">
                                            {localAppointment.pickupProvider?.name || localAppointment.performer?.name || 'Não definido'}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-orange-100 dark:border-orange-500/10 shadow-sm">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Motorista TRAZ
                                        </p>
                                        <p className="text-xs font-black text-secondary dark:text-white">
                                            {localAppointment.dropoffProvider?.name || localAppointment.performer?.name || 'Não definido'}
                                        </p>
                                    </div>
                                </div>

                                {/* Logistics Status Actions */}
                                {localAppointment.category === 'LOGISTICA' && (
                                    <div className="mt-6 pt-6 border-t border-orange-200/50">
                                        <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-4">Atualizar Status da Viagem</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Confirmar execução total da logística?')) {
                                                        try {
                                                            await api.patch(`/appointments/${localAppointment.id}/logistics-status`, { status: 'EXECUTED' });
                                                            toast.success('Logística concluída!');
                                                            refreshData();
                                                            onSuccess();
                                                        } catch (err) { toast.error('Erro ao atualizar'); }
                                                    }
                                                }}
                                                className="p-3 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-500/20"
                                            >
                                                Executado
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/appointments/${localAppointment.id}/logistics-status`, { status: 'DELAYED' });
                                                        toast.success('Status marcado como ATRASADO. Novo lembrete em 30min.');
                                                        refreshData();
                                                    } catch (err) { toast.error('Erro ao atualizar'); }
                                                }}
                                                className="p-3 bg-yellow-500 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
                                            >
                                                Atrasado
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('O veículo chegou a sair para o endereço? (Taxa de Largada será aplicada)')) {
                                                        try {
                                                            await api.patch(`/appointments/${localAppointment.id}/logistics-status`, { status: 'CANCELED_WITH_TRAVEL' });
                                                            toast.success('Cancelado com Viagem (Largada)');
                                                            refreshData();
                                                            onSuccess();
                                                        } catch (err) { toast.error('Erro ao atualizar'); }
                                                    }
                                                }}
                                                className="p-3 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                                            >
                                                Cancelado c/ Viagem
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Confirmar reagendamento da logística?')) {
                                                        try {
                                                            await api.patch(`/appointments/${localAppointment.id}/logistics-status`, { status: 'RESCHEDULE' });
                                                            toast.success('Marcado para reagendar.');
                                                            refreshData();
                                                        } catch (err) { toast.error('Erro ao atualizar'); }
                                                    }
                                                }}
                                                className="p-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                Reagendar
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Cancelar sem custo de deslocamento?')) {
                                                        try {
                                                            await api.patch(`/appointments/${localAppointment.id}/logistics-status`, { status: 'CANCELED_WITHOUT_TRAVEL' });
                                                            toast.success('Cancelado sem custo');
                                                            refreshData();
                                                            onSuccess();
                                                        } catch (err) { toast.error('Erro ao atualizar'); }
                                                    }
                                                }}
                                                className="p-3 bg-gray-500 text-white rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-500/20"
                                            >
                                                Cancelado s/ Viagem
                                            </button>
                                        </div>
                                        {localAppointment.logisticsStatus && (
                                            <div className="mt-4 p-3 bg-white/50 rounded-xl border border-orange-200/30 text-center">
                                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                                                    Status Atual: <span className="font-black underline">{localAppointment.logisticsStatus}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50 print:hidden">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-[20px] font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </motion.div >

            {/* Sub-modals for Payment */}
            {
                isPaymentModalOpen && (localAppointment.invoice || localAppointment.quote?.invoice) && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        invoice={localAppointment.invoice || localAppointment.quote?.invoice}
                        onSuccess={async (payment) => {
                            setLastPayment(payment);
                            setIsPaymentModalOpen(false);
                            setShowReceipt(true);
                            // Refresh to sync status
                            const res = await api.get(`/appointments/${localAppointment.id}`);
                            setLocalAppointment(res.data);
                            onSuccess();
                        }}
                    />
                )
            }

            <PaymentReceiptModal
                isOpen={showReceipt}
                onClose={() => setShowReceipt(false)}
                payment={lastPayment}
                customerName={localAppointment.customer.name}
            />
        </div >
    );
}
