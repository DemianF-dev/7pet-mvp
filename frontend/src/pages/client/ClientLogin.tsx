import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Fingerprint, Eye, EyeOff, ShieldCheck, ChevronLeft, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { AppImage, Input, Button, Divider, IconButton, GlassSurface } from '../../components/ui';


export default function ClientLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // Default: 30 days
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const loadingToast = toast.loading('Autenticando...');
            try {
                const response = await api.post('/auth/google', { idToken: tokenResponse.access_token });
                const { user, token } = response.data;
                setAuth(user, token);
                toast.success(`Bem-vindo, ${user.name}!`, { id: loadingToast });
                navigate('/client/dashboard');
            } catch (err: any) {
                toast.error(err.response?.data?.error || 'Erro ao entrar com Google', { id: loadingToast });
            }
        },
        onError: () => toast.error('Falha no login Google')
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
                throw new Error('Acesso exclusivo para clientes.');
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
            setError('Digite seu e-mail no campo acima.');
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
        <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center p-[var(--space-4)] sm:p-[var(--space-6)] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-[var(--color-accent-primary)]/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-success)]/10 blur-[100px] rounded-full" />

            {/* Main Contained Card */}
            <div className="bg-[var(--color-bg-surface)] w-full max-w-[1000px] h-full sm:h-[640px] rounded-[var(--radius-3xl)] shadow-[var(--shadow-2xl)] border border-[var(--color-border)] flex overflow-hidden relative z-10">

                {/* Form Section */}
                <div className="flex-1 flex flex-col p-[var(--space-8)] sm:p-[var(--space-12)] overflow-y-auto scrollbar-hide">
                    <button
                        onClick={() => navigate('/client')}
                        className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] transition-colors mb-8 self-start text-[var(--font-size-xs)] font-[var(--font-weight-bold)] uppercase tracking-wider"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                        VOLTAR
                    </button>

                    <div className="flex items-center gap-3 mb-10">
                        <AppImage src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
                        <div className="flex flex-col">
                            <span className="font-[var(--font-weight-black)] text-xl text-[var(--color-text-primary)] leading-none tracking-tight">7Pet</span>
                            <span className="text-[10px] text-[var(--color-text-tertiary)] font-[var(--font-weight-bold)] uppercase tracking-[0.2em] mt-0.5">Customer Care</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
                        <div className="mb-8">
                            <h1 className="text-3xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] mb-2 tracking-tight">Área do Tutor</h1>
                            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)]">Tudo o que seu melhor amigo precisa, em um só lugar.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-[var(--space-5)]">
                            {error && (
                                <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] p-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--font-size-sm)] font-[var(--font-weight-bold)] border border-[var(--color-error)]/20 animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] p-[var(--space-3)] rounded-[var(--radius-lg)] text-[var(--font-size-sm)] font-[var(--font-weight-bold)] border border-[var(--color-success)]/20 animate-in fade-in slide-in-from-top-1">
                                    {successMsg}
                                </div>
                            )}

                            <Input
                                label="E-MAIL"
                                placeholder="seu@email.com"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                variant="filled"
                            />

                            <div className="space-y-1">
                                <div className="relative">
                                    <Input
                                        label="SENHA"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        icon={Lock}
                                        variant="filled"
                                        className="pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-[38px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="flex justify-end items-center px-1">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[var(--font-size-xs)] text-[var(--color-accent-primary)] hover:opacity-80 font-[var(--font-weight-bold)] transition-colors"
                                    >
                                        ESQUECI MINHA SENHA
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                loading={isLoading}
                                fullWidth
                                size="lg"
                                className="h-14 shadow-[0_12px_24px_-8px_var(--color-accent-primary-alpha)]"
                                icon={LogIn}
                            >
                                ENTRAR AGORA
                            </Button>

                            <Divider label="OU" className="my-6" />

                            <Button
                                type="button"
                                variant="outline"
                                fullWidth
                                onClick={() => googleLogin()}
                                className="h-13 bg-transparent border-[var(--color-border-opaque)] font-[var(--font-weight-bold)]"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                ENTRAR COM GOOGLE
                            </Button>

                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 text-[var(--font-size-xs)] font-[var(--font-weight-bold)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors uppercase tracking-widest mt-4"
                            >
                                <Fingerprint size={16} />
                                ACESSO BIOMÉTRICO
                            </button>
                        </form>
                    </div>

                    <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
                        <p className="text-[var(--color-text-tertiary)] text-[var(--font-size-xs)] font-[var(--font-weight-bold)]">© 2025 7PET SYSTEMS</p>
                        <button
                            onClick={() => navigate('/client')}
                            className="text-[var(--font-size-xs)] font-[var(--font-weight-bold)] text-[var(--color-accent-primary)] hover:underline tracking-tight"
                        >
                            AINDA NÃO TEM CONTA? CADASTRE-SE
                        </button>
                    </div>
                </div>

                {/* Contained Image Section */}
                <div className="hidden lg:block w-[45%] h-full relative bg-[var(--color-accent-primary)] overflow-hidden border-l border-[var(--color-border)]">
                    <AppImage
                        src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=2069"
                        alt="Client Login Background"
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                        aspectRatio="45/100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent-primary)]/40 to-transparent backdrop-blur-[1px]"></div>

                    <div className="absolute bottom-12 left-12 right-12">
                        <GlassSurface intensity="heavy" className="p-8 border-white/20 text-white shadow-3xl">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-[var(--radius-lg)] flex items-center justify-center border border-white/20">
                                    <Heart size={24} className="text-white fill-white/20" />
                                </div>
                                <h2 className="text-2xl xl:text-3xl font-[var(--font-weight-black)] leading-tight tracking-tight">O melhor para quem você ama.</h2>
                                <p className="text-white/80 text-[var(--font-size-body)] font-[var(--font-weight-medium)] leading-relaxed">
                                    Acompanhe a rotina, serviços e saúde do seu pet em tempo real, com total segurança e transparência.
                                </p>
                            </div>
                        </GlassSurface>
                    </div>
                </div>
            </div>
        </div>
    );
}
