import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    User, Mail, Lock, Phone, MapPin, Save,
    ShieldCheck, Calendar, FileText, ClipboardList
} from 'lucide-react';
import BackButton from '../../components/BackButton';

const StaffProfile: React.FC = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        document: user?.document || '',
        birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        notes: user?.notes || '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                address: formData.address,
                document: formData.document,
                birthday: formData.birthday,
                notes: formData.notes
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
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <BackButton className="mb-4 md:mb-0 ml-[-1rem]" />
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                        Meu <span className="text-indigo-600">Perfil</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Gerencie suas informações pessoais e profissionais.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-white p-2 pr-6 rounded-2xl shadow-sm border border-slate-100"
                >
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                        {user?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-800 leading-none mb-1">{user?.name}</div>
                        <div className="flex items-center text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">
                            <ShieldCheck size={10} className="mr-1" />
                            {user?.role}
                        </div>
                    </div>
                </motion.div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Sections */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Data */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                                <ClipboardList size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 tracking-tight">Dados de Identificação</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Documento / CPF</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        name="document"
                                        value={formData.document}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={formData.birthday}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Registration */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-amber-500">
                                <Phone size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 tracking-tight">Contato e Localização</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="exemplo@7pet.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço de Residência</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="Rua, Número, Bairro, Cidade"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Notes */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-500">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 tracking-tight">Observações Adicionais</h3>
                        </div>
                        <div className="p-8">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full p-6 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 resize-none"
                                placeholder="Alguma informação importante sobre seu cadastro ou perfil profissional..."
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Right Side Sticky Column */}
                <div className="space-y-8">
                    {/* Security */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden sticky top-6"
                    >
                        <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-red-500">
                                <Lock size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 tracking-tight">Segurança</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-indigo-200 pl-3">
                                Preencha apenas se desejar alterar sua senha de acesso ao painel.
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Salvar Perfil</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Support card */}
                    <div className="bg-indigo-900 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-200 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                        <ShieldCheck className="text-white/20 mb-4" size={40} />
                        <h4 className="font-bold text-xl mb-2">Dúvidas?</h4>
                        <p className="text-indigo-100/70 text-sm leading-relaxed mb-6">
                            Se houver divergência em dados que você não pode alterar sozinho, contate o RH.
                        </p>
                        <a
                            href="https://wa.me/5511983966451"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 p-3 px-4 rounded-xl transition-colors"
                        >
                            Suporte Interno
                        </a>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default StaffProfile;

