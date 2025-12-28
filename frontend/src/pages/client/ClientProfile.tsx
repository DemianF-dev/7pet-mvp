import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ClientProfile() {
    const { user, setAuth, token } = useAuthStore();
    const [name, setName] = useState(user?.customer?.name || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                if (response.data.customer) {
                    setName(response.data.customer.name);
                    setPhone(response.data.customer.phone || '');
                    setAddress(response.data.customer.address || '');
                }
            } catch (error) {
                console.error('Erro ao buscar perfil:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            // This endpoint might need to be created or update existing customer
            // For now let's assume we have a PUT /customers/me or similar
            // If not, I'll need to create it. Let's check backend routes.
            await api.patch('/auth/me', { name, phone, address });

            // Update local state if needed
            if (user && token) {
                const updatedUser = {
                    ...user,
                    customer: {
                        ...user.customer,
                        name,
                        phone,
                        address
                    }
                };
                setAuth(updatedUser as any, token);
            }

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao salvar perfil' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-secondary">Meu <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Perfil</span></h1>
                    <p className="text-gray-500 mt-3">Mantenha seus dados atualizados para facilitar a comunicação e logística.</p>
                </header>

                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-8 shadow-sm"
                    >
                        <form onSubmit={handleSave} className="space-y-6">
                            {message && (
                                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                    <ShieldCheck size={18} />
                                    {message.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input-field pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail (Não editável)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200" size={18} />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="input-field pl-12 bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
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
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Endereço Principal</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Rua, Número, Bairro"
                                            className="input-field pl-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn-primary w-full md:w-auto px-10 py-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'} <Save size={20} />
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-blue-900 font-bold mb-1 text-sm">Privacidade em primeiro lugar</h3>
                            <p className="text-blue-700/70 text-xs leading-relaxed">
                                Utilizamos seus dados apenas para fins de agendamento e logística. Nunca compartilhamos suas informações com terceiros sem sua autorização explícita.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
