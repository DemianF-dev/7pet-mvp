import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassCard } from '../ui/GlassCard';
import api from '../../services/api';
import { format } from 'date-fns';
import { Car, Scissors, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface Appointment {
    id: string;
    status: string;
    customer: { name: string };
    pet: { name: string; breed?: string };
    services: { name: string }[];
    transportDetails?: {
        type: string;
        status: string;
    };
    startAt: string;
}

export function LiveStatusBoard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['live-board'],
        queryFn: async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const response = await api.get('/appointments', {
                params: {
                    date: today,
                    limit: 100 // Fetch allow to sort on client
                }
            });
            return response.data.data as Appointment[];
        },
        refetchInterval: 30000 // Refresh every 30s
    });

    // Grouping Logic
    const columns = {
        transport: appointments?.filter(a =>
            (a.status === 'AGENDADO' || a.status === 'EM_ANDAMENTO') &&
            a.transportDetails &&
            a.transportDetails.status !== 'CONCLUIDO'
        ) || [],

        service: appointments?.filter(a =>
            a.status === 'EM_ANDAMENTO' &&
            (!a.transportDetails || a.transportDetails.status === 'CONCLUIDO')
        ) || [],

        waiting: appointments?.filter(a =>
            a.status === 'AGENDADO' &&
            (!a.transportDetails || a.transportDetails.status === 'PENDENTE')
        ) || [],

        ready: appointments?.filter(a => a.status === 'FINALIZADO') || []
    };

    const StatusColumn = ({ title, icon: Icon, items, color, bg }: any) => (
        <div className="flex-1 min-w-[200px]">
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-${color}-200 dark:border-${color}-900/30`}>
                <Icon size={16} className={`text-${color}-500`} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h3>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-600`}>
                    {items.length}
                </span>
            </div>

            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="h-24 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 font-medium">Vazio</span>
                    </div>
                ) : (
                    items.map((apt: Appointment) => (
                        <motion.div
                            layoutId={apt.id}
                            key={apt.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500`} />

                            <div className="pl-3">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                        {apt.pet.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {format(new Date(apt.startAt), 'HH:mm')}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 truncate mb-1.5">{apt.customer.name}</p>

                                <div className="flex flex-wrap gap-1">
                                    {apt.services.slice(0, 2).map((s, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-50 dark:bg-gray-700 rounded text-gray-500 border border-gray-100 dark:border-gray-600">
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );

    if (isLoading) return <div className="h-64 animate-pulse bg-gray-100 rounded-3xl" />;

    return (
        <GlassCard className="p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 ml-1">
                    <Clock size={18} className="text-[var(--color-accent-primary)]" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                        Quadro de Operações em Tempo Real
                    </h2>
                </div>
                <div className="text-xs font-mono text-gray-400">
                    Atualizado: {format(currentTime, 'HH:mm:ss')}
                </div>
            </div>

            <div className="flex gap-4 min-w-[800px]">
                <StatusColumn
                    title="Aguardando / Chegando"
                    icon={Clock}
                    items={columns.waiting}
                    color="gray"
                />
                <StatusColumn
                    title="Trânsito (Leva & Traz)"
                    icon={Car}
                    items={columns.transport}
                    color="blue"
                />
                <StatusColumn
                    title="Em Atendimento"
                    icon={Scissors}
                    items={columns.service}
                    color="purple"
                />
                <StatusColumn
                    title="Pronto / Finalizado"
                    icon={CheckCircle}
                    items={columns.ready}
                    color="emerald"
                />
            </div>
        </GlassCard>
    );
}
