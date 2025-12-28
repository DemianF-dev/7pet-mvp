import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Chrome, ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ClientLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;

            if (user.role !== 'CLIENTE') {
                throw new Error('Esta área é exclusiva para clientes.');
            }

            setAuth(user, token);
            navigate('/client/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Erro ao realizar login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-12 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <button
                    onClick={() => navigate('/client')}
                    className="flex items-center gap-2 text-gray-500 hover:text-secondary transition-colors mb-12 self-start"
                >
                    <ChevronLeft size={20} />
                    Voltar
                </button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-secondary mb-2">Login</h1>
                        <p className="text-gray-500">Acesse sua conta para gerenciar seus pets e agendamentos.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <button type="button" disabled className="btn-secondary w-full justify-center opacity-50 cursor-not-allowed">
                            <Chrome size={20} className="text-red-500" />
                            Continuar com Google (Em breve)
                        </button>

                        <div className="flex items-center gap-4 text-gray-300 py-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-sm font-medium text-gray-400">ou e-mail</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-semibold text-secondary">Senha</label>
                                    <button type="button" className="text-sm text-primary font-medium">Esqueci minha senha</button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field pl-12 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full mt-4 disabled:opacity-50"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'} <LogIn size={20} />
                        </button>

                        <p className="text-center text-gray-500 text-sm mt-6">
                            Ainda não tem conta? <span className="text-primary font-bold cursor-pointer underline underline-offset-4" onClick={() => navigate('/client')}>Crie uma agora</span>
                        </p>
                    </form>
                </div>
            </div>

            <div className="hidden lg:block flex-1 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-secondary/10"></div>
                <img
                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=2069"
                    alt="Login background"
                    className="w-full h-full object-cover mix-blend-overlay opacity-50"
                />
                <div className="absolute bottom-24 left-12 right-12 text-white space-y-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="text-white" size={32} />
                    </div>
                    <h2 className="text-4xl font-bold">Ambiente Seguro</h2>
                    <p className="text-white/80 text-lg max-w-md">
                        Seus dados e do seu pet estão protegidos conosco. Utilizamos criptografia de ponta para garantir sua privacidade.
                    </p>
                </div>
            </div>
        </div>
    );
}
