import {
    X, User, Dog, Calendar, Clock, MapPin,
    CheckCircle, Clock3, Printer, Send,
    Edit, Trash2, Copy, RefreshCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useState } from 'react';
import { getAppointmentStatusColor } from '../../utils/statusColors';
import toast from 'react-hot-toast';

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

    if (!isOpen || !appointment) return null;

    const handleDelete = async () => {
        const confirmed = window.confirm('Tem certeza que deseja excluir permanentemente este agendamento?');
        if (!confirmed) {
            onClose();
            return;
        }
        setIsDeleting(true);
        try {
            await api.delete(`/appointments/${appointment.id}`);
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
            onModify(appointment);
        } else {
            onClose();
        }
    };

    const handleCopyConfirm = () => {
        if (window.confirm('Deseja copiar este agendamento?')) {
            onCopy(appointment);
        } else {
            onClose();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendWhatsApp = () => {
        const serviceNames = appointment.services && appointment.services.length > 0
            ? appointment.services.map((s: any) => s.name).join(', ')
            : appointment.service?.name;

        const message = `Olá ${appointment.customer.name}! Confirmamos o agendamento de ${serviceNames} para o ${appointment.pet.name} no dia ${new Date(appointment.startAt).toLocaleDateString('pt-BR')} às ${new Date(appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Até breve!`;
        const url = `https://wa.me/${appointment.customer.phone || ''}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Calculate totals
    const servicesList = appointment.services || (appointment.service ? [appointment.service] : []);
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
                </div>

                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {appointment.category === 'LOGISTICA' ? (
                                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Transporte
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    SPA (Banho & Tosa)
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-secondary">
                            Detalhes do <span className={appointment.category === 'LOGISTICA' ? 'text-orange-500' : 'text-primary'}>
                                {appointment.category === 'LOGISTICA' ? 'Transporte' : 'Agendamento'}
                            </span>
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                            <select
                                value={appointment.status}
                                onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    if (nextStatus === 'CANCELADO' || nextStatus === 'NO_SHOW') {
                                        setRescheduleData({ active: true, targetStatus: nextStatus, newDate: '' });
                                    } else {
                                        if (window.confirm(`Deseja alterar o status para ${nextStatus}?`)) {
                                            api.patch(`/appointments/${appointment.id}/status`, { status: nextStatus })
                                                .then(() => { onSuccess(); onClose(); })
                                                .catch(() => toast.error('Erro ao atualizar status'));
                                        }
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm ${getAppointmentStatusColor(appointment.status)}`}
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
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-8 flex flex-col justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* ... (Reschedule UI same as before, no changes needed inside logic) ... */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-secondary">
                                    O que deseja fazer com este <span className="text-primary">Agendamento</span>?
                                </h3>
                                <button onClick={() => setRescheduleData({ active: false, targetStatus: '', newDate: '' })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>

                            {!rescheduleData.newDate ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/appointments/${appointment.id}/status`, { status: rescheduleData.targetStatus });
                                                toast.success('Status atualizado com sucesso');
                                                onSuccess();
                                                onClose();
                                            } catch (err) {
                                                toast.error('Erro ao atualizar status');
                                            }
                                        }}
                                        className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-3xl border border-gray-100 transition-all group"
                                    >
                                        <X size={32} className="text-gray-300 group-hover:text-red-500" />
                                        <span className="text-xs font-black uppercase tracking-widest">Apenas {rescheduleData.targetStatus === 'CANCELADO' ? 'Cancelar' : 'Marcar No-Show'}</span>
                                    </button>

                                    <button
                                        onClick={() => setRescheduleData({ ...rescheduleData, newDate: appointment.startAt.split('.')[0] })}
                                        className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-3xl border border-gray-100 transition-all group"
                                    >
                                        <RefreshCcw size={32} className="text-gray-300 group-hover:text-primary" />
                                        <span className="text-xs font-black uppercase tracking-widest">Reagendar para Outra Data</span>
                                    </button>
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
                                                className="w-full bg-white border-none rounded-xl pl-12 py-3 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setRescheduleData({ ...rescheduleData, newDate: '' })}
                                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                                        >
                                            Voltar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (rescheduleData.targetStatus === 'CANCELADO') {
                                                        // Transfer: Update current
                                                        await api.patch(`/appointments/${appointment.id}`, {
                                                            startAt: new Date(rescheduleData.newDate).toISOString(),
                                                            status: 'CONFIRMADO' // Reset to confirmed when transferred
                                                        });
                                                        toast.success('Agendamento transferido com sucesso');
                                                    } else {
                                                        // NO_SHOW: Copy as new, keep old as NO_SHOW
                                                        const { id, createdAt, services, customer, pet, performer, transport, ...copyData } = appointment;
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
                                                        await api.patch(`/appointments/${appointment.id}/status`, { status: 'NO_SHOW' });
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
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <Calendar className={appointment.category === 'LOGISTICA' ? 'text-orange-500 mb-2' : 'text-primary mb-2'} size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data</p>
                            <p className="text-sm font-bold text-secondary">{new Date(appointment.startAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <Clock className={appointment.category === 'LOGISTICA' ? 'text-orange-500 mb-2' : 'text-primary mb-2'} size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {appointment.category === 'LOGISTICA' ? 'Horário Previsto' : 'Horário'}
                            </p>
                            <p className="text-sm font-bold text-secondary">{new Date(appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Cliente & Pet & Performer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div
                                onClick={() => onOpenCustomer && onOpenCustomer(appointment.customer.id)}
                                className={`flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-3xl shadow-sm ${onOpenCustomer ? 'cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all' : ''}`}
                            >
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl uppercase">
                                    {appointment.customer?.name ? appointment.customer.name[0] : '?'}
                                </div>
                                <div className="overflow-hidden text-left">
                                    <p className="font-bold text-secondary truncate">{appointment.customer?.name || 'Cliente'}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{appointment.customer?.user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <Dog size={14} /> Pet
                            </h3>
                            <div className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-3xl shadow-sm">
                                <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary border border-gray-100">
                                    <Dog size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-secondary truncate">{appointment.pet?.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{appointment.pet?.species} • {appointment.pet?.breed || 'SRD'}</p>
                                </div>
                            </div>
                        </div>

                        {appointment.performer && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} /> Profissional
                                </h3>
                                <div
                                    className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
                                    style={{ borderLeft: `4px solid ${appointment.performer.color || '#3B82F6'}` }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl uppercase shadow-sm shrink-0"
                                        style={{ backgroundColor: appointment.performer.color || '#3B82F6' }}
                                    >
                                        {appointment.performer.name ? appointment.performer.name[0] : 'P'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-secondary truncate">{appointment.performer.name}</p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-1">
                                            {appointment.performer.role}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Serviço */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            {appointment.category === 'LOGISTICA' ? <MapPin size={14} /> : <CheckCircle size={14} />}
                            {appointment.category === 'LOGISTICA' ? 'Serviços de Transporte' : `Serviços (${servicesList.length})`}
                        </h3>
                        <div className={`p-6 rounded-[32px] shadow-xl relative overflow-hidden group ${appointment.category === 'LOGISTICA' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-secondary text-white shadow-secondary/20'}`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                {appointment.category === 'LOGISTICA' ? <MapPin size={80} /> : <Clock3 size={80} />}
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
                                        <span>{appointment.category === 'LOGISTICA' ? 'Leva e Traz (Ver detalhes abaixo)' : 'Serviço sob consulta'}</span>
                                        <span className="text-sm opacity-60 font-normal">-</span>
                                    </h4>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <p className="text-white/60 text-xs">{totalDuration} min • Status: {appointment.status}</p>
                                <p className={appointment.category === 'LOGISTICA' ? 'text-2xl font-black text-white' : 'text-2xl font-black text-primary'}>
                                    R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transporte (Detalhes) */}
                    {appointment.transport && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Detalhes da Logística
                            </h3>
                            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Origem</p>
                                        <p className="text-sm font-bold text-secondary leading-relaxed">{appointment.transport.origin}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Destino</p>
                                        <p className="text-sm font-bold text-secondary leading-relaxed">{appointment.transport.destination}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="inline-block bg-white px-3 py-1 rounded-full text-[10px] font-bold text-orange-600 border border-orange-100">
                                        Período: {appointment.transport.requestedPeriod === 'MORNING' ? 'Manhã' : appointment.transport.requestedPeriod === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-gray-50/50 print:hidden">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-200 text-gray-600 rounded-[20px] font-bold hover:bg-gray-300 transition-all"
                    >
                        Fechar Visualização
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
