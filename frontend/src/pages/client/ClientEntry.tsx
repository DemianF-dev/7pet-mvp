import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ClientEntry() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-6">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-500 hover:text-secondary transition-colors mb-12"
            >
                <ChevronLeft size={20} />
                Voltar para o início
            </button>

            <div className="max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-bold text-secondary mb-2">Área do Cliente</h1>
                <p className="text-gray-500 mb-12 max-w-lg">
                    Bem-vindo ao seu espaço exclusivo. Gerencie agendamentos de spa, acompanhe o transporte e atualize o perfil do seu pet em um só lugar.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Já sou cliente */}
                    <motion.div
                        whileHover={{ y: -8 }}
                        className="glass-card overflow-hidden group hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => navigate('/client/login')}
                    >
                        <div className="h-48 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1000"
                                alt="Client Access"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                <LogIn size={16} />
                                Acesso
                            </div>
                            <h2 className="text-2xl font-bold text-secondary">Já sou cliente</h2>
                            <p className="text-gray-500">
                                Acesse sua conta para ver o histórico de banhos, agendar novos serviços e gerenciar seus pets.
                            </p>
                            <button className="btn-secondary w-full">
                                Entrar <LogIn size={18} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Novo cadastro */}
                    <motion.div
                        whileHover={{ y: -8 }}
                        className="glass-card overflow-hidden group hover:border-primary/50 transition-all cursor-pointer"
                    >
                        <div className="h-48 overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1000"
                                alt="New Registration"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                                <UserPlus size={16} />
                                Novo Cadastro
                            </div>
                            <h2 className="text-2xl font-bold text-secondary">Quero me cadastrar</h2>
                            <p className="text-gray-500">
                                Ainda não tem conta? Crie seu perfil agora para começar a agendar serviços de spa e transporte.
                            </p>
                            <button
                                onClick={() => navigate('/client/register')}
                                className="btn-primary w-full shadow-lg shadow-primary/20"
                            >
                                Criar conta <UserPlus size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-12 text-center text-sm text-gray-500">
                    Precisa de ajuda? <span className="text-primary font-medium cursor-pointer">Fale com o suporte</span>
                </div>
            </div>
        </div>
    );
}
