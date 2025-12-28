import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, ShieldCheck, CreditCard, Calendar, Star, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ClientProfile() {
    const { user, setAuth, token } = useAuthStore();
    const [name, setName] = useState(user?.customer?.name || '');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [customerData, setCustomerData] = useState<any>(null);
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
                    setCustomerData(response.data.customer);
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
            await api.patch('/auth/me', { name, phone, address });

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

                <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
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
                    </div>

                    <div className="space-y-6">
                        {/* Plan Details Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden relative group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Star size={100} />
                            </div>

                            <h3 className="text-lg font-black text-secondary mb-6 flex items-center gap-2">
                                <CreditCard size={20} className="text-primary" />
                                Meu Plano
                            </h3>

                            {customerData ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status da Conta</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${customerData.type === 'RECORRENTE' ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`}></div>
                                            <span className="font-bold text-secondary">{customerData.type === 'RECORRENTE' ? 'Cliente VIP / Recorrente' : 'Cliente Avulso'}</span>
                                        </div>
                                    </div>

                                    {customerData.type === 'RECORRENTE' && (
                                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Frequência</p>
                                            <div className="flex items-center gap-2 text-purple-700 font-bold">
                                                <Calendar size={16} />
                                                <span>{customerData.recurringFrequency || 'Não definida'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {customerData.discountPercentage > 0 && (
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Benefício Ativo</p>
                                            <div className="flex items-center gap-2 text-blue-700 font-black text-xl">
                                                <TrendingDown size={20} />
                                                <span>{customerData.discountPercentage}% OFF</span>
                                            </div>
                                            <p className="text-[9px] text-blue-500 mt-1">* Desconto aplicado automaticamente nos orçamentos.</p>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-400 italic text-center px-4">
                                        Os detalhes do plano são gerenciados pela nossa equipe operacional.
                                    </p>
                                </div>
                            ) : (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
                                    <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
                                </div>
                            )}
                        </motion.div>

                        <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-blue-900 font-bold mb-1 text-sm">Privacidade</h3>
                                <p className="text-blue-700/70 text-[10px] leading-relaxed">
                                    Seus dados são protegidos e utilizados apenas para agendamentos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
