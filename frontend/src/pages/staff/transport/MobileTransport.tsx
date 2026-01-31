import { useState, useEffect } from 'react';
import {
    Truck, MapPin, Navigation, Clock,
    CheckCircle2, Phone, MessageSquare,
    ChevronRight, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../../layouts/MobileShell';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Occurrence {
    id: string;
    occurrenceType: string;
    description: string;
    timestamp: string;
}

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
    occurrences?: Occurrence[];
}

export const MobileTransport = () => {
    const [transports, setTransports] = useState<Transport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');
    const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
    const [contactChoice, setContactChoice] = useState<{ phone: string; name: string } | null>(null);
    const [navigationChoice, setNavigationChoice] = useState<{ address: string } | null>(null);

    const fetchTransports = async () => {
        setIsLoading(true);
        try {
            const url = activeTab === 'ativos' ? '/staff/transports' : '/staff/transports?status=CONCLUIDO';
            const response = await api.get(url);

            if (activeTab === 'ativos') {
                const active = response.data.filter((t: any) => t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO');
                setTransports(active);
            } else {
                setTransports(response.data);
            }
        } catch (err) {
            console.error('Erro ao buscar transportes:', err);
            toast.error('Não foi possível carregar as rotas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransports();
    }, [activeTab]);

    const handleWhatsApp = (phone: string, business = false) => {
        const cleaned = phone.replace(/\D/g, '');
        const formatPhone = cleaned.length === 11 || cleaned.length === 10 ? '55' + cleaned : cleaned;
        const url = business
            ? `https://api.whatsapp.com/send?phone=${formatPhone}`
            : `https://wa.me/${formatPhone}`;
        window.open(url, '_blank');
        setContactChoice(null);
    };

    const handleNavigation = (address: string, provider: 'google' | 'waze') => {
        const encoded = encodeURIComponent(address);
        const url = provider === 'google'
            ? `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
            : `https://waze.com/ul?q=${encoded}&navigate=yes`;
        window.open(url, '_blank');
        setNavigationChoice(null);
    };

    const updateStatus = async (id: string, status: string, description?: string) => {
        const toastId = toast.loading('Atualizando...');
        try {
            await api.patch(`/staff/transports/${id}/status`, { status, description });
            toast.success(status === 'INICIADO' ? 'Transporte iniciado!' : 'Rota finalizada!', { id: toastId });
            fetchTransports();
        } catch (err) {
            toast.error('Erro ao atualizar', { id: toastId });
        }
    };

    return (
        <MobileShell title="Rotas & Logística">
            <div className="space-y-6 pb-20">
                {/* 1. Filter Tabs */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('ativos')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ativos' ? 'bg-white dark:bg-zinc-900 shadow-sm text-blue-600' : 'text-gray-400'
                            }`}
                    >
                        Rotas Ativas
                    </button>
                    <button
                        onClick={() => setActiveTab('historico')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'historico' ? 'bg-white dark:bg-zinc-900 shadow-sm text-blue-600' : 'text-gray-400'
                            }`}
                    >
                        Histórico
                    </button>
                </div>

                {/* 2. Routes List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : transports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Truck size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium uppercase tracking-widest">Nenhuma rota encontrada</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {transports.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mobile-card !p-0 overflow-hidden"
                                >
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                                                    <Truck size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none mb-1">
                                                        {item.appointment.pet.name}
                                                    </h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{item.appointment.customer.name}</p>
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.status === 'INICIADO' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'
                                                }`}>
                                                {item.status}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div
                                                onClick={() => setNavigationChoice({ address: item.origin })}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl active:scale-[0.98] transition-transform"
                                            >
                                                <MapPin size={18} className="text-red-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Origem</span>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase">{item.origin}</p>
                                                </div>
                                                <Navigation size={14} className="text-gray-300" />
                                            </div>
                                            <div
                                                onClick={() => setNavigationChoice({ address: item.destination })}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl active:scale-[0.98] transition-transform"
                                            >
                                                <Navigation size={18} className="text-blue-500 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Destino</span>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase">{item.destination}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-300" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-1.5 uppercase">
                                                <Clock size={12} />
                                                {new Date(item.appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <button
                                                onClick={() => setSelectedTransport(item)}
                                                className="uppercase text-blue-600 font-black tracking-widest"
                                            >
                                                Linha do Tempo
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {activeTab === 'ativos' && (
                                        <div className="flex border-t border-gray-100 dark:border-zinc-800">
                                            <button
                                                onClick={() => setContactChoice({ phone: item.appointment.customer.phone, name: item.appointment.customer.name })}
                                                className="flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-600 tracking-widest border-r border-gray-100 dark:border-zinc-800"
                                            >
                                                <MessageSquare size={14} /> Contato
                                            </button>
                                            {item.status !== 'INICIADO' ? (
                                                <button
                                                    onClick={() => updateStatus(item.id, 'INICIADO', 'Motorista iniciou o deslocamento')}
                                                    className="flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-widest"
                                                >
                                                    <Navigation size={14} /> Iniciar Rota
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateStatus(item.id, 'CONCLUIDO')}
                                                    className="flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-emerald-600 tracking-widest"
                                                >
                                                    <CheckCircle2 size={14} /> Finalizar
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

            {/* Modals */}
            <AnimatePresence>
                {navigationChoice && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNavigationChoice(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-zinc-900 w-full rounded-t-[32px] p-6 relative z-10 max-w-lg">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Escolher GPS</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleNavigation(navigationChoice.address, 'google')} className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <img src="https://www.google.com/images/branding/product/ico/maps15_64dp.ico" className="w-6 h-6" alt="Maps" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-600">Google Maps</span>
                                </button>
                                <button onClick={() => handleNavigation(navigationChoice.address, 'waze')} className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
                                    <div className="w-12 h-12 bg-[#33CCFF] rounded-xl flex items-center justify-center shadow-sm">
                                        <img src="https://static.waze.com/web/brand/dist/images/favicon.ico" className="w-6 h-6" alt="Waze" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-gray-600">Waze</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {contactChoice && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setContactChoice(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-zinc-900 w-full rounded-t-[32px] p-6 relative z-10 max-w-lg">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Contatar Tutor</h3>
                            <div className="space-y-3">
                                <button onClick={() => handleWhatsApp(contactChoice.phone, false)} className="w-full h-14 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/20">
                                    <MessageSquare size={18} /> WhatsApp Normal
                                </button>
                                <button onClick={() => handleWhatsApp(contactChoice.phone, true)} className="w-full h-14 bg-[#128C7E] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-[#128C7E]/20">
                                    <Truck size={18} /> WhatsApp Business
                                </button>
                                <button onClick={() => setContactChoice(null)} className="w-full h-14 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {selectedTransport && (
                    <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-900 flex flex-col p-6 animate-in slide-in-from-right duration-300">
                        <header className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Linha do Tempo</h3>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Rota {selectedTransport.pet.name}</p>
                            </div>
                            <button onClick={() => setSelectedTransport(null)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </header>

                        <div className="flex-1 space-y-8 overflow-y-auto pl-4 border-l-2 border-gray-100 dark:border-zinc-800">
                            {selectedTransport.occurrences?.map((occ) => (
                                <div key={occ.id} className="relative">
                                    <div className="absolute -left-[27px] top-1 w-3 h-3 bg-blue-600 rounded-full ring-4 ring-white dark:ring-zinc-900" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        {new Date(occ.timestamp).toLocaleString('pt-BR')}
                                    </p>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-1">{occ.occurrenceType}</h4>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{occ.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </MobileShell>
    );
};
