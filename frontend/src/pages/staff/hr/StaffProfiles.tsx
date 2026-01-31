import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Edit2, Check, X, Truck, Scissors, HeadphonesIcon, Settings2, FileText, Search, ArrowLeft, Shield, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileCollaborators } from './MobileCollaborators';


interface StaffProfile {
    id: string;
    userId: string;
    department: string;
    payModel: string;
    dailyRate: number | null;
    perLegRate: number | null;
    transportVoucher: number | null;
    mealVoucher: number | null;
    otherBenefits: number | null;
    payPeriodPreference: string;
    isActive: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
}

interface User {
    id: string;
    name: string;
    email: string;
}

const DEPARTMENTS = [
    { value: 'spa', label: 'SPA', icon: Scissors, color: 'text-pink-500' },
    { value: 'transport', label: 'Transporte', icon: Truck, color: 'text-blue-500' },
    { value: 'atendimento', label: 'Atendimento', icon: HeadphonesIcon, color: 'text-green-500' },
    { value: 'gestao', label: 'Gestão', icon: Settings2, color: 'text-purple-500' }
];

const PAY_MODELS = [
    { value: 'daily', label: 'Diária' },
    { value: 'per_leg', label: 'Por Pernada' },
    { value: 'fixed', label: 'Fixo' }
];

