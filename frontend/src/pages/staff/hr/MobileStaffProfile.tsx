import { useState } from 'react';
import {
    User, Mail, Lock, Phone, MapPin,
    Save, ShieldCheck, Fingerprint,
    Smartphone, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { MobileShell } from '../../../layouts/MobileShell';
import { DIVISION_LABELS, getDivisionBgClass, getDivisionTextClass } from '../../../constants/divisions';

export const MobileStaffProfile = () => {
    const { user, updateUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>('identificacao');

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
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
            const updatePayload: any = { ...formData };
            if (!formData.password) delete updatePayload.password;
            delete updatePayload.confirmPassword;

            const response = await api.patch('/auth/me', updatePayload);
            updateUser(response.data);
            toast.success('Perfil atualizado!');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileShell title="Meu Perfil">
            <form onSubmit={handleSubmit} className="space-y-6 pb-32">
                {/* 1. Profile Header Widget */}
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                        style={{ backgroundColor: formData.color }}
                    >
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">{user?.name}</h2>
                        <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getDivisionBgClass(user?.division || 'CLIENTE')} ${getDivisionTextClass(user?.division || 'CLIENTE')}`}>
                            <ShieldCheck size={10} className="mr-1" />
                            {DIVISION_LABELS[user?.division as keyof typeof DIVISION_LABELS] || user?.division}
                        </div>
                    </div>
                </div>

                {/* 2. Sections */}
                <div className="space-y-3">
                    <ProfileSection
                        title="Identificação"
                        icon={User}
                        isOpen={activeSection === 'identificacao'}
                        onToggle={() => setActiveSection(activeSection === 'identificacao' ? null : 'identificacao')}
                    >
                        <div className="space-y-4">
                            <InputField label="Nome" name="firstName" value={formData.firstName} onChange={handleChange} />
                            <InputField label="Sobrenome" name="lastName" value={formData.lastName} onChange={handleChange} />
                            <InputField label="CPF/Documento" name="document" value={formData.document} onChange={handleChange} />
                            <InputField label="Nascimento" name="birthday" type="date" value={formData.birthday} onChange={handleChange} />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cor na Agenda</label>
                                <input type="color" name="color" value={formData.color} onChange={handleChange as any} className="w-full h-12 rounded-xl cursor-pointer border-none p-0" />
                            </div>
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        title="Contato"
                        icon={Phone}
                        isOpen={activeSection === 'contato'}
                        onToggle={() => setActiveSection(activeSection === 'contato' ? null : 'contato')}
                    >
                        <div className="space-y-4">
                            <InputField label="E-mail" name="email" type="email" value={formData.email} onChange={handleChange} icon={Mail} />
                            <InputField label="WhatsApp" name="phone" value={formData.phone} onChange={handleChange} icon={Phone} />
                            <InputField label="Endereço" name="address" value={formData.address} onChange={handleChange} icon={MapPin} />
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        title="Segurança"
                        icon={Lock}
                        isOpen={activeSection === 'seguranca'}
                        onToggle={() => setActiveSection(activeSection === 'seguranca' ? null : 'seguranca')}
                    >
                        <div className="space-y-4">
                            <InputField label="Nova Senha" name="password" type="password" value={formData.password} onChange={handleChange} />
                            <InputField label="Confirmar" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-between border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="text-emerald-600" size={20} />
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase leading-none mb-0.5">Biometria</p>
                                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Windows Hello / FaceID</p>
                                    </div>
                                </div>
                                <button type="button" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">Ativar</button>
                            </div>
                        </div>
                    </ProfileSection>

                    <ProfileSection
                        title="App & Info"
                        icon={Smartphone}
                        isOpen={activeSection === 'app'}
                        onToggle={() => setActiveSection(activeSection === 'app' ? null : 'app')}
                    >
                        <div className="space-y-3">
                            <button type="button" className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                                <div className="flex items-center gap-3">
                                    <Download size={18} className="text-blue-600" />
                                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Instalar Mobile App</span>
                                </div>
                                <Smartphone size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </ProfileSection>
                </div>

                <div className="fixed bottom-24 left-6 right-6 z-40">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={20} /> Salvar Alterações</>}
                    </button>
                </div>
            </form>
        </MobileShell>
    );
};

const ProfileSection = ({ title, icon: Icon, children, isOpen, onToggle }: any) => (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        <button
            type="button"
            onClick={onToggle}
            className="w-full p-5 flex items-center justify-between bg-gray-50/30 dark:bg-zinc-900/30"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-blue-600">
                    <Icon size={16} />
                </div>
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{title}</span>
            </div>
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <Smartphone size={14} className="text-gray-300" />
            </motion.div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                >
                    <div className="p-5 border-t border-gray-50 dark:border-zinc-800">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const InputField = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />}
            <input
                {...props}
                className={`w-full bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all ${Icon ? 'pl-11' : 'px-4'}`}
            />
        </div>
    </div>
);
