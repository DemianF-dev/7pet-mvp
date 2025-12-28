import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';

const StaffProfile: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error('As senhas não coincidem');
        }

        setLoading(true);
        try {
            const updatePayload: any = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            };

            if (formData.password) {
                updatePayload.password = formData.password;
            }

            const response = await api.patch('/auth/me', updatePayload);
            updateUser(response.data);
            toast.success('Perfil atualizado com sucesso!', {
                icon: '✨'
            });
            // Clear password fields
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-slate-800">Meu Perfil</h1>
                <p className="text-slate-500">Gerencie suas informações pessoais e credenciais de acesso.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Side: Avatar and Status */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-1"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-indigo-50">
                            <User size={48} className="text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Colaborador'}</h2>
                        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
                            <ShieldCheck size={14} className="mr-1" />
                            {user?.role}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50 text-left">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4">Informações Rápidas</h3>
                            <div className="space-y-4">
                                <div className="flex items-center text-slate-600">
                                    <Mail size={18} className="mr-3 text-slate-400" />
                                    <span className="text-sm truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center text-slate-600">
                                    <Phone size={18} className="mr-3 text-slate-400" />
                                    <span className="text-sm">{user?.phone || 'Não informado'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800">Dados Pessoais</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="exemplo@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-sm font-medium text-slate-700">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Endereço</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Seu endereço completo"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="font-semibold text-slate-800">Segurança</h3>
                                <p className="text-xs text-slate-500 mt-1">Deixe em branco se não desejar alterar sua senha.</p>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nova Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="********"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="********"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                ) : (
                                    <Save size={20} className="mr-2" />
                                )}
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default StaffProfile;
