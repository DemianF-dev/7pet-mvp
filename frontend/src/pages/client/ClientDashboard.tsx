import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import {
    User,
    Calendar,
    MapPin,
    FileText,
    CreditCard,
    Plus,
    Bell,
    Search,
    Dog,
    Star,
    MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import Skeleton from '../../components/Skeleton';
import { SpotlightCard } from '../../components/ui/SpotlightCard';
import DashboardGreeting from '../../components/DashboardGreeting';

// Lazy load ClientTutorial to improve initial load time
const ClientTutorial = React.lazy(() => import('../../components/client/ClientTutorial').catch(() => ({ default: () => null })));

interface DashboardData {
    petCount: number;
    nextAppointment: any;
    recentQuotes: any[];
}

const fetchClientDashboardData = async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard/client');
    return response.data;
};

export default function ClientDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['client-dashboard'],
        queryFn: fetchClientDashboardData,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        retry: 1, // Only retry once on failure
        refetchOnWindowFocus: false, // Don't refetch on window focus to improve performance
    });

    const quickActions = [
        { title: 'Meus Dados', icon: <User className="text-secondary" />, desc: 'Editar perfil e preferências', color: 'bg-gray-100', link: '/client/profile' },
        { title: 'Fale com a Equipe', icon: <MessageCircle className="text-blue-500" />, desc: 'Tire dúvidas e suporte', color: 'bg-blue-50', link: '/client/chat', badge: 'Novo' },
        { title: 'Agendar Serviço', icon: <Calendar className="text-primary" />, desc: 'Banho, tosa e spa', color: 'bg-primary-light', link: '/client/schedule' },
        { title: 'Agendar Transporte', icon: <MapPin className="text-blue-500" />, desc: 'Táxi Dog (Busca e Leva)', color: 'bg-blue-50', link: '/client/schedule' },
        { title: 'Meus Pets', icon: <Dog className="text-orange-500" />, desc: 'Gerencie seus melhores amigos', color: 'bg-orange-50', link: '/client/pets', badge: data?.petCount ? `${data.petCount} Cadastrados` : 'Nenhum' },
        { title: 'Solicitar Orçamento', icon: <FileText className="text-purple-500" />, desc: 'Novo pedido personalizado', color: 'bg-purple-50', link: '/client/quotes', badge: data?.recentQuotes?.length ? `${data.recentQuotes.length} Pedidos` : undefined },
        { title: 'Pagamentos', icon: <CreditCard className="text-emerald-500" />, desc: 'Histórico de faturas', color: 'bg-emerald-50', link: '/client/payments', badge: 'Em dia' },
    ];

    const nextAppt = data?.nextAppointment;

    const handleReferral = () => {
        const message = encodeURIComponent("Olá! Estou indicando a 7Pet para você conhecer. O atendimento lá é sensacional! Agende um serviço e ganhe 10% de desconto na sua primeira visita. Confira em: https://7pet.com.br");
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const handleGoogleReview = () => {
        window.open('https://g.page/r/CcoLpnRsAxgLEBM/review', '_blank');
    };

    // Show error state if data fails to load
    if (error && !isLoading) {
        console.error('Dashboard error:', error);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar o dashboard</h2>
                    <p className="text-gray-700 mb-6">Não foi possível carregar as informações do seu painel. Por favor, tente novamente mais tarde.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Recarregar Página
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <Suspense fallback={
                <div className="w-full flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <ClientTutorial />
            </Suspense>

            <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">
                <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
                    <div>
                        <DashboardGreeting
                            name={user?.customer?.name || user?.email || 'Visitante'}
                            subtitle={nextAppt
                                ? `Você tem um agendamento para o ${nextAppt?.pet?.name || 'pet'} no dia ${nextAppt?.startAt ? new Date(nextAppt.startAt).toLocaleDateString('pt-BR') : ''}.`
                                : 'Como podemos ajudar o seu pet hoje? Gerencie agendamentos e serviços com facilidade.'
                            }
                            isClient={true}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden xl:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" placeholder="Buscar agendamento..." className="bg-white border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 w-64 shadow-sm" />
                        </div>
                        <button
                            id="tour-notifications"
                            className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-secondary relative shadow-sm transition-all border border-gray-50"
                        >
                            <Bell size={20} />
                            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                        </button>
                        <div className="px-4 py-2 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-2 border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            LOJA ABERTA
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-44 bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <Skeleton variant="rounded" className="w-12 h-12" />
                                    <Skeleton variant="text" className="h-6 w-32" />
                                    <Skeleton variant="text" className="h-4 w-full opacity-50" />
                                </div>
                                <Skeleton variant="rounded" className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickActions.map((action, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ y: -5 }}
                                className="h-full"
                            >
                                <SpotlightCard
                                    onClick={() => navigate(action.link)}
                                    className="p-5 flex flex-col justify-between hover:border-primary/30 cursor-pointer group h-full text-left"
                                    spotlightColor="rgba(var(--color-primary-rgb), 0.15)"
                                >
                                    <div className="w-full">
                                        <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                            {action.icon}
                                        </div>
                                        <div className="flex justify-between items-start w-full">
                                            <h3 className="text-lg font-bold text-secondary">{action.title}</h3>
                                            {action.badge && (
                                                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md ${action.title === 'Pagamentos' || action.title === 'Meus Pets' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {action.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
                                    </div>
                                    <div
                                        className="mt-4 text-xs font-bold text-secondary group-hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        {action.title === 'Agendar Serviço' ? 'Agendar Agora' : action.title === 'Agendar Transporte' ? 'Solicitar Transporte' : 'Gerenciar'}
                                        <Plus size={16} />
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ))}
                    </div>
                )}

                <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Banner Indicação */}
                    <div className="bg-secondary rounded-[32px] p-6 relative overflow-hidden group shadow-2xl shadow-secondary/20 border border-white/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                                    <MessageCircle size={14} className="text-primary" />
                                    <span className="text-primary font-black text-[9px] uppercase tracking-widest">Indicação</span>
                                </span>
                                <h2 className="text-2xl font-black text-white leading-tight">Ganhe 10% OFF a cada amigo indicado!</h2>
                                <p className="text-gray-400 max-w-sm text-xs font-medium">Envie um convite agora pelo WhatsApp. Quanto mais indicar, mais descontos acumulados você ganha.</p>
                            </div>
                            <button
                                onClick={handleReferral}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 px-6 rounded-xl transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest text-[10px]"
                            >
                                <MessageCircle size={20} />
                                Indicar pelo WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Banner Google Review */}
                    <div className="bg-white rounded-[32px] p-6 relative overflow-hidden group shadow-xl border-2 border-dashed border-gray-100 hover:border-primary/20 transition-all">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                            <div className="space-y-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 rounded-full border border-yellow-200">
                                    <Star size={14} className="text-yellow-600 fill-yellow-600" />
                                    <span className="text-yellow-700 font-black text-[9px] uppercase tracking-widest">Avaliação Google</span>
                                </span>
                                <h2 className="text-2xl font-black text-secondary leading-tight">Ganhe 10% OFF ao nos avaliar!</h2>
                                <p className="text-gray-500 max-w-sm text-xs font-medium">Sua opinião é fundamental. Avalie nossos serviços uma única vez e ganhe um desconto especial imediato.</p>
                            </div>
                            <button
                                onClick={handleGoogleReview}
                                className="w-full bg-secondary hover:bg-secondary/90 text-white font-black py-4 px-6 rounded-xl transition-all shadow-xl shadow-secondary/20 active:scale-95 flex items-center justify-center gap-4 uppercase tracking-widest text-[10px]"
                            >
                                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                                Avaliar no Google
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
