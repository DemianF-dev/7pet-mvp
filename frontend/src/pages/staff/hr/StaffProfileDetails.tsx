import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Save, ArrowLeft, Building2, User as UserIcon, CreditCard, FileText, Heart, Shield, Calendar, MapPin, Truck } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';


export default function StaffProfileDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    const [formData, setFormData] = useState({
        // Bio & Address
        hiringDate: '',
        birthday: '',
        address: '',

        // Emergency
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',

        // Driver
        cnhNumber: '',
        cnhCategory: '',
        cnhExpiry: '',
        cnhEar: false,

        // Financial & Contract
        employmentType: 'PF',
        documentType: 'CPF',
        documentNumber: '',
        companyName: '',
        pixKey: '',
        bankName: '',
        bankAgency: '',
        bankAccount: '',
        notes: ''
    });

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/hr/staff-profiles');
            const found = res.data.find((p: any) => p.id === id);
            if (found) {
                setProfile(found);
                setFormData({
                    hiringDate: found.hiringDate ? found.hiringDate.split('T')[0] : '',
                    birthday: found.birthday ? found.birthday.split('T')[0] : '',
                    address: found.address || '',

                    emergencyContactName: found.emergencyContactName || '',
                    emergencyContactPhone: found.emergencyContactPhone || '',
                    emergencyContactRelation: found.emergencyContactRelation || '',

                    cnhNumber: found.cnhNumber || '',
                    cnhCategory: found.cnhCategory || '',
                    cnhExpiry: found.cnhExpiry ? found.cnhExpiry.split('T')[0] : '',
                    cnhEar: found.cnhEar || false,

                    employmentType: found.employmentType || 'PF',
                    documentType: found.documentType || 'CPF',
                    documentNumber: found.documentNumber || '',
                    companyName: found.companyName || '',
                    pixKey: found.pixKey || '',
                    bankName: found.bankName || '',
                    bankAgency: found.bankAgency || '',
                    bankAccount: found.bankAccount || '',
                    notes: found.notes || ''
                });
            } else {
                toast.error('Perfil não encontrado');
                navigate('/staff/hr/collaborators');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            // Convert empty dates to null to avoid Prisma errors
            const payload = { ...formData };
            if (!payload.hiringDate) delete (payload as any).hiringDate;
            if (!payload.birthday) delete (payload as any).birthday;
            if (!payload.cnhExpiry) delete (payload as any).cnhExpiry;

            // Ensure hiringDate is valid ISO
            if (payload.hiringDate) payload.hiringDate = new Date(payload.hiringDate).toISOString();
            if (payload.birthday) payload.birthday = new Date(payload.birthday).toISOString();
            if (payload.cnhExpiry) payload.cnhExpiry = new Date(payload.cnhExpiry).toISOString();

            await api.put(`/hr/staff-profiles/${id}`, payload);
            toast.success('Dados salvos com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar dados. Verifique os campos.');
        }
    };

    if (loading) {
        return (
            <main className="p-8 text-center text-muted">Carregando...</main>
        );
    }

    return (
        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 24px))' }}>
            <button
                onClick={() => navigate('/staff/hr/collaborators')}
                className="flex items-center gap-2 text-muted hover:text-heading mb-6"
            >
                <ArrowLeft size={20} />
                Voltar
            </button>

            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-bold text-2xl shrink-0">
                    {profile.user.name.charAt(0)}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-black text-heading">{profile.user.name}</h1>
                    <p className="text-xs md:text-sm text-muted">{profile.department.toUpperCase()} | {profile.user.email}</p>
                </div>
                <div className="md:ml-auto w-full md:w-auto">
                    <button
                        onClick={() => navigate(`/staff/users?email=${profile.user.email}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-fill-secondary hover:bg-fill-tertiary text-heading rounded-lg font-medium transition-colors text-xs w-full md:w-auto"
                        title="Ir para gestão de usuário e permissões"
                    >
                        <Shield size={16} />
                        Perfil de Acesso
                    </button>
                </div>
            </div>

            <div className="space-y-6">

                {/* 1. Personal Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                            <User size={20} className="text-accent" />
                            Dados Pessoais & Contato
                        </h2>
                    </div>
                    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-sm">Data de Nascimento</label>
                            <input
                                type="date"
                                value={formData.birthday}
                                onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div>
                            <label className="label-sm">Data de Contratação</label>
                            <input
                                type="date"
                                value={formData.hiringDate}
                                onChange={e => setFormData({ ...formData, hiringDate: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="label-sm">Endereço Completo</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-3 top-3 text-muted" />
                                <input
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field pl-10 text-sm"
                                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Emergency Contact */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                            <Heart size={20} className="text-error" />
                            Contato de Emergência
                        </h2>
                    </div>
                    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label-sm">Nome do Contato</label>
                            <input
                                value={formData.emergencyContactName}
                                onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div>
                            <label className="label-sm">Telefone</label>
                            <input
                                value={formData.emergencyContactPhone}
                                onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div>
                            <label className="label-sm">Parentesco</label>
                            <input
                                value={formData.emergencyContactRelation}
                                onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                                className="input-field text-sm"
                                placeholder="Ex: Mãe, Cônjuge"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Driver Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                            <Truck size={20} className="text-blue-500" />
                            Habilitação (CNH)
                        </h2>
                    </div>
                    <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
                        <div className="md:col-span-1">
                            <label className="label-sm">Nº Registro</label>
                            <input
                                value={formData.cnhNumber}
                                onChange={e => setFormData({ ...formData, cnhNumber: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div>
                            <label className="label-sm">Categoria</label>
                            <input
                                value={formData.cnhCategory}
                                onChange={e => setFormData({ ...formData, cnhCategory: e.target.value })}
                                className="input-field text-sm"
                                placeholder="Ex: AB"
                            />
                        </div>
                        <div>
                            <label className="label-sm">Validade</label>
                            <input
                                type="date"
                                value={formData.cnhExpiry}
                                onChange={e => setFormData({ ...formData, cnhExpiry: e.target.value })}
                                className="input-field text-sm"
                            />
                        </div>
                        <div className="pb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.cnhEar}
                                    onChange={e => setFormData({ ...formData, cnhEar: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                                />
                                <span className="text-sm font-bold text-heading">Possui EAR</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* 4. Contract Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                            <FileText size={20} className="text-accent" />
                            Dados Contratuais & Bancários
                        </h2>
                    </div>

                    <div className="p-4 md:p-6 space-y-6">
                        {/* Employment Type */}
                        <div>
                            <label className="label-sm">Tipo de Contrato</label>
                            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {['PF', 'PJ', 'CLT'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, employmentType: type })}
                                        className={`px-4 md:px-6 py-2 rounded-lg font-bold transition-colors text-sm shrink-0 ${formData.employmentType === type
                                            ? 'bg-accent text-white'
                                            : 'bg-fill-secondary text-body-secondary'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PJ Details */}
                        {formData.employmentType === 'PJ' && (
                            <div>
                                <label className="label-sm">Razão Social</label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3 top-3 text-muted" />
                                    <input
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        className="input-field pl-10 text-sm"
                                        placeholder="Nome da Empresa"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Document */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label-sm">Tipo de Documento</label>
                                <select
                                    value={formData.documentType}
                                    onChange={e => setFormData({ ...formData, documentType: e.target.value })}
                                    className="input-field text-sm"
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-sm">Número do Documento</label>
                                <div className="relative">
                                    <UserIcon size={18} className="absolute left-3 top-3 text-muted" />
                                    <input
                                        value={formData.documentNumber}
                                        onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                                        className="input-field pl-10 text-sm"
                                        placeholder={formData.documentType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h3 className="text-md font-bold text-heading mb-4 flex items-center gap-2">
                                <CreditCard size={18} />
                                Conta Bancária
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-sm">Chave PIX</label>
                                    <input
                                        value={formData.pixKey}
                                        onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                                        className="input-field text-sm"
                                        placeholder="CPF, Email, Tel ou Aleatória"
                                    />
                                </div>
                                <div>
                                    <label className="label-sm">Banco</label>
                                    <input
                                        value={formData.bankName}
                                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        className="input-field text-sm"
                                        placeholder="Ex: Nubank, Itaú"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-sm">Agência</label>
                                        <input
                                            value={formData.bankAgency}
                                            onChange={e => setFormData({ ...formData, bankAgency: e.target.value })}
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-sm">Conta</label>
                                        <input
                                            value={formData.bankAccount}
                                            onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="input-field text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label-sm">Observações Gerais</label>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="input-field h-24 resize-none text-sm"
                                placeholder="Informações adicionais..."
                            />
                        </div>
                    </div>
                </div>

                {/* Fixed Action Bar - adjusted bottom for mobile nav */}
                <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 p-4 bg-white/80 backdrop-blur-md dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end z-20 md:static md:bg-transparent md:border-0 md:p-0">
                    <button
                        onClick={handleSubmit}
                        className="btn-primary flex items-center gap-2 px-8 py-4 w-full md:w-auto justify-center shadow-lg shadow-accent/20"
                    >
                        <Save size={20} />
                        Salvar Ficha Completa
                    </button>
                </div>
            </div>

            <style>{`
                    .label-sm {
                        @apply text-xs font-black text-muted uppercase tracking-wider mb-2 block;
                    }
                    .input-field {
                        @apply w-full px-4 py-2 surface-input rounded-lg border-transparent focus:border-accent transition-colors;
                    }
                `}</style>
        </main>
    );
}
