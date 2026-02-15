import { useState, useEffect } from 'react';
import {
    Send,
    Users,
    User,
    Shield,
    Globe,
    Eye,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Type,
    FileText,
    Link as LinkIcon,
    Search,
    X,
    BellRing,
    Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { marketingService, BulkNotificationPayload } from '../../../services/marketingService';
import BackButton from '../../../components/BackButton';
import Breadcrumbs from '../../../components/staff/Breadcrumbs';
import api from '../../../services/api';

type TargetType = 'ALL' | 'CLIENTS' | 'ROLES' | 'USERS';

interface UserOption {
    id: string;
    name: string;
    email: string;
    role?: string;
    division: string;
}

export default function MarketingCenter() {
    const [step, setStep] = useState(1);
    const [isSending, setIsSending] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [targetType, setTargetType] = useState<TargetType>('ALL');
    const [targetRoles, setTargetRoles] = useState<string[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [priority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW'); // setPriority - reserved for priority selector

    // Search State
    const [userSearch, setUserSearch] = useState('');
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const loadRoles = async () => {
            try {
                const roles = await marketingService.getAvailableRoles();
                setAvailableRoles(roles);
            } catch (error) {
                console.error('Failed to load roles', error);
            }
        };
        loadRoles();
    }, []);

    useEffect(() => {
        if (targetType === 'USERS' && userSearch.length >= 3) {
            const searchUsers = async () => {
                setIsSearching(true);
                try {
                    const { data } = await api.get(`/staff/users?search=${userSearch}&limit=5`);
                    setUserOptions(data.filter((u: any) => !selectedUserIds.includes(u.id)));
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            };
            const timer = setTimeout(searchUsers, 500);
            return () => clearTimeout(timer);
        }
    }, [userSearch, targetType, selectedUserIds]);

    const handleSend = async () => {
        if (!title || !body) {
            toast.error('Preencha o título e a mensagem');
            return;
        }

        if (targetType === 'ROLES' && targetRoles.length === 0) {
            toast.error('Selecione ao menos um cargo');
            return;
        }

        if (targetType === 'USERS' && selectedUserIds.length === 0) {
            toast.error('Selecione ao menos um usuário');
            return;
        }

        // Final Confirmation
        const confirm = window.confirm(`Deseja realmente enviar esta mensagem para o grupo selecionado? Esta ação não pode ser desfeita.`);
        if (!confirm) return;

        setIsSending(true);
        const toastId = toast.loading('Despachando notificações...');

        try {
            const payload: BulkNotificationPayload = {
                targetType,
                targetRoles: targetType === 'ROLES' ? targetRoles : undefined,
                targetUserIds: targetType === 'USERS' ? selectedUserIds : undefined,
                title,
                body,
                url: url || undefined,
                priority
            };

            const result = await marketingService.sendBulkNotification(payload);
            toast.success(result.message || 'Envio concluído com sucesso!', { id: toastId });

            // Reset state
            setStep(1);
            setTitle('');
            setBody('');
            setUrl('');
            setTargetRoles([]);
            setSelectedUserIds([]);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Falha ao realizar envio em massa', { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    const toggleRole = (role: string) => {
        setTargetRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const addUser = (user: UserOption) => {
        setSelectedUserIds(prev => [...prev, user.id]);
        setUserSearch('');
        setUserOptions([]);
    };

    const removeUser = (userId: string) => {
        setSelectedUserIds(prev => prev.filter(id => id !== userId));
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] pb-20">
            <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        <div>
                            <Breadcrumbs />
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Central de Notificações</h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-2xl text-blue-600 text-xs font-bold border border-blue-500/20">
                        <BellRing size={16} /> Beta Marketing
                    </div>
                </div>

                {/* Progress Tracker */}
                <div className="flex items-center gap-2 px-2">
                    <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 3 ? 'bg-blue-500' : 'bg-[var(--color-border)]'}`} />
                </div>

                {/* Step 1: Compose */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-[var(--color-bg-surface)] rounded-[32px] border border-[var(--color-border)] p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-lg font-bold">Conteúdo da Mensagem</h2>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Título do Alerta</label>
                                    <div className="relative">
                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Promoção de Banho & Tosa! 🐾"
                                            className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Mensagem (Corpo)</label>
                                    <textarea
                                        rows={4}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Descreva o conteúdo da notificação que o usuário receberá no celular..."
                                        className="w-full p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1">Link de Ação (Opcional)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="Ex: /client/appointments ou https://wa.me/..."
                                            className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[var(--color-text-tertiary)] ml-1 italic">* Ao clicar na notificação, o usuário será redirecionado para este link.</p>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!title || !body}
                                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        Próximo: Público <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Target */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-[var(--color-bg-surface)] rounded-[32px] border border-[var(--color-border)] p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Users size={20} />
                                </div>
                                <h2 className="text-lg font-bold">Definir Público-Alvo</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => setTargetType('ALL')}
                                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col gap-3 text-left ${targetType === 'ALL' ? 'border-blue-500 bg-blue-50/50' : 'border-[var(--color-border)] hover:border-blue-200'}`}
                                >
                                    <Globe className={targetType === 'ALL' ? 'text-blue-500' : 'text-[var(--color-text-tertiary)]'} />
                                    <div>
                                        <p className="font-bold text-sm">Todo o Sistema</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)]">Todos os usuários ativos (Staff + Clientes)</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setTargetType('CLIENTS')}
                                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col gap-3 text-left ${targetType === 'CLIENTS' ? 'border-blue-500 bg-blue-50/50' : 'border-[var(--color-border)] hover:border-blue-200'}`}
                                >
                                    <User className={targetType === 'CLIENTS' ? 'text-blue-500' : 'text-[var(--color-text-tertiary)]'} />
                                    <div>
                                        <p className="font-bold text-sm">Somente Clientes</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)]">Usuários com divisão CLIENTE</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setTargetType('ROLES')}
                                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col gap-3 text-left ${targetType === 'ROLES' ? 'border-blue-500 bg-blue-50/50' : 'border-[var(--color-border)] hover:border-blue-200'}`}
                                >
                                    <Shield className={targetType === 'ROLES' ? 'text-blue-500' : 'text-[var(--color-text-tertiary)]'} />
                                    <div>
                                        <p className="font-bold text-sm">Por Cargos (Staff)</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)]">Selecione departamentos/cargos específicos</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setTargetType('USERS')}
                                    className={`p-5 rounded-[24px] border-2 transition-all flex flex-col gap-3 text-left ${targetType === 'USERS' ? 'border-blue-500 bg-blue-50/50' : 'border-[var(--color-border)] hover:border-blue-200'}`}
                                >
                                    <Search className={targetType === 'USERS' ? 'text-blue-500' : 'text-[var(--color-text-tertiary)]'} />
                                    <div>
                                        <p className="font-bold text-sm">Lista Personalizada</p>
                                        <p className="text-[10px] text-[var(--color-text-tertiary)]">Escolha usuários um a um</p>
                                    </div>
                                </button>
                            </div>

                            {/* Role Selection */}
                            <AnimatePresence>
                                {targetType === 'ROLES' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-8"
                                    >
                                        <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1 block mb-3">Selecione os Cargos</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableRoles.map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => toggleRole(role)}
                                                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${targetRoles.includes(role) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                            {availableRoles.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Carregando cargos...</p>}
                                        </div>
                                    </motion.div>
                                )}

                                {targetType === 'USERS' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-8"
                                    >
                                        <label className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase ml-1 block mb-3">Selecionar Usuários</label>

                                        <div className="relative mb-4">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={18} />
                                            <input
                                                type="text"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                placeholder="Pesquise por nome ou email (mín. 3 letras)..."
                                                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm outline-none"
                                            />
                                            {isSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                                        </div>

                                        {userOptions.length > 0 && (
                                            <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)] overflow-hidden mb-4">
                                                {userOptions.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => addUser(u)}
                                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-500/5 transition-colors border-b border-[var(--color-border)] last:border-0"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-sm font-bold">{u.name}</span>
                                                            <span className="text-[10px] text-[var(--color-text-tertiary)]">{u.email} • {u.division}</span>
                                                        </div>
                                                        <Plus size={16} className="text-blue-500" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {selectedUserIds.length > 0 ? (
                                                selectedUserIds.map(id => (
                                                    <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                                                        <span>UID: {id.slice(0, 8)}...</span>
                                                        <button onClick={() => removeUser(id)} className="hover:text-red-500 transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-[var(--color-text-tertiary)] italic ml-1 font-medium">Nenhum usuário selecionado ainda.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-4 text-[var(--color-text-secondary)] font-bold text-sm hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={
                                        (targetType === 'ROLES' && targetRoles.length === 0) ||
                                        (targetType === 'USERS' && selectedUserIds.length === 0)
                                    }
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    Próximo: Revisão <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review & Send */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            {/* Summary Card */}
                            <div className="md:col-span-3 bg-[var(--color-bg-surface)] rounded-[32px] border border-[var(--color-border)] p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <h2 className="text-lg font-bold">Resumo do Disparo</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)] space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Público</span>
                                            <span className="font-bold text-blue-600">
                                                {targetType === 'ALL' && 'Todo o Sistema'}
                                                {targetType === 'CLIENTS' && 'Apenas Clientes'}
                                                {targetType === 'ROLES' && `${targetRoles.length} Cargos selecionados`}
                                                {targetType === 'USERS' && `${selectedUserIds.length} Usuários específicos`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-[var(--color-text-tertiary)] font-bold uppercase tracking-wider">Prioridade</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${priority === 'HIGH' ? 'bg-red-500/10 text-red-500' :
                                                priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {priority === 'LOW' ? 'BAIXA' : priority === 'MEDIUM' ? 'MÉDIA' : 'ALTA'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-3">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                            Atenção: Esta mensagem será enviada via **Notificação Push** e ficara visível no **Histórico Interno** de cada usuário selecionado.
                                        </p>
                                    </div>

                                    <div className="pt-6 flex flex-col gap-3">
                                        <button
                                            onClick={handleSend}
                                            disabled={isSending}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                        >
                                            <Send size={20} />
                                            {isSending ? 'Processando envio...' : 'Confirmar e Enviar Agora'}
                                        </button>
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={isSending}
                                            className="w-full py-4 text-[var(--color-text-secondary)] font-bold text-sm hover:bg-[var(--color-bg-primary)] rounded-2xl transition-all"
                                        >
                                            Ajustar Público
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="md:col-span-2 space-y-3">
                                <div className="flex items-center gap-2 px-2 text-[var(--color-text-tertiary)] font-bold text-[10px] uppercase tracking-widest">
                                    <Eye size={14} /> Prévia do Celular
                                </div>

                                {/* Phone Mock */}
                                <div className="bg-[#1a1a1a] rounded-[48px] p-3 border-4 border-[#333] shadow-2xl relative overflow-hidden aspect-[9/18]">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-20" />

                                    {/* Wallpapers Background */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-indigo-900 opacity-80" />

                                    {/* Floating Notification */}
                                    <div className="relative mt-20 px-3 z-10">
                                        <motion.div
                                            initial={{ scale: 0.8, y: -20, opacity: 0 }}
                                            animate={{ scale: 1, y: 0, opacity: 1 }}
                                            className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-lg border border-white/20"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white p-1">
                                                    <BellRing size={14} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">7PET CLOUD</span>
                                                <span className="text-[8px] text-slate-500 ml-auto font-medium">Agora</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                                    {title || 'Seu título aqui...'}
                                                </p>
                                                <p className="text-[10px] text-slate-600 font-medium leading-snug line-clamp-3">
                                                    {body || 'O conteúdo da sua mensagem promocional ou informativa aparecerá aqui para o cliente.'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Action Hint */}
                                    <div className="absolute bottom-10 left-0 right-0 text-center text-white/40 text-[8px] font-bold uppercase tracking-widest">
                                        Toque para ver mais
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
