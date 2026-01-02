import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ChevronLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import LoadingButton from '../../components/LoadingButton';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ClientRegister() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validation
        if (!firstName.trim()) {
            setError('Por favor, preencha seu primeiro nome.');
            setIsLoading(false);
            return;
        }
        if (!lastName.trim()) {
            setError('Por favor, preencha seu sobrenome.');
            setIsLoading(false);
            return;
        }
        if (!email.trim()) {
            setError('Por favor, preencha seu e-mail.');
            setIsLoading(false);
            return;
        }
        if (!password || password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        console.log('[ClientRegister] Iniciando cadastro...');
        console.log('[ClientRegister] API URL:', import.meta.env.VITE_API_URL);

        try {
            console.log('[ClientRegister] Enviando dados:', { firstName, lastName, email, phone, role: 'CLIENTE' });
            const response = await api.post('/auth/register', {
                firstName,
                lastName,
                email,
                phone,
                password,
                role: 'CLIENTE'
            });

            console.log('[ClientRegister] Resposta recebida:', response.status);
            const { user, token } = response.data;

            console.log('[ClientRegister] Salvando autenticação...');
            setAuth(user, token);

            console.log('[ClientRegister] Redirecionando para dashboard...');
            navigate('/client/dashboard');
        } catch (err: any) {
            console.error('[ClientRegister] Erro capturado:', err);
            console.error('[ClientRegister] Erro response:', err.response);
            console.error('[ClientRegister] Erro message:', err.message);

            if (!err.response) {
                setError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
            } else if (err.response.status === 400) {
                setError(err.response.data?.error || 'Dados inválidos. Verifique as informações e tente novamente.');
            } else if (err.response.status === 409 || err.response.data?.error?.includes('já existe')) {
                setError('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
            } else {
                setError(err.response?.data?.error || err.message || 'Erro ao realizar cadastro. Tente novamente.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-12 flex flex-col justify-center max-w-2xl mx-auto w-full">
                <button
                    onClick={() => navigate('/client')}
                    className="flex items-center gap-2 text-gray-500 hover:text-secondary transition-colors mb-8 self-start"
                >
                    <ChevronLeft size={20} />
                    Voltar
                </button>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-secondary mb-2">Criar conta</h1>
                        <p className="text-gray-500">Junte-se ao 7Pet e dê ao seu pet o cuidado que ele merece.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 italic">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary ml-1">Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            required
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="Nome"
                                            className="input-field pl-12"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-secondary ml-1">Sobrenome</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Sobrenome"
                                        className="input-field"
                                    />
                                </div>
                            </div>

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
                                <label className="text-sm font-semibold text-secondary ml-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                                        BR
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
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

                        <LoadingButton
                            type="submit"
                            isLoading={isLoading}
                            loadingText="Criando conta..."
                            className="w-full mt-4"
                            rightIcon={<UserPlus size={20} />}
                        >
                            Criar minha conta
                        </LoadingButton>

                        <p className="text-center text-gray-500 text-sm mt-6">
                            Já tem uma conta? <span className="text-primary font-bold cursor-pointer underline underline-offset-4" onClick={() => navigate('/client/login')}>Entre aqui</span>
                        </p>
                    </form>
                </div>
            </div>

            <div className="hidden lg:block flex-1 bg-secondary relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10"></div>
                <img
                    src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=2071"
                    alt="Register background"
                    className="w-full h-full object-cover mix-blend-overlay opacity-40"
                />
                <div className="absolute bottom-24 left-12 right-12 text-white space-y-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <ShieldCheck className="text-primary" size={32} />
                    </div>
                    <h2 className="text-4xl font-bold">Quase lá!</h2>
                    <p className="text-white/80 text-lg max-w-md">
                        Ao se cadastrar, você terá acesso total ao nosso SPA, histórico de serviços e agendamento inteligente para o seu pet.
                    </p>
                </div>
            </div>
        </div>
    );
}
