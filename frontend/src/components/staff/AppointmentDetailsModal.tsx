import {
    X, User, Dog, Calendar, Clock, MapPin,
    CheckCircle, Clock3, Printer, Send,
    Edit, Trash2, Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment: any;
    onModify: (appt: any) => void;
    onCopy: (appt: any) => void;
}

export default function AppointmentDetailsModal({ isOpen, onClose, onSuccess, appointment, onModify, onCopy }: ModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

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
                        <h2 className="text-2xl font-bold text-secondary">Detalhes do <span className="text-primary">Agendamento</span></h2>
                        <div className="mt-2 flex items-center gap-2">
                            <select
                                value={appointment.status}
                                onChange={(e) => {
                                    if (window.confirm(`Deseja alterar o status para ${e.target.value}?`)) {
                                        api.patch(`/appointments/${appointment.id}/status`, { status: e.target.value })
                                            .then(() => { onSuccess(); onClose(); })
                                            .catch(() => alert('Erro ao atualizar status'));
                                    }
                                }}
                                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 print:hidden">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                    {/* Infos Principais */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <Calendar className="text-primary mb-2" size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data</p>
                            <p className="text-sm font-bold text-secondary">{new Date(appointment.startAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                            <Clock className="text-primary mb-2" size={20} />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Horário</p>
                            <p className="text-sm font-bold text-secondary">{new Date(appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    {/* Cliente & Pet Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Cliente
                            </h3>
                            <div className="flex items-center gap-4 bg-white p-2 border border-gray-50 rounded-3xl">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl uppercase">
                                    {appointment.customer?.name ? appointment.customer.name[0] : '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-secondary">{appointment.customer?.name || 'Cliente'}</p>
                                    <p className="text-xs text-gray-400">{appointment.customer?.user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <Dog size={14} /> Pet
                            </h3>
                            <div className="flex items-center gap-4 bg-white p-2 border border-gray-50 rounded-3xl">
                                <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary border border-gray-100">
                                    <Dog size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-secondary">{appointment.pet?.name}</p>
                                    <p className="text-xs text-gray-400">{appointment.pet?.species} • {appointment.pet?.breed || 'SRD'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Serviço */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle size={14} /> Serviços ({servicesList.length})
                        </h3>
                        <div className="p-6 bg-secondary text-white rounded-[32px] shadow-xl shadow-secondary/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <Clock3 size={80} />
                            </div>
                            <div className="space-y-1 mb-4">
                                {servicesList.map((s: any, idx: number) => (
                                    <h4 key={idx} className="text-lg font-bold flex justify-between">
                                        <span>{s.name}</span>
                                        <span className="text-sm opacity-60 font-normal">R$ {s.basePrice}</span>
                                    </h4>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <p className="text-white/60 text-xs">{totalDuration} min • Status: {appointment.status}</p>
                                <p className="text-2xl font-black text-primary">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transporte */}
                    {appointment.transport && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={14} /> Logística
                            </h3>
                            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
                                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-2">Endereço</p>
                                <p className="text-sm font-bold text-secondary leading-relaxed">{appointment.transport.origin}</p>
                                <div className="mt-4 inline-block bg-white px-3 py-1 rounded-full text-[10px] font-bold text-orange-600 border border-orange-100">
                                    Período: {appointment.transport.requestedPeriod === 'MORNING' ? 'Manhã' : appointment.transport.requestedPeriod === 'AFTERNOON' ? 'Tarde' : 'Noite'}
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
