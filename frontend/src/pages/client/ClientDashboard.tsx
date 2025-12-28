import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    User,
    Calendar,
    MapPin,
    FileText,
    CreditCard,
    Plus,
    Bell,
    Search,
    Dog
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface DashboardData {
    petCount: number;
    nextAppointment: any;
    recentQuotes: any[];
}

export default function ClientDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/client');
                setData(response.data);
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const quickActions = [
        { title: 'Meus Dados', icon: <User className="text-secondary" />, desc: 'Editar perfil e preferências', color: 'bg-gray-100', link: '/client/profile' },
        { title: 'Agendar Serviço', icon: <Calendar className="text-primary" />, desc: 'Banho, tosa e spa', color: 'bg-primary-light', link: '/client/schedule' },
        { title: 'Agendar Transporte', icon: <MapPin className="text-blue-500" />, desc: 'Táxi Dog (Busca e Leva)', color: 'bg-blue-50', link: '/client/schedule' },
        { title: 'Meus Pets', icon: <Dog className="text-orange-500" />, desc: 'Gerencie seus melhores amigos', color: 'bg-orange-50', link: '/client/pets', badge: data?.petCount ? `${data.petCount} Cadastrados` : 'Nenhum' },
        { title: 'Solicitar Orçamento', icon: <FileText className="text-purple-500" />, desc: 'Novo pedido personalizado', color: 'bg-purple-50', link: '/client/quotes', badge: data?.recentQuotes?.length ? `${data.recentQuotes.length} Pedidos` : undefined },
        { title: 'Pagamentos', icon: <CreditCard className="text-emerald-500" />, desc: 'Histórico de faturas', color: 'bg-emerald-50', link: '/client/payments', badge: 'Em dia' },
    ];

    const nextAppt = data?.nextAppointment;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">Olá, <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">{(user?.customer?.name || user?.email || 'Visitante').split(' ')[0]}!</span></h1>
                        <p className="text-gray-500 mt-3">
                            {nextAppt
                                ? `Você tem um agendamento para o ${nextAppt.pet.name} no dia ${new Date(nextAppt.startAt).toLocaleDateString('pt-BR')}.`
                                : 'Como podemos ajudar o seu pet hoje? Gerencie agendamentos e serviços com facilidade.'
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden xl:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input type="text" placeholder="Buscar agendamento..." className="bg-white border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 w-64 shadow-sm" />
                        </div>
                        <button className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-secondary relative shadow-sm transition-all border border-gray-50">
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
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickActions.map((action, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                onClick={() => navigate(action.link)}
                                className="glass-card p-6 flex flex-col justify-between hover:border-primary/30 transition-all cursor-pointer group"
                            >
                                <div>
                                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        {action.icon}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-secondary">{action.title}</h3>
                                        {action.badge && (
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${action.title === 'Pagamentos' || action.title === 'Meus Pets' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {action.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm mt-1">{action.desc}</p>
                                </div>
                                <button
                                    className="mt-6 text-sm font-bold text-secondary group-hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    {action.title === 'Agendar Serviço' ? 'Agendar Agora' : action.title === 'Agendar Transporte' ? 'Solicitar Transporte' : 'Gerenciar'}
                                    <Plus size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}

                <section className="mt-10">
                    <div className="bg-secondary rounded-3xl p-8 relative overflow-hidden group shadow-2xl shadow-secondary/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-2">
                                <span className="text-primary font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    Clube de Vantagens
                                </span>
                                <h2 className="text-3xl font-bold text-white leading-tight">Ganhe 10% OFF no próximo banho!</h2>
                                <p className="text-gray-400 max-w-md">Indique um amigão para o nosso Pet Shop e ganhe descontos exclusivos na sua próxima visita.</p>
                            </div>
                            <button className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 whitespace-nowrap">
                                Indicar Amigo
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
