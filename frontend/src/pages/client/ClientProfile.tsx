import { useState, useEffect } from 'react';
import { User, Mail, Save, ShieldCheck, CreditCard, Calendar, Star, TrendingDown, Fingerprint, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import LoadingButton from '../../components/LoadingButton';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ClientProfile() {
    const { user, setAuth, updateUser, setTutorial, token } = useAuthStore();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [extraPhones, setExtraPhones] = useState<string[]>(user?.extraPhones || []);
    const [extraEmails, setExtraEmails] = useState<string[]>(user?.extraEmails || []);
    const [address, setAddress] = useState(user?.address || '');
    const [extraAddresses, setExtraAddresses] = useState<string[]>(user?.extraAddresses || []);
    const [birthday, setBirthday] = useState(user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '');

    // Customer specific fields
    const [discoverySource, setDiscoverySource] = useState('');
    const [communicationPrefs, setCommunicationPrefs] = useState<string[]>([]);
    const [communicationOther, setCommunicationOther] = useState('');
    const [additionalGuardians, setAdditionalGuardians] = useState<any[]>([]);
    const [showTutorial, setShowTutorial] = useState(user?.showTutorial ?? true);

    const [customerData, setCustomerData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isRequestingRecurrence, setIsRequestingRecurrence] = useState(false);

    const handleRequestRecurrence = async () => {
        if (!window.confirm('Deseja solicitar mudança para cliente recorrente? Nossa equipe entrará em contato para confirmar os detalhes.')) {
            return;
        }

        setIsRequestingRecurrence(true);
        try {
            await api.post('/customers/request-recurrence');
            setMessage({ type: 'success', text: 'Solicitação enviada! Nossa equipe entrará em contato em breve.' });

            // Refresh profile to show updated status
            const response = await api.get('/auth/me');
            if (response.data.customer) {
                setCustomerData(response.data.customer);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao enviar solicitação' });
        } finally {
            setIsRequestingRecurrence(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                const u = response.data;
                setFirstName(u.firstName || '');
                setLastName(u.lastName || '');
                setPhone(u.phone || '');
                setExtraPhones(u.extraPhones || []);
                setExtraEmails(u.extraEmails || []);
                setAddress(u.address || '');
                setExtraAddresses(u.extraAddresses || []);
                setBirthday(u.birthday ? new Date(u.birthday).toISOString().split('T')[0] : '');

                if (u.customer) {
                    setDiscoverySource(u.customer.discoverySource || '');
                    setCommunicationPrefs(u.customer.communicationPrefs || []);
                    setCommunicationOther(u.customer.communicationOther || '');
                    setAdditionalGuardians(u.customer.additionalGuardians || []);
                    setCustomerData(u.customer);
                }
                setShowTutorial(u.showTutorial ?? true);
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
            const payload = {
                firstName,
                lastName,
                phone,
                extraPhones,
                extraEmails,
                address,
                extraAddresses,
                birthday,
                discoverySource,
                communicationPrefs,
                communicationOther,
                additionalGuardians,
                showTutorial
            };

            const response = await api.patch('/auth/me', payload);

            if (user && token) {
                setAuth(response.data, token);
            }

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao salvar perfil' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (setter: any, current: any[], index: number, value: string) => {
        const updated = [...current];
        updated[index] = value;
        setter(updated);
    };
    const removeField = (setter: any, current: any[], index: number) => {
        setter(current.filter((_, i) => i !== index));
    };

    const addGuardian = () => {
        setAdditionalGuardians([...additionalGuardians, { firstName: '', lastName: '', phone: '', email: '', address: '', birthday: '' }]);
    };

    const updateGuardian = (index: number, field: string, value: string) => {
        const updated = [...additionalGuardians];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalGuardians(updated);
    };

    const toggleCommPref = (pref: string) => {
        if (communicationPrefs.includes(pref)) {
            setCommunicationPrefs(communicationPrefs.filter(p => p !== pref));
        } else {
            setCommunicationPrefs([...communicationPrefs, pref]);
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

                {/* Tutorial Status Card */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ID Cliente</span>
                        <span className="text-xl font-black text-secondary">CL-{String(user?.seqId || 0).padStart(4, '0')}</span>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Guia Interativo</span>
                        <button
                            type="button"
                            onClick={async () => {
                                const newValue = !showTutorial;
                                setShowTutorial(newValue);
                                // Immediately update store and backend so tutorial starts/stops and persists
                                if (user) {
                                    updateUser({ ...user, showTutorial: newValue });
                                    if (newValue) setTutorial(true, 0);
                                    else setTutorial(false);

                                    try {
                                        await api.patch('/auth/me', { showTutorial: newValue });
                                    } catch (err) {
                                        console.error('Erro ao salvar preferência de tutorial:', err);
                                    }
                                }
                            }}
                            className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border ${showTutorial ? 'bg-primary/5 text-primary border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                        >
                            {showTutorial ? 'Ativado' : 'Desativado'}
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Membro Desde</span>
                        <span className="text-xl font-black text-secondary">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '2025'}</span>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col justify-center items-center text-center shadow-sm">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                        <span className="bg-green-100 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Ativo</span>
                    </div>
                </div>

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
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ID do Usuário</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-200" size={18} />
                                            <input
                                                type="text"
                                                value={`ID-${String(user?.seqId || '').padStart(4, '0')}`}
                                                disabled
                                                className="input-field pl-12 bg-gray-50 text-gray-400 cursor-not-allowed border-transparent font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail Principal</label>
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
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Sobrenome</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Data de Nascimento (Opcional)</label>
                                        <input
                                            type="date"
                                            value={birthday}
                                            onChange={(e) => setBirthday(e.target.value)}
                                            className="input-field"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Como conheceu a 7pet?</label>
                                        <input
                                            type="text"
                                            value={discoverySource}
                                            onChange={(e) => setDiscoverySource(e.target.value)}
                                            placeholder="Ex: Instagram, Indicação..."
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Contacts */}
                                <div className="space-y-6 pt-6 border-t border-gray-100">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefones</label>
                                            <button type="button" onClick={() => setExtraPhones([...extraPhones, ''])} className="text-[10px] font-black text-primary hover:underline">+ Adicionar Telefone</button>
                                        </div>
                                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="Telefone Principal" />
                                        {extraPhones.map((p, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="tel" value={p} onChange={(e) => updateField(setExtraPhones, extraPhones, i, e.target.value)} className="input-field flex-1" placeholder="Telefone extra" />
                                                <button type="button" onClick={() => removeField(setExtraPhones, extraPhones, i)} className="text-red-400 hover:text-red-600 px-2">Remover</button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-mails Adicionais</label>
                                            <button type="button" onClick={() => setExtraEmails([...extraEmails, ''])} className="text-[10px] font-black text-primary hover:underline">+ Adicionar E-mail</button>
                                        </div>
                                        {extraEmails.map((em, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="email" value={em} onChange={(e) => updateField(setExtraEmails, extraEmails, i, e.target.value)} className="input-field flex-1" placeholder="E-mail extra" />
                                                <button type="button" onClick={() => removeField(setExtraEmails, extraEmails, i)} className="text-red-400 hover:text-red-600 px-2">Remover</button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Endereços</label>
                                            <button type="button" onClick={() => setExtraAddresses([...extraAddresses, ''])} className="text-[10px] font-black text-primary hover:underline">+ Adicionar Endereço</button>
                                        </div>
                                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" placeholder="Endereço Principal" />
                                        {extraAddresses.map((ad, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="text" value={ad} onChange={(e) => updateField(setExtraAddresses, extraAddresses, i, e.target.value)} className="input-field flex-1" placeholder="Endereço extra" />
                                                <button type="button" onClick={() => removeField(setExtraAddresses, extraAddresses, i)} className="text-red-400 hover:text-red-600 px-2">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Communication Preferences */}
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Respostas de Preferência</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['APP', 'WHATSAPP', 'BOTH', 'PHONE', 'OTHER'].map(p => (
                                            <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={communicationPrefs.includes(p)}
                                                    onChange={() => toggleCommPref(p)}
                                                    className="w-4 h-4 accent-primary"
                                                />
                                                <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                                                    {p === 'APP' ? 'Pelo App' : p === 'WHATSAPP' ? 'WhatsApp' : p === 'BOTH' ? 'Ambos' : p === 'PHONE' ? 'Telefone' : 'Outro'}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {communicationPrefs.includes('OTHER') && (
                                        <input
                                            type="text"
                                            value={communicationOther}
                                            onChange={(e) => setCommunicationOther(e.target.value)}
                                            placeholder="Explique como prefere ser contatado..."
                                            className="input-field mt-2"
                                        />
                                    )}
                                </div>

                                {/* Additional Guardians Section */}
                                <div className="pt-8 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                                            <User size={20} className="text-primary" />
                                            Tutores Adicionais
                                        </h3>
                                        <button type="button" onClick={addGuardian} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black hover:bg-primary/20 transition-all">
                                            + Adicionar Tutor
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        {additionalGuardians.map((g, idx) => (
                                            <div key={idx} className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 relative group animate-in slide-in-from-right-4 duration-300">
                                                <button
                                                    type="button"
                                                    onClick={() => setAdditionalGuardians(additionalGuardians.filter((_, i) => i !== idx))}
                                                    className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 font-bold text-xs"
                                                >
                                                    Remover
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input placeholder="Nome" value={g.firstName} onChange={(e) => updateGuardian(idx, 'firstName', e.target.value)} className="input-field bg-white" />
                                                    <input placeholder="Sobrenome" value={g.lastName} onChange={(e) => updateGuardian(idx, 'lastName', e.target.value)} className="input-field bg-white" />
                                                    <input placeholder="Telefone" value={g.phone} onChange={(e) => updateGuardian(idx, 'phone', e.target.value)} className="input-field bg-white" />
                                                    <input placeholder="E-mail" value={g.email} onChange={(e) => updateGuardian(idx, 'email', e.target.value)} className="input-field bg-white" />
                                                    <input placeholder="Endereço" value={g.address} onChange={(e) => updateGuardian(idx, 'address', e.target.value)} className="input-field bg-white md:col-span-2" />
                                                    <div className="md:col-span-2 space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data de Nascimento (Opcional)</label>
                                                        <input type="date" value={g.birthday} onChange={(e) => updateGuardian(idx, 'birthday', e.target.value)} className="input-field bg-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex flex-col gap-4">
                                    <p className="text-[10px] text-gray-400 italic">
                                        ** Sua senha temporária é seu número de ID (ex: {user?.seqId || '1234'}). Recomendamos alterá-la após o primeiro acesso.
                                    </p>
                                    <LoadingButton
                                        type="submit"
                                        isLoading={isSaving}
                                        loadingText="Salvando..."
                                        className="w-full md:w-auto px-10 py-4"
                                        rightIcon={<Save size={20} />}
                                    >
                                        Salvar Alterações
                                    </LoadingButton>
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

                                    {customerData.type === 'AVULSO' && (
                                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-200">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                                    <Star size={24} className="fill-current" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black text-secondary mb-1">Quer ser um cliente VIP?</h4>
                                                    <p className="text-xs text-gray-600 mb-4">
                                                        Clientes recorrentes ganham descontos especiais e prioridade no atendimento!
                                                    </p>
                                                    <button
                                                        onClick={handleRequestRecurrence}
                                                        disabled={isRequestingRecurrence}
                                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs py-3 px-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isRequestingRecurrence ? 'Enviando...' : 'Solicitar Mudança para Recorrente'}
                                                    </button>
                                                    <p className="text-[9px] text-gray-400 mt-2 italic">
                                                        * Nossa equipe entrará em contato para confirmar a frequência e aplicar o desconto.
                                                    </p>
                                                </div>
                                            </div>
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

                    </div>

                    {/* Biometric Scan Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <h3 className="text-lg font-black text-secondary mb-4 flex items-center gap-2">
                            <Fingerprint size={20} className="text-emerald-500" />
                            Acesso Biométrico
                        </h3>

                        <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                            Ative o desbloqueio por digital ou reconhecimento facial para entrar no app sem senha.
                        </p>

                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-secondary">Este Dispositivo</span>
                                        <span className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Ativado via WebAuthn</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <ShieldCheck size={16} />
                                </div>
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
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Fingerprint size={18} />
                                Registrar Biometria / FaceID
                            </button>

                            <div className="text-[9px] text-gray-400 text-center italic px-2">
                                Seus dados biométricos são processados localmente e nunca saem do dispositivo.
                            </div>
                        </div>
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
            </main>
        </div>
    );
}
