import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Save, Calendar,
    Trash2, Plus, X, MessageSquare,
    Info, Users, CreditCard, PawPrint, Scissors, ChevronDown, ChevronUp, Check, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import StaffSidebar from '../../components/StaffSidebar';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import RecurrenceCelebrationModal from '../../components/RecurrenceCelebrationModal';
import CustomerFinancialSection from '../../components/staff/CustomerFinancialSection';
import CustomerAlertsSection from '../../components/staff/CustomerAlertsSection';

interface Guardian {
    name: string;
    phone: string;
    email: string;
    address: string;
    birthday: string;
}

interface Pet {
    id?: string;
    name: string;
    species: string;
    breed: string;
    weight: number | null;
    coatType: string;
    temperament: string;
    age: string;
    observations: string;
    healthIssues: string;
    allergies: string;
    hasKnots: boolean;
    hasMattedFur: boolean;
    usesPerfume: boolean;
    usesOrnaments: boolean;
    groomingMachine: string;
    groomingHeight: string;
    groomingAdapter: string;
    groomingScissors: string;
    groomingNotes: string;
    isNew?: boolean;
    isExpanded?: boolean;
}

interface CustomerDetailProps {
    customerId?: string;
    onClose?: () => void;
}

export default function CustomerDetail({ customerId, onClose }: CustomerDetailProps = {}) {
    const { id: paramId } = useParams();
    const id = customerId || paramId;
    const isModal = !!customerId;

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [extraEmails, setExtraEmails] = useState<string[]>([]);
    const [phone, setPhone] = useState('');
    const [extraPhones, setExtraPhones] = useState<string[]>([]);
    const [address, setAddress] = useState('');
    const [extraAddresses, setExtraAddresses] = useState<string[]>([]);
    const [birthday, setBirthday] = useState('');
    const [document, setDocument] = useState('');
    const [discoverySource, setDiscoverySource] = useState('');
    const [communicationPrefs, setCommunicationPrefs] = useState<string[]>([]);
    const [communicationOther, setCommunicationOther] = useState('');
    const [additionalGuardians, setAdditionalGuardians] = useState<Guardian[]>([]);
    const [internalNotes, setInternalNotes] = useState('');
    const [type, setType] = useState('AVULSO');
    const [recurringFrequency, setRecurringFrequency] = useState('');
    const [recurrenceDiscount, setRecurrenceDiscount] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [seqId, setSeqId] = useState<number | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);

    // New Fields
    const [riskLevel, setRiskLevel] = useState('Nivel 1');
    const [isBlocked, setIsBlocked] = useState(false);
    const [canRequestQuotes, setCanRequestQuotes] = useState(true);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchCustomer();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchCustomer = async () => {
        try {
            const response = await api.get(`/customers/${id}`);
            const data = response.data;
            const u = data.user || {};

            setFirstName(u.firstName || '');
            setLastName(u.lastName || '');
            setEmail(u.email || '');
            setExtraEmails(u.extraEmails || []);
            setPhone(u.phone || '');
            setExtraPhones(u.extraPhones || []);
            setAddress(u.address || '');
            setExtraAddresses(u.extraAddresses || []);
            setBirthday(u.birthday ? new Date(u.birthday).toISOString().split('T')[0] : '');
            setDocument(u.document || '');
            setDiscoverySource(data.discoverySource || '');
            setCommunicationPrefs(data.communicationPrefs || []);
            setCommunicationOther(data.communicationOther || '');
            setAdditionalGuardians(data.additionalGuardians || []);
            setInternalNotes(data.internalNotes || '');
            setType(data.type || 'AVULSO');
            setRecurringFrequency(data.recurrenceFrequency || '');
            setRecurrenceDiscount(data.recurrenceDiscount || 0);
            setSeqId(u.seqId || null);

            // New fields
            setRiskLevel(data.riskLevel || 'Nivel 1');
            setIsBlocked(data.isBlocked || false);
            setCanRequestQuotes(data.canRequestQuotes ?? true);

            // Load pets
            if (data.pets && Array.isArray(data.pets)) {
                setPets(data.pets.map((p: any) => ({
                    ...p,
                    weight: p.weight || null,
                    breed: p.breed || '',
                    coatType: p.coatType || '',
                    temperament: p.temperament || '',
                    age: p.age || '',
                    observations: p.observations || '',
                    healthIssues: p.healthIssues || '',
                    allergies: p.allergies || '',
                    groomingMachine: p.groomingMachine || '',
                    groomingHeight: p.groomingHeight || '',
                    groomingAdapter: p.groomingAdapter || '',
                    groomingScissors: p.groomingScissors || '',
                    groomingNotes: p.groomingNotes || '',
                    isExpanded: false
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            toast.error('Erro ao carregar dados do cliente');
            if (!isModal) navigate('/staff/customers');
            else if (onClose) onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                firstName,
                lastName,
                email,
                extraEmails,
                phone,
                extraPhones,
                address,
                extraAddresses,
                birthday,
                document,
                discoverySource,
                communicationPrefs,
                communicationOther,
                additionalGuardians,
                internalNotes,
                type,
                recurringFrequency,
                recurrenceDiscount,
                riskLevel,
                isBlocked,
                canRequestQuotes
            };

            console.log('💾 Salvando cliente com payload:', JSON.stringify(payload, null, 2));

            if (id === 'new') {
                await api.post('/customers', payload);
                toast.success('Cliente criado com sucesso!');
            } else {
                await api.patch(`/customers/${id}`, payload);
                toast.success('Perfil atualizado com sucesso!');
            }
            if (!isModal) navigate('/staff/customers');
            // If modal, maybe just toast and remain open? Or close? User usually wants to keep working. I'll just toast.
        } catch (error: any) {
            console.error('❌ Erro ao salvar cliente:', error);
            console.error('📊 Resposta do servidor:', error.response?.data);

            // Show detailed error if available
            if (error.response?.data?.details) {
                console.error('📋 Detalhes da validação:', error.response.data.details);
                const errorMsg = error.response.data.details.map((d: any) =>
                    `Campo "${d.field}": ${d.message}`
                ).join('\n');
                toast.error(`Dados inválidos:\n${errorMsg}`);
            } else {
                toast.error(error.response?.data?.error || 'Erro ao salvar cliente');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Cliente excluído');
            if (onClose) onClose();
            else navigate('/staff/customers');
        } catch (error) {
            toast.error('Erro ao excluir cliente');
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

    const content = (
        <>
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {isModal && onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2">
                            <X size={24} className="text-gray-400" />
                        </button>
                    )}
                    <h1 className="text-3xl font-black text-secondary tracking-tight">
                        {id === 'new' ? 'Novo' : 'Editar'} <span className="text-primary">Cliente</span>
                    </h1>
                    {seqId && <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs ml-1">Ficha CL-{String(seqId).padStart(4, '0')}</p>}
                </div>

                <div className="flex items-center gap-3">
                    {id !== 'new' && (
                        <button
                            onClick={handleDelete}
                            className="p-4 bg-white text-red-500 rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </header>

            {/* NOVO BANNER DE STATUS E NÍVEL (Destaque Staff) */}
            {id !== 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                    {/* Banner de Status */}
                    <div className={`md:col-span-8 flex items-center gap-4 p-5 rounded-[32px] border shadow-sm transition-all ${isBlocked ? 'bg-red-50 border-red-200 text-red-700' :
                        !canRequestQuotes ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-green-50 border-green-200 text-green-700'
                        }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isBlocked ? 'bg-red-500 text-white' :
                            !canRequestQuotes ? 'bg-amber-500 text-white' :
                                'bg-green-500 text-white shadow-lg shadow-green-200'
                            }`}>
                            {isBlocked ? <X size={24} /> : !canRequestQuotes ? <Info size={24} /> : <Check size={24} />}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-black uppercase tracking-tight leading-none mb-1">
                                {isBlocked ? 'Acesso ao Sistema Bloqueado' :
                                    !canRequestQuotes ? 'Bloqueio de Novos Orçamentos' :
                                        'Status do Cliente: Regular'}
                            </div>
                            <div className="text-[11px] font-bold opacity-70 italic">
                                {isBlocked ? 'O cliente não consegue fazer login no aplicativo.' :
                                    !canRequestQuotes ? 'O cliente pode logar, mas não pode solicitar serviços.' :
                                        'Tudo em ordem com este cadastro.'}
                            </div>
                        </div>
                    </div>

                    {/* Classificação de Risco */}
                    <div className="md:col-span-4 bg-gray-50/50 p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Classificação Staff</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-sm ${riskLevel === 'Nivel 3' ? 'bg-red-500 text-white shadow-red-100' :
                                riskLevel === 'Nivel 2' ? 'bg-amber-500 text-white shadow-amber-100' :
                                    'bg-green-500 text-white shadow-green-100'
                                }`}>
                                {riskLevel}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {['Nivel 1', 'Nivel 2', 'Nivel 3'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setRiskLevel(lvl)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${riskLevel === lvl
                                        ? (lvl === 'Nivel 3' ? 'bg-red-500 border-red-500 text-white shadow-md' :
                                            lvl === 'Nivel 2' ? 'bg-amber-500 border-amber-500 text-white shadow-md' :
                                                'bg-green-600 border-green-600 text-white shadow-md')
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    NV {lvl.split(' ')[1]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOMER ALERTS - Show active alerts banner */}
            {id !== 'new' && <CustomerAlertsSection customerId={id} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* IDENTIFICATION */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <User size={16} /> Identificação Básica
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Nome</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Primeiro nome"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Sobrenome</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Sobrenome"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">CPF / Documento</label>
                                <div className="relative">
                                    <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="text"
                                        value={document}
                                        onChange={e => setDocument(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="date"
                                        value={birthday}
                                        onChange={e => setBirthday(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CONTACTS */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Phone size={16} /> Canais de Contato
                        </h3>
                        <div className="space-y-6">
                            {/* Emails */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">E-mails</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-[22px] -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="E-mail principal (login)"
                                    />
                                </div>
                                {extraEmails.map((em, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="email"
                                            value={em}
                                            onChange={e => {
                                                const newEmails = [...extraEmails];
                                                newEmails[idx] = e.target.value;
                                                setExtraEmails(newEmails);
                                            }}
                                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        />
                                        <button onClick={() => setExtraEmails(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:bg-red-50 p-2 rounded-xl"><X size={18} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setExtraEmails([...extraEmails, ''])} className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"><Plus size={14} /> Adicionar E-mail</button>
                            </div>

                            {/* Phones */}
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Telefones</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-[22px] -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        placeholder="Telefone principal"
                                    />
                                </div>
                                {extraPhones.map((ph, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={ph}
                                            onChange={e => {
                                                const newPhones = [...extraPhones];
                                                newPhones[idx] = e.target.value;
                                                setExtraPhones(newPhones);
                                            }}
                                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                        />
                                        <button onClick={() => setExtraPhones(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:bg-red-50 p-2 rounded-xl"><X size={18} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setExtraPhones([...extraPhones, ''])} className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"><Plus size={14} /> Adicionar Telefone</button>
                            </div>
                        </div>
                    </section>

                    {/* ADDRESSES */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <MapPin size={16} /> Localização
                        </h3>
                        <div className="space-y-4">
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-[22px] -translate-y-1/2 text-gray-300" />
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    placeholder="Endereço principal"
                                />
                            </div>
                            {extraAddresses.map((addr, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={addr}
                                        onChange={e => {
                                            const newAddresses = [...extraAddresses];
                                            newAddresses[idx] = e.target.value;
                                            setExtraAddresses(newAddresses);
                                        }}
                                        className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-secondary font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                                    />
                                    <button onClick={() => setExtraAddresses(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:bg-red-50 p-2 rounded-xl"><X size={18} /></button>
                                </div>
                            ))}
                            <button onClick={() => setExtraAddresses([...extraAddresses, ''])} className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"><Plus size={14} /> Adicionar Endereço</button>
                        </div>
                    </section>

                    {/* GUARDIANS */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Users size={16} /> Tutores Adicionais
                        </h3>
                        <div className="space-y-6">
                            {additionalGuardians.map((g, idx) => (
                                <div key={idx} className="bg-gray-50 p-6 rounded-3xl relative border border-gray-100">
                                    <button
                                        onClick={() => setAdditionalGuardians(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            value={g.name}
                                            onChange={e => {
                                                const updated = [...additionalGuardians];
                                                updated[idx].name = e.target.value;
                                                setAdditionalGuardians(updated);
                                            }}
                                            placeholder="Nome do tutor"
                                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm"
                                        />
                                        <input
                                            value={g.phone}
                                            onChange={e => {
                                                const updated = [...additionalGuardians];
                                                updated[idx].phone = e.target.value;
                                                setAdditionalGuardians(updated);
                                            }}
                                            placeholder="Telefone"
                                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm"
                                        />
                                        <input
                                            value={g.email}
                                            onChange={e => {
                                                const updated = [...additionalGuardians];
                                                updated[idx].email = e.target.value;
                                                setAdditionalGuardians(updated);
                                            }}
                                            placeholder="E-mail"
                                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={g.birthday}
                                            onChange={e => {
                                                const updated = [...additionalGuardians];
                                                updated[idx].birthday = e.target.value;
                                                setAdditionalGuardians(updated);
                                            }}
                                            className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm"
                                        />
                                        <input
                                            value={g.address}
                                            onChange={e => {
                                                const updated = [...additionalGuardians];
                                                updated[idx].address = e.target.value;
                                                setAdditionalGuardians(updated);
                                            }}
                                            placeholder="Endereço"
                                            className="md:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setAdditionalGuardians([...additionalGuardians, { name: '', phone: '', email: '', address: '', birthday: '' }])}
                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Adicionar Novo Tutor
                            </button>
                        </div>
                    </section>

                    {/* PETS */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <PawPrint size={16} /> Pets do Tutor
                        </h3>
                        <div className="space-y-4">
                            {pets.map((pet, idx) => (
                                <div key={pet.id || idx} className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                                    {/* Pet Header */}
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                            const updated = [...pets];
                                            updated[idx].isExpanded = !updated[idx].isExpanded;
                                            setPets(updated);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <PawPrint size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-secondary">{pet.name || 'Novo Pet'}</p>
                                                <p className="text-xs text-gray-400">{pet.species} {pet.breed && `• ${pet.breed}`}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Remover este pet?')) {
                                                        if (pet.id) {
                                                            api.delete(`/customers/pets/${pet.id}`).then(() => {
                                                                setPets(pets.filter((_, i) => i !== idx));
                                                                toast.success('Pet removido');
                                                            }).catch(() => toast.error('Erro ao remover'));
                                                        } else {
                                                            setPets(pets.filter((_, i) => i !== idx));
                                                        }
                                                    }
                                                }}
                                                className="text-red-300 hover:text-red-500 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {pet.isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                        </div>
                                    </div>

                                    {/* Pet Details (Expandable) */}
                                    {pet.isExpanded && (
                                        <div className="p-6 border-t border-gray-200 space-y-6">
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <input value={pet.name} onChange={e => { const u = [...pets]; u[idx].name = e.target.value; setPets(u); }} placeholder="Nome" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                                <select value={pet.species} onChange={e => { const u = [...pets]; u[idx].species = e.target.value; setPets(u); }} className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm">
                                                    <option value="Canino">🐕 Canino</option>
                                                    <option value="Felino">🐈 Felino</option>
                                                </select>
                                                <input value={pet.breed} onChange={e => { const u = [...pets]; u[idx].breed = e.target.value; setPets(u); }} placeholder="Raça" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                                <input type="number" value={pet.weight || ''} onChange={e => { const u = [...pets]; u[idx].weight = e.target.value ? parseFloat(e.target.value) : null; setPets(u); }} placeholder="Peso (kg)" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <select value={pet.coatType} onChange={e => { const u = [...pets]; u[idx].coatType = e.target.value; setPets(u); }} className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm">
                                                    <option value="">Tipo de Pelo</option>
                                                    <option value="CURTO">Curto</option>
                                                    <option value="MEDIO">Médio</option>
                                                    <option value="LONGO">Longo</option>
                                                </select>
                                                <select value={pet.temperament} onChange={e => { const u = [...pets]; u[idx].temperament = e.target.value; setPets(u); }} className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm">
                                                    <option value="">Temperamento</option>
                                                    <option value="DOCIL">Dócil</option>
                                                    <option value="AGITADO">Agitado</option>
                                                    <option value="AGRESSIVO">Agressivo</option>
                                                    <option value="MEDROSO">Medroso</option>
                                                </select>
                                                <input value={pet.age} onChange={e => { const u = [...pets]; u[idx].age = e.target.value; setPets(u); }} placeholder="Idade" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={pet.hasKnots} onChange={e => { const u = [...pets]; u[idx].hasKnots = e.target.checked; setPets(u); }} /> Nós</label>
                                                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={pet.usesPerfume} onChange={e => { const u = [...pets]; u[idx].usesPerfume = e.target.checked; setPets(u); }} /> Perfume</label>
                                                </div>
                                            </div>

                                            {/* Health */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input value={pet.healthIssues} onChange={e => { const u = [...pets]; u[idx].healthIssues = e.target.value; setPets(u); }} placeholder="Problemas de saúde" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                                <input value={pet.allergies} onChange={e => { const u = [...pets]; u[idx].allergies = e.target.value; setPets(u); }} placeholder="Alergias" className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm" />
                                            </div>

                                            {/* Grooming Details */}
                                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Scissors size={14} /> Detalhes da Tosa</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <input value={pet.groomingMachine} onChange={e => { const u = [...pets]; u[idx].groomingMachine = e.target.value; setPets(u); }} placeholder="Máquina" className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm" />
                                                    <input value={pet.groomingHeight} onChange={e => { const u = [...pets]; u[idx].groomingHeight = e.target.value; setPets(u); }} placeholder="Altura (ex: 3mm)" className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm" />
                                                    <input value={pet.groomingAdapter} onChange={e => { const u = [...pets]; u[idx].groomingAdapter = e.target.value; setPets(u); }} placeholder="Adaptador" className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm" />
                                                    <input value={pet.groomingScissors} onChange={e => { const u = [...pets]; u[idx].groomingScissors = e.target.value; setPets(u); }} placeholder="Tesoura" className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm" />
                                                </div>
                                                <textarea value={pet.groomingNotes} onChange={e => { const u = [...pets]; u[idx].groomingNotes = e.target.value; setPets(u); }} placeholder="Observações sobre a tosa..." rows={2} className="mt-3 w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm resize-none" />
                                            </div>

                                            {/* General Notes */}
                                            <textarea value={pet.observations} onChange={e => { const u = [...pets]; u[idx].observations = e.target.value; setPets(u); }} placeholder="Observações gerais do pet..." rows={2} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none" />

                                            {/* Save Pet Button */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        if (pet.id) {
                                                            await api.patch(`/customers/pets/${pet.id}`, pet);
                                                        } else {
                                                            const res = await api.post(`/customers/${id}/pets`, pet);
                                                            const updated = [...pets];
                                                            updated[idx] = { ...pet, id: res.data.id, isNew: false };
                                                            setPets(updated);
                                                        }
                                                        toast.success('Pet salvo');
                                                    } catch {
                                                        toast.error('Erro ao salvar pet');
                                                    }
                                                }}
                                                className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                                            >
                                                Salvar Pet
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setPets([...pets, { name: '', species: 'Canino', breed: '', weight: null, coatType: '', temperament: '', age: '', observations: '', healthIssues: '', allergies: '', hasKnots: false, hasMattedFur: false, usesPerfume: false, usesOrnaments: false, groomingMachine: '', groomingHeight: '', groomingAdapter: '', groomingScissors: '', groomingNotes: '', isNew: true, isExpanded: true }])}
                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Adicionar Novo Pet
                            </button>
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    {/* FINANCIAL SECTION */}
                    {id !== 'new' && <CustomerFinancialSection customerId={id} />}

                    {/* PREFERENCES */}
                    <section className="bg-secondary p-8 rounded-[40px] text-white shadow-xl">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <MessageSquare size={16} /> Preferências
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Tipo de Cliente</label>
                                <div className="flex gap-2">
                                    {['AVULSO', 'RECORRENTE'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => {
                                                if (t === 'RECORRENTE' && type !== 'RECORRENTE') {
                                                    setShowCelebration(true);
                                                    return;
                                                }
                                                setType(t);
                                                if (t === 'AVULSO') {
                                                    setRecurringFrequency('');
                                                    setRecurrenceDiscount(0);
                                                }
                                            }}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${type === t ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Canal de Preferência</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['APP', 'WHATSAPP', 'TELEFONE', 'OUTROS'].map(pref => (
                                        <label key={pref} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${communicationPrefs.includes(pref) ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                            <input
                                                type="checkbox"
                                                checked={communicationPrefs.includes(pref)}
                                                onChange={() => {
                                                    if (communicationPrefs.includes(pref)) setCommunicationPrefs(prev => prev.filter(p => p !== pref));
                                                    else setCommunicationPrefs([...communicationPrefs, pref]);
                                                }}
                                                className="rounded border-white/20 bg-white/10 text-primary"
                                            />
                                            <span className="text-[10px] font-black">{pref}</span>
                                        </label>
                                    ))}
                                </div>
                                {communicationPrefs.includes('OUTROS') && (
                                    <input
                                        value={communicationOther}
                                        onChange={e => setCommunicationOther(e.target.value)}
                                        placeholder="Explique qual canal..."
                                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-primary/50"
                                    />
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Como conheceu a 7Pet?</label>
                                <input
                                    value={discoverySource}
                                    onChange={e => setDiscoverySource(e.target.value)}
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-1 focus:ring-primary/50"
                                    placeholder="Ex: Instagram, Indicação..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* NOTES */}
                    <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Info size={16} /> Observações Internas
                        </h3>
                        <textarea
                            value={internalNotes}
                            onChange={e => setInternalNotes(e.target.value)}
                            rows={6}
                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-sm text-secondary font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                            placeholder="Notas restritas ao operacional..."
                        />
                    </section>
                </div>
            </div>
        </>
    );

    if (isModal) {
        return (
            <div className="bg-gray-50 h-full overflow-y-auto px-6 py-6 rounded-[40px] shadow-none">
                {content}
                <RecurrenceCelebrationModal
                    isOpen={showCelebration}
                    onClose={() => setShowCelebration(false)}
                    onConfirm={(freq, discount) => {
                        setType('RECORRENTE');
                        setRecurringFrequency(freq);
                        setRecurrenceDiscount(discount);
                        setShowCelebration(false);
                        toast.success('Cliente promovido a Recorrente!');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                </header>
                {content}
                <RecurrenceCelebrationModal
                    isOpen={showCelebration}
                    onClose={() => setShowCelebration(false)}
                    onConfirm={(freq, discount) => {
                        setType('RECORRENTE');
                        setRecurringFrequency(freq);
                        setRecurrenceDiscount(discount);
                        setShowCelebration(false);
                        toast.success('Cliente promovido a Recorrente!');
                    }}
                />
            </main>
        </div>
    );
}
