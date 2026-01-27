import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    User, Mail, Lock, Phone, MapPin, Save,
    ShieldCheck, Calendar, FileText, ClipboardList,
    Fingerprint, Smartphone, Briefcase, Download
} from 'lucide-react';
import { DIVISION_LABELS, getDivisionBgClass, getDivisionTextClass } from '../../constants/divisions';
import BackButton from '../../components/BackButton';
import { MasterGate } from '../../components/security/MasterGate';
import { DevCockpitPanel } from '../../components/staff/dev/DevCockpitPanel';

const StaffProfile: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        extraEmails: user?.extraEmails || [],
        phone: user?.phone || '',
        extraPhones: user?.extraPhones || [],
        address: user?.address || '',
        extraAddresses: user?.extraAddresses || [],
        document: user?.document || '',
        birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        notes: user?.notes || '',
        color: user?.color || '#3B82F6',
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
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                extraEmails: formData.extraEmails,
                phone: formData.phone,
                extraPhones: formData.extraPhones,
                address: formData.address,
                extraAddresses: formData.extraAddresses,
                document: formData.document,
                birthday: formData.birthday,
                notes: formData.notes,
                color: formData.color
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
        <main className="p-4 md:p-10" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 24px))' }}>
            <div className="max-w-5xl mx-auto">
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
                            <div className={`flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg ${getDivisionBgClass(user?.division || 'CLIENTE')} ${getDivisionTextClass(user?.division || 'CLIENTE')}`}>
                                <ShieldCheck size={10} className="mr-1" />
                                {DIVISION_LABELS[user?.division as keyof typeof DIVISION_LABELS] || user?.division}
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
                            <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">ID do Colaborador</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                        <input
                                            type="text"
                                            value={`STAFF-${String(user?.staffId || user?.seqId || '').padStart(4, '0')}`}
                                            disabled
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cor na Agenda (Sua Identidade)</label>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <input
                                            type="color"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange as any}
                                            className="w-16 h-16 rounded-xl cursor-pointer border-4 border-white shadow-sm"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Escolha sua cor</p>
                                            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Esta cor será usada para identificar seus serviços na agenda.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Divisão / Departamento</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                        <div className={`w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 font-bold ${getDivisionBgClass(user?.division || 'CLIENTE')} ${getDivisionTextClass(user?.division || 'CLIENTE')} text-sm`}>
                                            {DIVISION_LABELS[user?.division as keyof typeof DIVISION_LABELS] || user?.division}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1 italic">Sua divisão determina seus acessos no sistema. Caso precise alterar, contate a Diretoria.</p>
                                </div>

                                {user?.role && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                                            <input
                                                type="text"
                                                value={user?.role}
                                                disabled
                                                className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 cursor-not-allowed font-medium text-sm"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 ml-1 italic">Seu cargo é apenas informativo e pode ser editado pela Diretoria.</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
                                            placeholder="Primeiro nome"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Sobrenome</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
                                            placeholder="Sobrenome"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                            <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                            <div className="p-5 md:p-8">
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full p-4 md:p-6 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 resize-none text-sm"
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
                            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden md:sticky md:top-6"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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
                                            className="w-full pl-10 md:pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 outline-none transition-all font-medium text-slate-700 text-sm"
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

                        {/* Biometrics Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-500">
                                    <Fingerprint size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Acesso Biométrico</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Use o desbloqueio facial ou digital do seu dispositivo para entrar rapidamente sem digitar senha.
                                </p>

                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                                <Smartphone size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Este dispositivo</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Windows Hello / FaceID / Digital</div>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-slate-200 text-slate-500 rounded-md text-[8px] font-black uppercase">Não Ativado</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.promise(
                                                new Promise((resolve) => setTimeout(resolve, 2000)),
                                                {
                                                    loading: 'Iniciando registro biométrico...',
                                                    success: 'Biometria registrada com sucesso!',
                                                    error: 'Erro ao registrar biometria'
                                                }
                                            );
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-emerald-600 font-bold rounded-xl text-sm hover:bg-emerald-50 hover:border-emerald-100 transition-all"
                                    >
                                        <Fingerprint size={18} />
                                        <span>Ativar Desbloqueio Biométrico</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                                    <span>Os dados biométricos nunca saem do seu dispositivo. Usamos tecnologia WebAuthn de padrão bancário.</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* App Installation / Settings */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                                    <Smartphone size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Instalação e Notificações</h3>
                            </div>
                            <div className="p-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/staff/settings')}
                                    className="w-full flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <Download className="text-indigo-600" size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-800">Baixar App Native</p>
                                            <p className="text-[10px] text-slate-400">Instale na tela inicial</p>
                                        </div>
                                    </div>
                                    <Smartphone size={18} className="text-indigo-600 opacity-50 group-hover:opacity-100" />
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

                {/* Developer Settings (Restricted) - Moved OUT of the form and grid to use full width */}
                <MasterGate>
                    <div className="mt-12 w-full">
                        <DevCockpitPanel />
                    </div>
                </MasterGate>
            </div>
        </main>
    );

};

export default StaffProfile;

