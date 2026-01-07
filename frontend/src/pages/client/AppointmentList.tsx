import { useState, useEffect } from 'react';
import { Calendar, Clock, Dog, MapPin, Tag, MessageCircle, History } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';

interface Appointment {
    id: string;
    startAt: string;
    status: string;
    pet: { name: string; species: string };
    services: Array<{ name: string; basePrice: number }>;
    transport?: { origin: string; destination: string; status: string };
}

const statusColors: any = {
    'PENDENTE': 'bg-orange-100 text-orange-700 border-orange-200',
    'CONFIRMADO': 'bg-green-100 text-green-700 border-green-200',
    'EM_ATENDIMENTO': 'bg-blue-100 text-blue-700 border-blue-200',
    'FINALIZADO': 'bg-gray-100 text-gray-700 border-gray-200',
    'CANCELADO': 'bg-red-100 text-red-700 border-red-200',
    'NO_SHOW': 'bg-black text-white border-black'
};

export default function AppointmentList() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmAppointment, setConfirmAppointment] = useState<Appointment | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await api.get('/appointments');
                // Handle both paginated { data, meta } and direct array responses
                const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
                setAppointments(data);
            } catch (err) {
                console.error('Erro ao buscar agendamentos:', err);
                setAppointments([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const upcoming = appointments.filter(a => a && ['PENDENTE', 'CONFIRMADO', 'EM_ATENDIMENTO'].includes(a.status));
    const finished = appointments.filter(a => a && ['FINALIZADO', 'CANCELADO', 'NO_SHOW'].includes(a.status));

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <h1 className="text-4xl font-extrabold text-secondary">Meus <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Agendamentos</span></h1>
                    <p className="text-gray-500 mt-3">Acompanhe seus horários marcados e o histórico de atendimentos.</p>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Próximos Agendamentos */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="text-primary" size={20} />
                                <h2 className="text-xl font-bold text-secondary">Próximos Cuidados</h2>
                            </div>

                            {upcoming.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {upcoming.map((appt) => {
                                        const date = formatDate(appt.startAt);
                                        return (
                                            <motion.div
                                                key={appt.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary/20 transition-all"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-14 h-14 bg-primary-light rounded-2xl flex flex-col items-center justify-center text-primary shrink-0">
                                                        <span className="text-[10px] font-bold uppercase leading-none mb-1">
                                                            {date ? date.toLocaleDateString('pt-BR', { month: 'short' }) : '---'}
                                                        </span>
                                                        <span className="text-xl font-black leading-none">
                                                            {date ? date.getDate() : '--'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-secondary line-clamp-1">
                                                            {appt.services?.map(s => s.name).join(', ') || 'Sem serviços definidos'}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                                            <Dog size={14} />
                                                            <span>{appt.pet?.name || 'Pet não identificado'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4 md:gap-8 flex-1 md:justify-center">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Horário</p>
                                                        <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                            <Clock size={16} className="text-primary" />
                                                            {date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                        </div>
                                                    </div>
                                                    {appt.transport && (
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Transporte</p>
                                                            <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                                <MapPin size={16} className="text-blue-500" />
                                                                {appt.transport.status || 'Pendente'}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Valor Est.</p>
                                                        <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                            <Tag size={16} className="text-emerald-500" />
                                                            R$ {(appt.services?.reduce((acc, s) => acc + (s.basePrice || 0), 0) || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between md:justify-end gap-4 min-w-[200px]">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border ${statusColors[appt.status] || 'bg-gray-100'}`}>
                                                        {appt.status || 'DESCONHECIDO'}
                                                    </span>
                                                    <button
                                                        onClick={() => setConfirmAppointment(appt)}
                                                        className="flex items-center gap-2 px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors text-xs font-bold shadow-sm hover:shadow-md"
                                                        title="Solicitar alteração via WhatsApp"
                                                    >
                                                        <MessageCircle size={16} />
                                                        Alterar
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-400">Nenhum agendamento futuro encontrado.</p>
                                </div>
                            )}
                        </section>

                        {/* Histórico */}
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <History className="text-gray-400" size={20} />
                                <h2 className="text-xl font-bold text-secondary">Histórico</h2>
                            </div>

                            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pet</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Serviço</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {finished.map((appt) => (
                                                <tr key={appt.id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-secondary font-medium">
                                                        {formatDate(appt.startAt)?.toLocaleDateString('pt-BR') || '---'}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-secondary">
                                                        {appt.pet?.name || '---'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {appt.services?.map(s => s.name).join(', ') || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${statusColors[appt.status] || 'bg-gray-100'}`}>
                                                            {appt.status || '---'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {finished.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">
                                                        Nenhum histórico disponível.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={!!confirmAppointment}
                onClose={() => setConfirmAppointment(null)}
                onConfirm={() => {
                    if (!confirmAppointment) return;
                    const phone = '5511983966451';
                    const message = `Olá! Gostaria de solicitar alteração/cancelamento do meu agendamento:\n\n` +
                        `📋 ID: ${confirmAppointment.id}\n` +
                        `🐾 Pet: ${confirmAppointment.pet?.name || 'N/A'}\n` +
                        `📅 Data: ${formatDate(confirmAppointment.startAt)?.toLocaleDateString('pt-BR') || 'N/A'}\n` +
                        `🕐 Horário: ${formatDate(confirmAppointment.startAt)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'N/A'}\n` +
                        `💼 Serviços: ${confirmAppointment.services?.map(s => s.name).join(', ') || 'N/A'}`;
                    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }}
                title="Falar com Atendente?"
                description="Você será redirecionado para o WhatsApp para solicitar a alteração ou cancelamento deste agendamento diretamente com nossa equipe."
                confirmText="Ir para WhatsApp"
                confirmColor="bg-green-500"
            />

        </div>
    );
}
