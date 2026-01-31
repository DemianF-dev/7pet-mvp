import { useState, useEffect } from 'react';
import { Truck, MapPin, Navigation, Clock, CheckCircle2, Phone, User, RefreshCw, ChevronLeft, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import api from '../../services/api';
import { Card, Badge, IconButton, Button, GlassSurface } from '../../components/ui';
import QueryState from '../../components/system/QueryState';
import { useNavigate } from 'react-router-dom';
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

import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileTransport } from './transport/MobileTransport';

export default function TransportManager() {
    const { isMobile } = useIsMobile();

    if (isMobile) {
        return <MobileTransport />;
    }

    const navigate = useNavigate();
    const [transports, setTransports] = useState<Transport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');
    const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);

    // Selection states
    const [contactChoice, setContactChoice] = useState<{ phone: string; name: string } | null>(null);
    const [navigationChoice, setNavigationChoice] = useState<{ address: string } | null>(null);

    const fetchTransports = async () => {
        setIsLoading(true);
        setError(null);
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
            setError('Não foi possível carregar os transportes.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransports();
    }, [activeTab]);

    const cleanPhone = (phone: string) => {
        if (!phone) return '';
        // Add country code if missing (assuming BR +55)
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11 || cleaned.length === 10) {
            cleaned = '55' + cleaned;
        }
        return cleaned;
    };

    const handleWhatsApp = (phone: string, business = false) => {
        const cleaned = cleanPhone(phone);
        const url = business
            ? `https://api.whatsapp.com/send?phone=${cleaned}`
            : `https://wa.me/${cleaned}`;
        window.open(url, '_blank');
        setContactChoice(null);
    };

    const handleNavigation = (address: string, provider: 'google' | 'waze' | 'apple') => {
        const encoded = encodeURIComponent(address);
        let url = '';
        switch (provider) {
            case 'google':
                url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
                break;
            case 'waze':
                url = `https://waze.com/ul?q=${encoded}&navigate=yes`;
                break;
            case 'apple':
                url = `https://maps.apple.com/?daddr=${encoded}`;
                break;
        }
        window.open(url, '_blank');
        setNavigationChoice(null);
    };

    return (
        <main className="p-[var(--space-6)] md:p-[var(--space-10)] bg-[var(--color-bg-primary)] min-h-screen">
            <header className="mb-[var(--space-10)] flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-[var(--space-4)]">
                        <IconButton
                            icon={ChevronLeft}
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            aria-label="Voltar"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] tracking-tight">
                        Logística & <span className="text-[var(--color-accent-primary)]">Transporte</span>
                    </h1>
                    <p className="text-[var(--color-text-tertiary)] mt-3 text-lg font-medium">
                        Organize as rotas de busca e entrega dos pets.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <IconButton
                        icon={RefreshCw}
                        onClick={fetchTransports}
                        variant="secondary"
                        className={isLoading ? 'animate-spin' : ''}
                        aria-label="Atualizar Transportes"
                    />
                </div>
            </header>

            {/* CONTROL CENTER STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <GlassSurface className="p-6 flex items-center gap-4 border-l-4 border-blue-500">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Truck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Total Hoje</p>
                        <h4 className="text-2xl font-black text-[var(--color-text-primary)]">{transports.length}</h4>
                    </div>
                </GlassSurface>
                <GlassSurface className="p-6 flex items-center gap-4 border-l-4 border-amber-500">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Em Andamento</p>
                        <h4 className="text-2xl font-black text-[var(--color-text-primary)]">
                            {transports.filter(t => t.status === 'INICIADO').length}
                        </h4>
                    </div>
                </GlassSurface>
                <GlassSurface className="p-6 flex items-center gap-4 border-l-4 border-emerald-500">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Finalizados</p>
                        <h4 className="text-2xl font-black text-[var(--color-text-primary)]">
                            {activeTab === 'historico' ? transports.length : '...'}
                        </h4>
                    </div>
                </GlassSurface>
                <GlassSurface className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-primary-alpha)] flex items-center justify-center text-[var(--color-accent-primary)]">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Motoristas</p>
                        <h4 className="text-2xl font-black text-[var(--color-text-primary)]">Ativos</h4>
                    </div>
                </GlassSurface>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-8 bg-[var(--color-fill-secondary)] p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('ativos')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ativos'
                        ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)] shadow-sm'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                >
                    Rotas Ativas
                </button>
                <button
                    onClick={() => setActiveTab('historico')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'historico'
                        ? 'bg-[var(--color-bg-surface)] text-[var(--color-accent-primary)] shadow-sm'
                        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                >
                    Histórico
                </button>
            </div>

            <QueryState
                isLoading={isLoading}
                error={error}
                isEmpty={transports.length === 0}
                onRetry={fetchTransports}
            >
                <div className="grid grid-cols-1 gap-6">
                    {transports.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-0 overflow-hidden flex flex-col md:flex-row hover:shadow-[var(--shadow-lg)] transition-all">
                                <div className="flex-1 p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-[var(--color-accent-primary-alpha)] rounded-[var(--radius-xl)] flex items-center justify-center text-[var(--color-accent-primary)]">
                                            <Truck size={28} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-tight">
                                                {item.appointment.pet.name}
                                            </h3>
                                            <button
                                                onClick={() => setContactChoice({ phone: item.appointment.customer.phone, name: item.appointment.customer.name })}
                                                className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] font-[var(--font-weight-bold)] uppercase tracking-widest mt-0.5 transition-colors group"
                                            >
                                                <User size={12} strokeWidth={2.5} />
                                                <span className="border-b border-transparent group-hover:border-[var(--color-accent-primary)]">
                                                    {item.appointment.customer.name}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setNavigationChoice({ address: item.origin })}
                                            className="flex items-start gap-4 bg-[var(--color-fill-secondary)] p-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-surface)] transition-all text-left group"
                                        >
                                            <MapPin className="text-red-500 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                                            <div>
                                                <p className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Origem</p>
                                                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-accent-primary)] transition-colors">{item.origin}</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setNavigationChoice({ address: item.destination })}
                                            className="flex items-start gap-4 bg-[var(--color-fill-secondary)] p-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-surface)] transition-all text-left group"
                                        >
                                            <Navigation className="text-blue-500 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" size={20} />
                                            <div>
                                                <p className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">Destino</p>
                                                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-accent-primary)] transition-colors">{item.destination}</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="md:w-80 bg-[var(--color-fill-tertiary)]/30 backdrop-blur-sm p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--color-border-subtle)]">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Período</span>
                                            <Badge variant="neutral" className="text-[var(--color-accent-primary)] font-[var(--font-weight-black)] uppercase px-4">
                                                {item.requestedPeriod}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3 text-[var(--color-text-primary)] font-bold">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center shadow-sm border border-[var(--color-border-subtle)]">
                                                    <Clock size={16} className="text-[var(--color-text-tertiary)]" />
                                                </div>
                                                <span className="text-lg">{new Date(item.appointment.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <button
                                                onClick={() => setContactChoice({ phone: item.appointment.customer.phone, name: item.appointment.customer.name })}
                                                className="flex items-center gap-3 text-[var(--color-text-primary)] font-bold hover:text-[var(--color-accent-primary)] transition-colors group"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center shadow-sm border border-[var(--color-border-subtle)] group-hover:border-[var(--color-accent-primary)] transition-all">
                                                    <Phone size={16} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-primary)]" />
                                                </div>
                                                <span className="text-base">{item.appointment.customer.phone || 'N/A'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {item.status !== 'INICIADO' && item.status !== 'CONCLUIDO' && (
                                            <Button
                                                onClick={async () => {
                                                    const toastId = toast.loading('Iniciando transporte...');
                                                    try {
                                                        await api.patch(`/staff/transports/${item.id}/status`, {
                                                            status: 'INICIADO',
                                                            description: 'Motorista iniciou o deslocamento'
                                                        });
                                                        toast.success('Transporte iniciado!', { id: toastId });
                                                        fetchTransports();
                                                    } catch (err) {
                                                        toast.error('Erro ao iniciar', { id: toastId });
                                                    }
                                                }}
                                                variant="secondary"
                                                className="w-full h-12 font-black tracking-widest text-[10px] uppercase"
                                            >
                                                INICIAR SERVIÇO
                                            </Button>
                                        )}

                                        {item.status === 'INICIADO' && (
                                            <Button
                                                onClick={async () => {
                                                    if (window.confirm('Deseja realmente finalizar esta rota?')) {
                                                        const toastId = toast.loading('Finalizando rota...');
                                                        try {
                                                            await api.patch(`/staff/transports/${item.id}/status`, { status: 'CONCLUIDO' });
                                                            toast.success('Rota finalizada!', { id: toastId });
                                                            fetchTransports();
                                                        } catch (err: any) {
                                                            toast.error('Erro ao finalizar', { id: toastId });
                                                        }
                                                    }
                                                }}
                                                variant="primary"
                                                className="w-full h-14 font-black tracking-widest text-xs uppercase"
                                                icon={CheckCircle2}
                                            >
                                                FINALIZAR ROTA
                                            </Button>
                                        )}

                                        <button
                                            onClick={() => setSelectedTransport(item)}
                                            className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest hover:text-[var(--color-accent-primary)] transition-colors mt-2"
                                        >
                                            Ver Linha do Tempo
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </QueryState>

            {/* SELECTION MODALS */}
            <AnimatePresence>
                {contactChoice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setContactChoice(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[var(--color-bg-surface)] w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-[var(--color-accent-primary-alpha)] text-[var(--color-accent-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare size={32} />
                                </div>
                                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Contatar {contactChoice.name}</h3>
                                <p className="text-sm text-[var(--color-text-tertiary)] font-medium mb-8">Escolha como deseja abrir o WhatsApp:</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleWhatsApp(contactChoice.phone, false)}
                                        className="w-full h-14 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        WhatsApp Normal
                                    </button>
                                    <button
                                        onClick={() => handleWhatsApp(contactChoice.phone, true)}
                                        className="w-full h-14 bg-[#128C7E] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#128C7E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        WhatsApp Business
                                    </button>
                                    <button
                                        onClick={() => setContactChoice(null)}
                                        className="w-full h-14 bg-[var(--color-fill-secondary)] text-[var(--color-text-primary)] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[var(--color-fill-primary)] transition-all mt-4"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {navigationChoice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setNavigationChoice(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[var(--color-bg-surface)] w-full max-w-sm rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Navigation size={32} />
                                </div>
                                <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-2">Iniciar Navegação</h3>
                                <p className="text-sm text-[var(--color-text-tertiary)] font-medium mb-8">Escolha seu aplicativo de GPS favorito:</p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleNavigation(navigationChoice.address, 'google')}
                                        className="w-full h-14 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black uppercase text-xs tracking-widest shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        <img src="https://www.google.com/images/branding/product/ico/maps15_64dp.ico" alt="" className="w-5 h-5 rounded-md" />
                                        Google Maps
                                    </button>
                                    <button
                                        onClick={() => handleNavigation(navigationChoice.address, 'waze')}
                                        className="w-full h-14 bg-[#33CCFF] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#33CCFF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        <img src="https://static.waze.com/web/brand/dist/images/favicon.ico" alt="" className="w-5 h-5" />
                                        Waze
                                    </button>
                                    <button
                                        onClick={() => handleNavigation(navigationChoice.address, 'apple')}
                                        className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                    >
                                        Apple Maps
                                    </button>
                                    <button
                                        onClick={() => setNavigationChoice(null)}
                                        className="w-full h-14 bg-[var(--color-fill-secondary)] text-[var(--color-text-primary)] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[var(--color-fill-primary)] transition-all mt-4"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {selectedTransport && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedTransport(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                            className="bg-[var(--color-bg-surface)] w-full max-w-md h-[80vh] rounded-[32px] shadow-2xl relative z-10 flex flex-col overflow-hidden"
                        >
                            <header className="p-8 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-[var(--color-text-primary)]">Linha do Tempo</h3>
                                    <p className="text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest mt-1">
                                        Transporte #{selectedTransport.id.slice(0, 8)}
                                    </p>
                                </div>
                                <IconButton icon={X} onClick={() => setSelectedTransport(null)} variant="secondary" aria-label="Fechar" />
                            </header>

                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="relative pl-8 space-y-8 border-l-2 border-[var(--color-fill-secondary)]">
                                    {selectedTransport.occurrences?.map((occ, idx) => (
                                        <div key={occ.id} className="relative">
                                            <div
                                                className={`absolute -left-[41px] w-4 h-4 rounded-full border-4 border-[var(--color-bg-surface)] ${idx === 0
                                                    ? 'bg-[var(--color-accent-primary)] ring-4 ring-[var(--color-accent-primary-alpha)]'
                                                    : 'bg-[var(--color-fill-tertiary)]'
                                                    }`}
                                            />
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">
                                                    {new Date(occ.timestamp).toLocaleString('pt-BR')}
                                                </span>
                                                <h4 className="text-sm font-black text-[var(--color-text-primary)] uppercase tracking-tight">
                                                    {occ.occurrenceType}
                                                </h4>
                                                <p className="text-sm text-[var(--color-text-tertiary)] font-medium leading-relaxed">
                                                    {occ.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedTransport.occurrences || selectedTransport.occurrences.length === 0) && (
                                        <div className="text-center py-10">
                                            <p className="text-sm text-[var(--color-text-tertiary)] font-bold">
                                                Nenhuma ocorrência registrada ainda.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom safe area for mobile */}
            <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
    );
}
