import { useState, useEffect } from 'react';
import { Calendar, Clock, Dog, MapPin, Tag, AlertCircle, History } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

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

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await api.get('/appointments');
                setAppointments(response.data);
            } catch (err) {
                console.error('Erro ao buscar agendamentos:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    const upcoming = appointments.filter(a => ['PENDENTE', 'CONFIRMADO', 'EM_ATENDIMENTO'].includes(a.status));
    const finished = appointments.filter(a => ['FINALIZADO', 'CANCELADO', 'NO_SHOW'].includes(a.status));

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
                                    {upcoming.map((appt) => (
                                        <motion.div
                                            key={appt.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary/20 transition-all"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-14 h-14 bg-primary-light rounded-2xl flex flex-col items-center justify-center text-primary">
                                                    <span className="text-[10px] font-bold uppercase leading-none mb-1">
                                                        {new Date(appt.startAt).toLocaleDateString('pt-BR', { month: 'short' })}
                                                    </span>
                                                    <span className="text-xl font-black leading-none">
                                                        {new Date(appt.startAt).getDate()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-secondary">
                                                        {appt.services.map(s => s.name).join(', ') || 'Nenhum serviço'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                                        <Dog size={14} />
                                                        <span>{appt.pet.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 md:gap-8 flex-1 md:justify-center">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Horário</p>
                                                    <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                        <Clock size={16} className="text-primary" />
                                                        {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                {appt.transport && (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Transporte</p>
                                                        <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                            <MapPin size={16} className="text-blue-500" />
                                                            {appt.transport.status}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Valor</p>
                                                    <div className="flex items-center gap-1.5 text-secondary font-bold">
                                                        <Tag size={16} className="text-emerald-500" />
                                                        R$ {appt.services.reduce((acc, s) => acc + s.basePrice, 0).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 min-w-[150px]">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border ${statusColors[appt.status]}`}>
                                                    {appt.status}
                                                </span>
                                                <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                                                    <AlertCircle size={20} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
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
                                                    {new Date(appt.startAt).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-secondary">
                                                    {appt.pet.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {appt.services.map(s => s.name).join(', ') || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold ${statusColors[appt.status]}`}>
                                                        {appt.status}
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
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
