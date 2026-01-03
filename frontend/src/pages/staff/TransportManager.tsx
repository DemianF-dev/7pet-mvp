import { useState, useEffect } from 'react';
import { Truck, MapPin, Navigation, Clock, CheckCircle2, Phone, User, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';

interface Transport {
    id: string;
    origin: string;
    destination: string;
    requestedPeriod: string;
    status: string;
    appointment: {
        startAt: string;
        pet: { name: string };
        customer: { name: string; phone: string };
    };
}

export default function TransportManager() {
    const [transports, setTransports] = useState<Transport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransports = async () => {
        try {
            const response = await api.get('/staff/transports');
            setTransports(response.data);
        } catch (err) {
            console.error('Erro ao buscar transportes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransports();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">Logística & <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Transporte</span></h1>
                        <p className="text-gray-500 mt-3">Organize as rotas de busca e entrega dos pets.</p>
                    </div>
                    <button
                        onClick={fetchTransports}
                        disabled={isLoading}
                        className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 shadow-sm hover:text-primary hover:border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Atualizar Transportes"
                    >
                        <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </header>

                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {transports.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 hover:border-primary/20 transition-all"
                            >
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-secondary">{item.appointment.pet.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                <User size={12} />
                                                {item.appointment.customer.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                                            <MapPin className="text-red-400 mt-1" size={18} />
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Origem</p>
                                                <p className="text-sm font-medium text-secondary">{item.origin}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                                            <Navigation className="text-blue-400 mt-1" size={18} />
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Destino</p>
                                                <p className="text-sm font-medium text-secondary">{item.destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Período</span>
                                            <span className="bg-primary-light text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">
                                                {item.requestedPeriod}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                                                <Clock size={16} className="text-gray-300" />
                                                {new Date(item.appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                                                <Phone size={16} className="text-gray-300" />
                                                {item.appointment.customer.phone || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Deseja realmente finalizar esta rota?')) {
                                                try {
                                                    await api.patch(`/staff/transports/${item.id}/status`, { status: 'CONCLUIDO' });
                                                    fetchTransports();
                                                } catch (err) {
                                                    alert('Erro ao finalizar rota');
                                                }
                                            }
                                        }}
                                        className="mt-6 w-full py-3 bg-secondary text-white rounded-2xl text-xs font-bold hover:bg-secondary-dark transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Finalizar Rota
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {transports.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-gray-100 italic text-gray-400">
                                Nenhum transporte solicitado para os próximos dias.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