export default function StaffProfiles() {
    const { isMobile } = useIsMobile();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<StaffProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<StaffProfile | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState<string | null>(null);

    // Delete Confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<StaffProfile | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        department: 'spa',
        payModel: 'daily',
        dailyRate: '',
        perLegRate: '',
        transportVoucher: '',
        mealVoucher: '',
        otherBenefits: '',
        payPeriodPreference: 'monthly',
        isActive: true
    });

    useEffect(() => {
        fetchProfiles();
    }, []);

    useEffect(() => {
        fetchAvailableUsers();
    }, [profiles]);

    const fetchProfiles = async () => {
        try {
            const res = await api.get('/hr/staff-profiles');
            setProfiles(res.data);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
            toast.error('Erro ao carregar colaboradores');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            const res = await api.get('/management/users');
            // Backend returns an array directly
            const usersList = Array.isArray(res.data) ? res.data : (res.data.users || []);

            // Filter out users that already have staff profiles AND filter out clients
            const existingUserIds = profiles.map(p => p.userId);
            const staffOnly = usersList.filter((u: any) =>
                !existingUserIds.includes(u.id) &&
                u.division !== 'CLIENTE' &&
                u.role !== 'CLIENTE'
            );

            setAvailableUsers(staffOnly);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const parseSafeFloat = (val: string) => {
        if (!val) return null;
        // Replace comma with dot if present, and remove multiple dots/commas
        const sanitized = val.replace(',', '.');
        const parsed = parseFloat(sanitized);
        return isNaN(parsed) ? null : parsed;
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                dailyRate: parseSafeFloat(formData.dailyRate),
                perLegRate: parseSafeFloat(formData.perLegRate),
                transportVoucher: parseSafeFloat(formData.transportVoucher),
                mealVoucher: parseSafeFloat(formData.mealVoucher),
                otherBenefits: parseSafeFloat(formData.otherBenefits)
            };

            if (editingProfile) {
                await api.put(`/hr/staff-profiles/${editingProfile.id}`, payload);
                toast.success('Perfil atualizado!');
            } else {
                await api.post('/hr/staff-profiles', payload);
                toast.success('Colaborador cadastrado!');
            }

            setShowModal(false);
            resetForm();
            await fetchProfiles();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao salvar');
        }
    };

    const resetForm = () => {
        setFormData({
            userId: '',
            department: 'spa',
            payModel: 'daily',
            dailyRate: '',
            perLegRate: '',
            transportVoucher: '',
            mealVoucher: '',
            otherBenefits: '',
            payPeriodPreference: 'monthly',
            isActive: true
        });
        setEditingProfile(null);
    };

    const handleEdit = (profile: StaffProfile) => {
        setEditingProfile(profile);
        setFormData({
            userId: profile.userId,
            department: profile.department,
            payModel: profile.payModel,
            dailyRate: profile.dailyRate?.toString() || '',
            perLegRate: profile.perLegRate?.toString() || '',
            transportVoucher: profile.transportVoucher?.toString() || '',
            mealVoucher: profile.mealVoucher?.toString() || '',
            otherBenefits: profile.otherBenefits?.toString() || '',
            payPeriodPreference: profile.payPeriodPreference,
            isActive: profile.isActive
        });
        setShowModal(true);
    };

    const getDepartmentIcon = (dept: string) => {
        const config = DEPARTMENTS.find(d => d.value === dept);
        if (!config) return null;
        const Icon = config.icon;
        return <Icon size={20} className={config.color} />;
    };

    const handleDeleteClick = (profile: StaffProfile, e: React.MouseEvent) => {
        e.stopPropagation();
        setProfileToDelete(profile);
        setDeleteConfirmText('');
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== 'EXCLUIR') {
            toast.error('Digite EXCLUIR para confirmar');
            return;
        }

        if (!profileToDelete) return;

        try {
            await api.delete(`/hr/staff-profiles/${profileToDelete.id}`);
            toast.success('Perfil de colaborador excluído com sucesso');
            setShowDeleteModal(false);
            setProfileToDelete(null);
            setDeleteConfirmText('');
            await fetchProfiles();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao excluir perfil');
        }
    };

    const handleToggleActive = async (profile: StaffProfile, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/hr/staff-profiles/${profile.id}`, { isActive: !profile.isActive });
            toast.success(`Perfil ${!profile.isActive ? 'ativado' : 'desativado'}!`);
            fetchProfiles();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    // Filter Logic
    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = profile.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept ? profile.department === filterDept : true;
        return matchesSearch && matchesDept;
    });

    if (isMobile) return <MobileCollaborators />;

    if (loading) {
        return (
            <main className="p-8 animate-pulse">
                <div className="h-8 w-48 bg-fill-secondary rounded mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-fill-secondary rounded-xl" />)}
                </div>
            </main>
        );
    }

    return (
        <main className="p-8 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <button
                        onClick={() => navigate('/staff/hr')}
                        className="flex items-center gap-2 text-muted hover:text-heading mb-2 text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Voltar ao Menu
                    </button>
                    <h1 className="text-2xl font-black text-heading flex items-center gap-3">
                        <Users size={28} className="text-accent" />
                        Colaboradores
                    </h1>
                    <p className="text-body-secondary mt-1">Gerencie os perfis dos prestadores</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search size={18} className="absolute left-3 top-3 text-muted" />
                        <input
                            placeholder="Buscar nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 surface-input rounded-xl"
                        />
                    </div>

                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Novo Colaborador</span>
                        <span className="md:hidden">Novo</span>
                    </button>
                </div>
            </div>

            {/* Stats / Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {DEPARTMENTS.map(dept => {
                    const count = profiles.filter(p => p.department === dept.value && p.isActive).length;
                    const Icon = dept.icon;
                    const isSelected = filterDept === dept.value;

                    return (
                        <button
                            key={dept.value}
                            onClick={() => setFilterDept(isSelected ? null : dept.value)}
                            className={`surface-card p-4 flex items-center gap-3 transition-all border-2 text-left ${isSelected ? 'border-accent bg-accent/5' : 'border-transparent hover:border-border'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-fill-secondary ${dept.color}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-heading">{count}</p>
                                <p className="text-xs text-muted">{dept.label}</p>
                            </div>
                            {isSelected && <Check size={16} className="ml-auto text-accent" />}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            {filteredProfiles.length === 0 ? (
                <div className="surface-card p-12 text-center">
                    <Users size={48} className="mx-auto text-muted mb-4" />
                    <p className="text-heading font-bold mb-2">Nenhum colaborador encontrado</p>
                    <p className="text-muted text-sm">
                        {searchTerm || filterDept ? 'Tente ajustar os filtros' : 'Clique em "Novo Colaborador" para adicionar'}
                    </p>
                    {(searchTerm || filterDept) && (
                        <button
                            onClick={() => { setSearchTerm(''); setFilterDept(null); }}
                            className="mt-4 text-accent font-bold hover:underline"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProfiles.map(profile => (
                        <div
                            key={profile.id}
                            className={`surface-card p-5 flex items-center justify-between ${!profile.isActive ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg">
                                    {profile.user.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-heading">{profile.user.name}</p>
                                        {!profile.isActive && (
                                            <span className="text-[10px] px-2 py-0.5 bg-error/10 text-error rounded-full font-bold">INATIVO</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted">{profile.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    {getDepartmentIcon(profile.department)}
                                    <span className="text-sm font-medium text-body-secondary capitalize">{profile.department}</span>
                                </div>

                                <div className="text-right hidden md:block">
                                    {profile.payModel === 'daily' && profile.dailyRate && (
                                        <p className="text-sm font-bold text-heading">
                                            R$ {profile.dailyRate.toFixed(2)}<span className="text-muted font-normal">/dia</span>
                                        </p>
                                    )}
                                    {profile.payModel === 'per_leg' && profile.perLegRate && (
                                        <p className="text-sm font-bold text-heading">
                                            R$ {profile.perLegRate.toFixed(2)}<span className="text-muted font-normal">/pernada</span>
                                        </p>
                                    )}
                                    {profile.department === 'transport' && profile.payModel === 'per_leg' && (
                                        <p className="text-sm font-bold text-heading">
                                            60% <span className="text-muted font-normal">Liquido</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => handleToggleActive(profile, e)}
                                    title={profile.isActive ? "Desativar no RH" : "Ativar no RH"}
                                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${profile.isActive ? 'bg-success' : 'bg-fill-tertiary'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${profile.isActive ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>

                                <button
                                    onClick={() => navigate(`/staff/hr/collaborators/${profile.id}`)}
                                    title="Ficha Cadastral (Bio, Endereço, CNH)"
                                    className="p-2 hover:bg-fill-secondary rounded-lg transition-colors"
                                >
                                    <FileText size={18} className="text-secondary" />
                                </button>

                                <button
                                    onClick={() => {
                                        navigate(`/staff/users?email=${profile.user.email}`);
                                    }}
                                    title="Acesso e Permissões (Senha, Cargo)"
                                    className="p-2 hover:bg-fill-secondary rounded-lg transition-colors"
                                >
                                    <Shield size={18} className="text-accent" />
                                </button>

                                <button
                                    onClick={() => handleEdit(profile)}
                                    title="Editar Taxas e Departamento"
                                    className="p-2 hover:bg-fill-secondary rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} className="text-muted" />
                                </button>

                                <button
                                    onClick={(e) => handleDeleteClick(profile, e)}
                                    title="Excluir Perfil de Colaborador"
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} className="text-error" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-elevated p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-heading">
                                {editingProfile ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-muted hover:text-heading">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* User Select */}
                            {!editingProfile && (
                                <div>
                                    <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                        Usuário
                                    </label>
                                    <select
                                        value={formData.userId}
                                        onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                        className="w-full surface-input px-4 py-3 text-heading"
                                    >
                                        <option value="">Selecione um usuário</option>
                                        {availableUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Department */}
                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Departamento
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DEPARTMENTS.map(dept => {
                                        const Icon = dept.icon;
                                        return (
                                            <button
                                                key={dept.value}
                                                onClick={() => setFormData({ ...formData, department: dept.value })}
                                                className={`p-3 rounded-xl flex items-center gap-2 transition-all ${formData.department === dept.value
                                                    ? 'bg-accent text-white'
                                                    : 'surface-input text-body-secondary'
                                                    }`}
                                            >
                                                <Icon size={18} />
                                                <span className="font-medium text-sm">{dept.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Pay Model */}
                            <div>
                                <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                    Modelo de Pagamento
                                </label>
                                <div className="flex gap-2">
                                    {PAY_MODELS.map(pm => (
                                        <button
                                            key={pm.value}
                                            onClick={() => setFormData({ ...formData, payModel: pm.value })}
                                            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${formData.payModel === pm.value
                                                ? 'bg-accent text-white'
                                                : 'surface-input text-body-secondary'
                                                }`}
                                        >
                                            {pm.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rates */}
                            {formData.department === 'transport' && formData.payModel === 'per_leg' ? (
                                <div className="p-4 bg-fill-secondary rounded-xl text-center border border-accent/20">
                                    <p className="text-sm font-bold text-accent mb-1">Regra de Comissionamento Automática</p>
                                    <p className="text-xs text-muted">
                                        O motorista receberá <strong>60%</strong> do valor líquido (descontados 6% de impostos) de cada transporte realizado.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                        Valor Diária (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dailyRate}
                                        onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                                        className="w-full surface-input px-4 py-3 text-heading"
                                        placeholder="0.00"
                                    />
                                    <p className="text-[10px] text-muted mt-1">*Aplicável apenas para modelo Diária/Fixo</p>
                                </div>
                            )}

                            {/* Additional Benefits (Daily Model) */}
                            {formData.payModel === 'daily' && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                                Auxílio (R$)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.otherBenefits}
                                                onChange={e => setFormData({ ...formData, otherBenefits: e.target.value })}
                                                className="w-full surface-input px-4 py-3 text-heading"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                                VT (R$)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.transportVoucher}
                                                onChange={e => setFormData({ ...formData, transportVoucher: e.target.value })}
                                                className="w-full surface-input px-4 py-3 text-heading"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                                VR (R$)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.mealVoucher}
                                                onChange={e => setFormData({ ...formData, mealVoucher: e.target.value })}
                                                className="w-full surface-input px-4 py-3 text-heading"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-fill-secondary rounded-xl">
                                        <p className="text-sm font-bold text-heading flex justify-between">
                                            <span>Total Diária Estimada:</span>
                                            <span>R$ {(
                                                (parseFloat(formData.dailyRate) || 0) +
                                                (parseFloat(formData.otherBenefits) || 0) +
                                                (parseFloat(formData.transportVoucher) || 0) +
                                                (parseFloat(formData.mealVoucher) || 0)
                                            ).toFixed(2)}</span>
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 surface-input rounded-xl">
                                <span className="font-medium text-heading">Colaborador Ativo</span>
                                <button
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-success' : 'bg-fill-tertiary'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                className="w-full btn-primary py-4 font-black uppercase tracking-wider"
                            >
                                {editingProfile ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && profileToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-elevated p-8 max-w-md w-full">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                                <AlertTriangle size={32} className="text-error" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-heading text-center mb-3">
                            Excluir Perfil de Colaborador
                        </h2>

                        <div className="bg-error/5 border-2 border-error/20 rounded-xl p-4 mb-6">
                            <p className="text-sm text-body-secondary text-center mb-2">
                                Você está prestes a excluir o perfil de:
                            </p>
                            <p className="text-lg font-bold text-heading text-center">
                                {profileToDelete.user.name}
                            </p>
                            <p className="text-xs text-muted text-center mt-1">
                                {profileToDelete.user.email}
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3 text-sm text-body-secondary">
                                <AlertTriangle size={16} className="text-error mt-0.5 flex-shrink-0" />
                                <p>
                                    <strong className="text-error">ATENÇÃO:</strong> Esta ação não pode ser desfeita. O histórico de pagamentos e dados do RH serão removidos permanentemente.
                                </p>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-body-secondary">
                                <AlertTriangle size={16} className="text-error mt-0.5 flex-shrink-0" />
                                <p>
                                    O usuário <strong>{profileToDelete.user.name}</strong> não será excluído do sistema, apenas seu perfil de colaborador no RH.
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-black text-muted uppercase tracking-wider mb-2 block">
                                Digite "EXCLUIR" para confirmar (em maiúsculas)
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="EXCLUIR"
                                className="w-full surface-input px-4 py-3 text-heading font-mono text-center text-lg"
                                autoFocus
                            />
                            {deleteConfirmText && deleteConfirmText !== 'EXCLUIR' && (
                                <p className="text-xs text-error mt-2 text-center font-bold">
                                    Digite exatamente "EXCLUIR" em maiúsculas
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setProfileToDelete(null);
                                    setDeleteConfirmText('');
                                }}
                                className="flex-1 px-6 py-3 rounded-xl font-bold bg-fill-secondary text-body-secondary hover:bg-fill-tertiary transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmText !== 'EXCLUIR'}
                                className="flex-1 px-6 py-3 rounded-xl font-black bg-error text-white hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Excluir Definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
