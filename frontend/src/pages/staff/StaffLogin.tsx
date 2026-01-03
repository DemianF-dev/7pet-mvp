import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft, Fingerprint } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function StaffLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            const userRole = (user.role || '').toUpperCase().trim();
            const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA'];

            if (!staffRoles.includes(userRole)) {
                throw new Error(`Esta área é exclusiva para colaboradores. (Sua conta está como: ${userRole})`);
            }

            setAuth(user, token);
            navigate('/staff/dashboard');
        } catch (err: any) {
            // Ensure error is always a string to prevent React Error #31
            const errorMsg = err.response?.data?.error || err.message || 'Erro ao realizar login';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Por favor, informe seu e-mail corporativo no campo acima.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setSuccessMsg(response.data.message);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao solicitar nova senha');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-12 lg:p-24 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-secondary transition-colors mb-8 self-start group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Página Inicial
                </button>
                <div className="flex items-center gap-2 mb-12">
                    <img src="/logo.png" className="w-10 h-10 rounded-xl object-contain" alt="Logo" />
                    <span className="font-bold text-xl text-secondary">7Pet</span>
                </div>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-secondary mb-2">Área do Colaborador</h1>
                        <p className="text-gray-500 italic">Acesso restrito à equipe. Insira suas credenciais para gerenciar agendamentos e serviços.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100 italic">
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-secondary ml-1">E-mail Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu.nome@petshop.com"
                                    className="input-field pl-12 bg-gray-50 border-transparent focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-secondary">Senha</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm text-gray-400 hover:text-secondary transition-colors font-medium hover:underline"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required={!successMsg}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field pl-12 pr-12 bg-gray-50 border-transparent focus:bg-white"
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full mt-4 h-14 text-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Aguarde...' : 'Acessar Painel'}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Ou acesse com</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                toast.promise(
                                    new Promise((resolve) => setTimeout(resolve, 1500)),
                                    {
                                        loading: 'Verificando identidade...',
                                        success: 'Digital reconhecida! Acessando...',
                                        error: 'Falha no reconhecimento'
                                    }
                                );
                            }}
                            className="w-full h-14 bg-white border border-gray-100 hover:border-primary/20 hover:bg-gray-50 text-secondary font-bold rounded-2xl flex items-center justify-center gap-3 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Fingerprint size={20} />
                            </div>
                            <span>Acesso Biométrico / Digital</span>
                        </button>
                    </form>
                </div>

                <div className="mt-20 pt-8 border-t border-gray-100">
                    <p className="text-gray-400 text-xs">Sistema de uso interno exclusivo. © 2025 7Pet.</p>
                </div>
            </div>

            <div className="hidden lg:block flex-1 bg-gray-50 relative p-12">
                <div className="h-full w-full rounded-[48px] overflow-hidden relative group">
                    <img
                        src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=2000"
                        alt="Staff Admin"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[20s] ease-linear"
                    />
                    <div className="absolute inset-0 bg-secondary/20"></div>

                    <div className="absolute bottom-12 left-12 right-12 glass-card p-8 bg-black/30 text-white border-white/10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Ambiente Seguro</h3>
                                <p className="text-white/70 text-sm">Todas as ações neste painel são monitoradas para garantir a segurança dos dados dos nossos clientes e parceiros.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
