import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function StaffLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const loadingToast = toast.loading('Verificando credenciais...');
            try {
                const response = await api.post('/auth/google', { idToken: tokenResponse.access_token });
                const { user, token } = response.data;
                const userRole = (user.role || '').toUpperCase().trim();
                const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA'];

                if (!staffRoles.includes(userRole)) {
                    throw new Error(`Área exclusiva para parceiros. Sua conta: ${userRole}`);
                }

                setAuth(user, token);
                toast.success(`Bem-vindo, ${user.name}!`, { id: loadingToast });
                navigate('/staff/dashboard');
            } catch (err: any) {
                toast.error(err.response?.data?.error || err.message || 'Erro no acesso Google', { id: loadingToast });
            }
        },
        onError: () => toast.error('Falha na autenticação')
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await api.post('/auth/login', { email, password, rememberMe });
            const { user, token } = response.data;
            const userRole = (user.role || '').toUpperCase().trim();
            const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA'];

            if (!staffRoles.includes(userRole)) {
                throw new Error('Acesso restrito a colaboradores.');
            }

            setAuth(user, token);
            navigate('/staff/dashboard');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || err.message || 'Erro ao realizar login';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Informe seu e-mail corporativo abaixo.');
            return;
        }
        setIsLoading(true);
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
        <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6">
            {/* Main Contained Card */}
            <div className="bg-white w-full max-w-[1000px] h-full max-h-[640px] rounded-[32px] shadow-2xl shadow-secondary/5 border border-gray-100 flex overflow-hidden">

                {/* Form Section */}
                <div className="flex-1 flex flex-col p-8 sm:p-12 overflow-y-auto scrollbar-hide">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-secondary transition-colors mb-8 self-start text-xs font-semibold"
                    >
                        <ChevronLeft size={16} />
                        PÁGINA INICIAL
                    </button>

                    <div className="flex items-center gap-2 mb-10">
                        <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" />
                        <span className="font-bold text-lg text-secondary">7Pet</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[340px] mx-auto w-full">
                        <div className="mb-6">
                            <h1 className="text-2xl font-black text-secondary mb-1">Área do Colaborador</h1>
                            <p className="text-xs text-gray-400 font-medium">Acesso restrito para parceiros e equipe.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs font-bold border border-green-100">
                                    {successMsg}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-secondary/60 ml-0.5">E-MAIL CORPORATIVO</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nome@petshop.com"
                                        className="w-full h-11 px-3 pl-10 text-sm rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-0.5">
                                    <label className="text-xs font-bold text-secondary/60">SENHA</label>
                                    <button type="button" onClick={handleForgotPassword} className="text-[10px] text-gray-400 hover:text-secondary font-bold transition-colors">
                                        ESQUECEU?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-11 px-3 pl-10 pr-10 text-sm rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all text-xs tracking-widest uppercase"
                            >
                                {isLoading ? 'CARREGANDO...' : 'ACESSAR PAINEL'}
                            </button>

                            <button
                                type="button"
                                onClick={() => googleLogin()}
                                className="w-full h-12 bg-white border border-gray-100 text-secondary font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all text-xs"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                GOOGLE CORPORATIVO
                            </button>

                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest mt-2"
                            >
                                <Fingerprint size={14} />
                                ACESSO BIOMÉTRICO
                            </button>
                        </form>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-gray-300 text-[9px] font-bold">© 2025 7PET SYSTEMS</p>
                        <ShieldCheck size={14} className="text-gray-200" />
                    </div>
                </div>

                {/* Contained Image Section - Igual ao estilo de Card da sua Ref */}
                <div className="hidden lg:block w-[45%] h-full relative bg-gray-50 border-l border-gray-100">
                    <img
                        src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=2000"
                        alt="Staff Admin"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-secondary/20 backdrop-blur-[1px]"></div>
                    <div className="absolute bottom-8 left-8 right-8 glass-card p-5 bg-black/40 text-white border-white/10 backdrop-blur-md rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">Ambiente Seguro</h3>
                                <p className="text-white/60 text-[10px] font-medium leading-tight">Suas ações são criptografadas e monitoradas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
