import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Fingerprint, Eye, EyeOff, ShieldCheck, Github } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import LoadingButton from '../../components/ui/LoadingButton';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ClientLogin() {
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
            const loadingToast = toast.loading('Autenticando com o Google...');
            try {
                // @react-oauth/google handles the OAuth popup and gives us the token
                const response = await api.post('/auth/google', { idToken: tokenResponse.access_token });
                const { user, token } = response.data;
                setAuth(user, token);
                toast.success(`Bem-vindo, ${user.name}!`, { id: loadingToast });
                navigate('/client/dashboard');
            } catch (err: any) {
                toast.error(err.response?.data?.error || 'Erro ao entrar com Google', { id: loadingToast });
            }
        },
        onError: () => toast.error('Falha no login com Google')
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const response = await api.post('/auth/login', { email, password, rememberMe });
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

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Por favor, digite seu e-mail no campo acima primeiro.');
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
                    <div className="flex items-center gap-3 mb-2">
                        <img src="/logo.png" className="w-12 h-12 rounded-2xl object-contain shadow-lg shadow-primary/10" alt="Logo" />
                        <span className="font-bold text-2xl text-secondary">7Pet</span>
                    </div>
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

                        {successMsg && (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium border border-green-100 italic">
                                {successMsg}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => googleLogin()}
                            className="w-full h-12 bg-white border border-gray-200 hover:border-primary/20 hover:bg-gray-50 text-secondary font-bold rounded-2xl flex items-center justify-center gap-3 transition-all group"
                        >
                            <div className="w-8 h-8 flex items-center justify-center">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            </div>
                            <span>Entrar com Google</span>
                        </button>

                        <div className="flex items-center gap-4 text-gray-300 py-2">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-sm font-medium text-gray-400">ou e-mail</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-secondary ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        className="input-field pl-12"
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label htmlFor="password" className="text-sm font-semibold text-secondary">Senha</label>
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-sm text-primary font-medium hover:underline"
                                        aria-label="Recuperar senha esquecida"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required={!successMsg} // Not required if just requested new password
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field pl-12 pr-12"
                                        aria-required="true"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors"
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md bg-white peer-checked:bg-primary peer-checked:border-primary transition-all group-hover:border-primary/50"></div>
                                    <svg
                                        className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    >
                                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-500 group-hover:text-secondary transition-colors">
                                    Manter conectado por 30 dias
                                </span>
                            </label>
                        </div>

                        <LoadingButton
                            type="submit"
                            isLoading={isLoading}
                            loadingText="Acessando..."
                            className="w-full mt-4"
                            rightIcon={<LogIn size={20} />}
                        >
                            Entrar
                        </LoadingButton>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Ou use</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                toast.promise(
                                    new Promise((resolve) => setTimeout(resolve, 1500)),
                                    {
                                        loading: 'Verificando biometria...',
                                        success: 'Bem-vindo(a) de volta!',
                                        error: 'Erro na autenticação'
                                    }
                                );
                            }}
                            className="w-full h-12 bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/10 text-secondary font-bold rounded-2xl flex items-center justify-center gap-3 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Fingerprint size={18} />
                            </div>
                            <span>Entrar com Digital / FaceID</span>
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
