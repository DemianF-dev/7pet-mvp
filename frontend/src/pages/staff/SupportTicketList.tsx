import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
    Activity,
    CheckCircle2,
    Clock,
    User,
    Calendar,
    ArrowRight,
    AlertTriangle
} from 'lucide-react';

import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Ticket {
    id: string;
    description: string;
    status: 'SOLICITADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
    createdAt: string;
    imageUrl?: string;
    user: {
        name: string;
        email: string;
    };
}

const statusConfig = {
    'SOLICITADO': { color: 'bg-orange-100 text-orange-600 border-orange-200', icon: AlertTriangle, label: 'Solicitado' },
    'EM_ANDAMENTO': { color: 'bg-blue-100 text-blue-600 border-blue-200', icon: Clock, label: 'Em Andamento' },
    'CONCLUIDO': { color: 'bg-green-100 text-green-600 border-green-200', icon: CheckCircle2, label: 'Concluído' }
};

export default function SupportTicketList() {
    const { user } = useAuthStore();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const response = await api.get('/support');
            setTickets(response.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Erro ao carregar chamados.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/support/${id}/status`, { status: newStatus });
            toast.success(`Status atualizado para ${newStatus}`);
            fetchTickets();
            if (selectedTicket) {
                setSelectedTicket({ ...selectedTicket, status: newStatus as any });
            }
        } catch (error) {
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredTickets = tickets.filter(t => filterStatus === 'ALL' || t.status === filterStatus);
    const isMaster = user?.role === 'MASTER';

    return (
        <main className="p-6 md:p-10">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-secondary uppercase tracking-tight">Chamados Técnicos</h1>
                <p className="text-gray-400 mt-2 font-medium">Gerencie e acompanhe solicitações de ajuste e bugs.</p>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {['ALL', 'SOLICITADO', 'EM_ANDAMENTO', 'CONCLUIDO'].map(st => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === st ? 'bg-secondary text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
                    >
                        {st === 'ALL' ? 'Todos' : statusConfig[st as keyof typeof statusConfig]?.label || st}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Activity className="animate-spin text-primary" /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredTickets.map(ticket => {
                        const StatusIcon = statusConfig[ticket.status].icon;
                        return (
                            <motion.div
                                key={ticket.id}
                                layoutId={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${statusConfig[ticket.status].color}`}>
                                        <StatusIcon size={12} />
                                        {statusConfig[ticket.status].label}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-secondary font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                    {ticket.description}
                                </h3>
                                <div className="flex justify-between items-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
                                    <span className="flex items-center gap-2 font-bold">
                                        <User size={14} /> {ticket.user.name}
                                    </span>
                                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                                </div>
                            </motion.div>
                        );
                    })}
                    {filteredTickets.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                            Nenhuma solicitação encontrada.
                        </div>
                    )}
                </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTicket(null)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            layoutId={selectedTicket.id}
                            className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 ${statusConfig[selectedTicket.status].color}`}>
                                            {statusConfig[selectedTicket.status].label}
                                        </span>
                                        <h2 className="text-2xl font-black text-secondary">Detalhes do Chamado</h2>
                                    </div>
                                    <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                        <ArrowRight size={24} className="rotate-180" />
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-3xl mb-6">
                                    <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {selectedTicket.description}
                                    </p>
                                </div>

                                {selectedTicket.imageUrl && (
                                    <div className="mb-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Anexo</p>
                                        <img src={selectedTicket.imageUrl} alt="Anexo" className="w-full rounded-2xl border border-gray-100 shadow-sm" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-6">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <User size={14} /> <span className="font-bold">{selectedTicket.user.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <Calendar size={14} /> <span className="font-bold">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer (Only for Master) */}
                            {isMaster && (
                                <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                                    {selectedTicket.status !== 'SOLICITADO' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Deseja realmente voltar o status para Solicitado?')) {
                                                    handleUpdateStatus(selectedTicket.id, 'SOLICITADO');
                                                }
                                            }}
                                            className="px-4 py-3 bg-white border border-orange-200 text-orange-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-orange-50 transition-colors"
                                        >
                                            Voltar p/ Solicitado
                                        </button>
                                    )}

                                    {selectedTicket.status !== 'EM_ANDAMENTO' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedTicket.id, 'EM_ANDAMENTO')}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                        >
                                            {selectedTicket.status === 'CONCLUIDO' ? 'Reabrir Chamado' : 'Iniciar Atendimento'}
                                        </button>
                                    )}

                                    {selectedTicket.status !== 'CONCLUIDO' && (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedTicket.id, 'CONCLUIDO')}
                                            className="px-6 py-3 bg-green-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                        >
                                            Concluir Chamado
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
