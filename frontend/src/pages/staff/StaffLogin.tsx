import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronLeft, Fingerprint, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { AppImage, Input, Button, Divider, GlassSurface } from '../../components/ui';


export default function StaffLogin() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe] = useState(true); // Default: 30 days - setRememberMe reserved for toggle UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Clear any stale error messages on component mount
    useEffect(() => {
        setError('');
        setSuccessMsg('');
    }, []);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const loadingToast = toast.loading('Verificando credenciais...');
            try {
                const response = await api.post('/auth/google', { idToken: tokenResponse.access_token });
                const { user, token } = response.data;
                const userRole = (user.role || '').toUpperCase().trim();
                const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL'];

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
            const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL'];

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
        <div className="min-h-screen w-full bg-[var(--color-bg-primary)] flex items-center justify-center p-[var(--space-4)] sm:p-[var(--space-6)] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-primary)]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-accent-secondary)]/10 blur-[120px] rounded-full" />

            {/* Main Contained Card */}
            <div className="bg-[var(--color-bg-surface)] w-full max-w-[1000px] h-full sm:h-[640px] rounded-[var(--radius-3xl)] shadow-[var(--shadow-2xl)] border border-[var(--color-border)] flex overflow-hidden relative z-10">

                {/* Form Section */}
                <div className="flex-1 flex flex-col p-[var(--space-8)] sm:p-[var(--space-12)] overflow-y-auto scrollbar-hide">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] transition-colors mb-8 self-start text-[var(--font-size-xs)] font-[var(--font-weight-bold)] uppercase tracking-wider"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                        PÁGINA INICIAL
                    </button>

                    <div className="flex items-center gap-3 mb-12">
                        <AppImage src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
                        <div className="flex flex-col">
                            <span className="font-[var(--font-weight-black)] text-xl text-[var(--color-text-primary)] leading-none tracking-tight">7Pet</span>
                            <span className="text-[10px] text-[var(--color-text-tertiary)] font-[var(--font-weight-bold)] uppercase tracking-[0.2em] mt-0.5">Systems</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
                        <div className="mb-8">
                            <h1 className="text-3xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] mb-2 tracking-tight">Portal do Parceiro</h1>
                            <p className="text-[var(--font-size-body)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)]">Acesso restrito para parceiros e equipe operacional.</p>
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
                                label="E-MAIL CORPORATIVO"
                                placeholder="nome@petshop.com"
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
                                        ESQUECEU A SENHA?
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                loading={isLoading}
                                fullWidth
                                size="lg"
                                className="h-14 shadow-[0_12px_24px_-8px_var(--color-accent-primary-alpha)]"
                            >
                                ACESSAR PAINEL
                            </Button>

                            <Divider label="OU CONTINUE COM" className="my-6" />

                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    fullWidth
                                    onClick={() => googleLogin()}
                                    className="h-13 bg-transparent border-[var(--color-border-opaque)]"
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    GOOGLE CORPORATIVO
                                </Button>
                            </div>

                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 text-[var(--font-size-xs)] font-[var(--font-weight-bold)] text-[var(--color-success)] hover:opacity-80 transition-opacity uppercase tracking-widest mt-4"
                            >
                                <Fingerprint size={16} />
                                ACESSO POR BIOMETRIA
                            </button>
                        </form>
                    </div>

                    <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex items-center justify-between opacity-50">
                        <p className="text-[var(--color-text-tertiary)] text-[var(--font-size-xs)] font-[var(--font-weight-bold)]">© 2025 7PET SYSTEMS</p>
                        <div className="flex items-center gap-1.5 grayscale">
                            <Shield size={14} />
                            <span className="text-[var(--font-size-xs)] font-[var(--font-weight-bold)]">SSL SECURE</span>
                        </div>
                    </div>
                </div>

                {/* Contained Image Section */}
                <div className="hidden lg:block w-[45%] h-full relative bg-[var(--color-fill-secondary)] border-l border-[var(--color-border)]">
                    <AppImage
                        src="https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=2000"
                        alt="Staff Admin"
                        className="w-full h-full object-cover"
                        aspectRatio="45/100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent-secondary)]/30 to-transparent backdrop-blur-[2px]"></div>

                    <div className="absolute bottom-8 left-8 right-8">
                        <GlassSurface intensity="heavy" className="p-6 border-white/10 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-[var(--radius-lg)] flex items-center justify-center backdrop-blur-md">
                                    <ShieldCheck size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-[var(--font-weight-bold)] mb-0.5">Ambiente Seguro</h3>
                                    <p className="text-white/70 text-[var(--font-size-sm)] leading-snug">Todas as ações são criptografadas e auditas em tempo real.</p>
                                </div>
                            </div>
                        </GlassSurface>
                    </div>
                </div>
            </div>
        </div>
    );
}
