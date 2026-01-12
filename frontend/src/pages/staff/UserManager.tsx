import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Shield,
    Lock,
    ChevronRight,
    Search as SearchIcon,
    X,
    User,
    Trash2,
    Save,
    MapPin,
    Calendar,
    Plus,
    Trash,
    Filter,
    ArrowUpDown,
    Check,
    Briefcase,
    Phone,
    FileText,
    RotateCcw,
    Unlock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import { DIVISIONS, DIVISION_LABELS, getDivisionBgClass, getDivisionTextClass } from '../../constants/divisions';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';

interface UserData {
    id: string;
    email: string;
    division: string;  // Divisão/Departamento (determina permissões)
    role?: string;     // Cargo livre (opcional, apenas informativo)
    name?: string;
    phone?: string;
    notes?: string;
    permissions?: string; // JSON string from DB
    createdAt: string;
    customer?: {
        id: string;
        name: string;
    };
    firstName?: string;
    lastName?: string;
    extraEmails?: string[];
    extraPhones?: string[];
    extraAddresses?: string[];
    staffId?: number;
    admissionDate?: string;
    birthday?: string;
    document?: string;
    address?: string;
    color?: string;
    seqId?: number;
    plainPassword?: string;
    isEligible?: boolean;
    isSupportAgent?: boolean;
    active?: boolean;
}

const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'kanban', label: 'Agendamentos' },
    { id: 'transport', label: 'Logística' },
    { id: 'quotes', label: 'Orçamentos' },
    { id: 'customers', label: 'Clientes' },
    { id: 'services', label: 'Serviços' },
    { id: 'billing', label: 'Financeiro' },
    { id: 'management', label: 'Gestão' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'users', label: 'Usuários' }
];

export default function UserManager() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterDivision, setFilterDivision] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'id'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [tab, setTab] = useState<'active' | 'trash'>('active');
    const [searchParams, setSearchParams] = useSearchParams();

    const { user: currentUser } = useAuthStore();
    // STRICT ROLE CHECK (Not just email)
    const isMaster = currentUser?.role === 'MASTER';



    // Edit Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        notes: '',
        division: 'CLIENTE',
        role: '',
        permissions: [] as string[],
        birthday: '',
        admissionDate: '',
        document: '',
        address: '',
        color: '#3B82F6',
        isEligible: false,
        isSupportAgent: false,
        active: true,
        isCustomRole: false
    });

    const [rolePermissions, setRolePermissions] = useState<{ role: string, label?: string, permissions: string }[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedConfigRole, setSelectedConfigRole] = useState('OPERACIONAL');
    const [isAddingRole, setIsAddingRole] = useState(false);
    const [newRoleData, setNewRoleData] = useState({ slug: '', label: '' });

    // Role editing local state
    const [editingRoleLabel, setEditingRoleLabel] = useState('');
    const [editingRolePerms, setEditingRolePerms] = useState<string[]>([]);
    const [hasRoleChanges, setHasRoleChanges] = useState(false);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Password Visibility
    const [visiblePasswordIds, setVisiblePasswordIds] = useState<string[]>([]);
    const [showModalPassword, setShowModalPassword] = useState(false);

    // Customer Detail Modal (Popup)
    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

    const handleOpenCustomerDetail = (cid: string) => {
        setViewCustomerId(cid);
        setIsCustomerModalVisible(true);
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswordIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/management/users${tab === 'trash' ? '?trash=true' : ''}`);
            setUsers(res.data);

            const roleRes = await api.get('/management/roles/permissions');
            setRolePermissions(roleRes.data);

            // Sync local editing state
            const current = roleRes.data.find((rp: any) => rp.role === selectedConfigRole);
            if (current) {
                setEditingRoleLabel(current.label || current.role);
                setEditingRolePerms(JSON.parse(current.permissions));
                setHasRoleChanges(false);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'MASTER' ||
            currentUser?.division === 'DIRETORIA' || currentUser?.division === 'ADMIN';
        if (isStaff) {
            fetchUsers();
        }
    }, [currentUser, tab]);

    // Deep Link Logic
    useEffect(() => {
        if (!isLoading && users.length > 0) {
            const editId = searchParams.get('editId');
            const emailParam = searchParams.get('email');

            if (editId || emailParam) {
                const foundUser = users.find(u => u.id === editId || u.email === emailParam);
                if (foundUser) {
                    handleOpenUser(foundUser);
                    // Optional: Clean URL
                    setSearchParams({}, { replace: true });
                }
            }
        }
    }, [isLoading, users, searchParams]);

    useEffect(() => {
        const current = rolePermissions.find(rp => rp.role === selectedConfigRole);
        if (current) {
            setEditingRoleLabel(current.label || current.role);
            setEditingRolePerms(JSON.parse(current.permissions));
            setHasRoleChanges(false);
        }
    }, [selectedConfigRole, rolePermissions]);

    const handleOpenUser = (user: UserData) => {
        setSelectedUser(user);
        let permissions: string[] = [];
        try {
            if (user.permissions) permissions = JSON.parse(user.permissions);
        } catch (e) { console.error("Error parsing permissions", e); }

        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            name: user.name || user.customer?.name || '',
            email: user.email,
            password: '',
            phone: user.phone || '',
            notes: user.notes || '',
            division: user.division || 'CLIENTE',
            role: user.role || '',
            permissions,
            birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
            admissionDate: user.admissionDate ? new Date(user.admissionDate).toISOString().split('T')[0] : '',
            document: user.document || '',
            address: user.address || '',
            color: user.color || '#3B82F6',
            isEligible: user.isEligible !== undefined ? user.isEligible : false,
            isSupportAgent: user.isSupportAgent !== undefined ? user.isSupportAgent : false,
            active: user.active !== undefined ? user.active : true,
            isCustomRole: user.role ? !['ADMIN', 'GESTAO', 'CLIENTE', 'MASTER', 'OPERACIONAL', 'SPA'].includes(user.role.toUpperCase()) : false
        });
        setIsModalOpen(true);
        setShowModalPassword(false);
    };

    const handleAddNewUser = () => {
        setSelectedUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            name: '',
            email: '',
            password: '',
            phone: '',
            notes: '',
            division: 'CLIENTE',
            role: 'CLIENTE',
            permissions: [] as string[],
            birthday: '',
            admissionDate: '',
            document: '',
            address: '',
            color: '#3B82F6',
            isEligible: false,
            isSupportAgent: false,
            active: true,
            isCustomRole: false
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
        const msg = selectedUser ? 'Deseja salvar as alterações neste usuário?' : 'Deseja criar este novo colaborador?';
        if (!window.confirm(msg)) return;
        try {
            const payload = {
                ...formData,
                isEligible: formData.division === 'CLIENTE' ? false : formData.isEligible,
                permissions: JSON.stringify(formData.permissions)
            };

            // Se for um cargo customizado, criar a entrada de permissões para que apareça no seletor no futuro
            if ((formData as any).isCustomRole && formData.role) {
                try {
                    await api.put(`/management/roles/${formData.role.toUpperCase()}/permissions`, {
                        label: formData.role,
                        permissions: JSON.stringify(formData.permissions)
                    });
                } catch (e) {
                    console.error("Erro ao registrar novo cargo:", e);
                }
            }

            console.log('💾 Salvando usuário com divisão:', {
                division: payload.division,
                role: payload.role,
                email: payload.email
            });

            if (selectedUser) {
                await api.put(`/management/users/${selectedUser.id}`, payload);
            } else {
                if (!formData.email || !formData.password) {
                    alert('E-mail e senha são obrigatórios para novos usuários');
                    return;
                }
                await api.post('/management/users', payload);
            }

            toast.success('Usuário salvo com sucesso!');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            console.error('Erro ao salvar usuário:', err);
            console.error('Detalhes do erro:', err.response?.data);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Erro ao salvar usuário';
            toast.error(errorMsg);
            alert(`Erro ao salvar: ${errorMsg}`);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        const msg = tab === 'trash' ? 'Tem certeza que deseja excluir PERMANENTEMENTE este usuário?' : 'Tem certeza que deseja excluir este usuário?';
        if (!window.confirm(msg)) return;
        try {
            if (tab === 'trash') {
                // For users, we don't have a permanent delete endpoint yet, so we just keep it in trash?
                // Actually, let's just use the same delete endpoint. If the backend is modified to handle it.
                // For now, let's just say "Restricted"
                toast.error('Exclusão permanente não implementada.');
                return;
            }
            await api.delete(`/management/users/${selectedUser.id}`);
            toast.success('Usuário excluído');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert('Erro ao excluir usuário');
        }
    };

    const handleRestoreUser = async (user: UserData) => {
        if (!window.confirm('Deseja restaurar este usuário?')) return;
        try {
            await api.post(`/management/users/${user.id}/restore`);
            toast.success('Usuário restaurado!');
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao restaurar usuário');
        }
    };

    const handleBulkRestore = async () => {
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} usuário(s)?`)) return;
        try {
            await Promise.all(selectedIds.map(id => api.post(`/management/users/${id}/restore`)));
            toast.success('Usuários restaurados!');
            setSelectedIds([]);
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao restaurar usuários');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedIds(filteredUsers.length === selectedIds.length ? [] : filteredUsers.map(u => u.id));
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`TEM CERTEZA que deseja excluir ${selectedIds.length} usuário(s)?\n\nEsta ação é IRREVERSÍVEL.`)) return;

        try {
            const results = await Promise.allSettled(
                selectedIds.map(id => api.delete(`/management/users/${id}`))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.error(`${succeeded} excluído(s).\n${failed} falharam.`);
            } else {
                toast.success(`${succeeded} usuário(s) excluído(s)!`);
            }

            await fetchUsers();
            setSelectedIds([]);
        } catch (error) {
            toast.error('Erro ao excluir usuários');
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleData.slug || !newRoleData.label) {
            alert('Slug e Nome do cargo são obrigatórios');
            return;
        }
        const slug = newRoleData.slug.toUpperCase().replace(/\s+/g, '_');
        try {
            await api.put(`/management/roles/${slug}/permissions`, {
                label: newRoleData.label,
                permissions: JSON.stringify([])
            });
            setNewRoleData({ slug: '', label: '' });
            setIsAddingRole(false);
            fetchUsers();
            toast.success('Novo cargo criado!');
        } catch (err) {
            alert('Erro ao criar cargo');
        }
    };

    const handleDeleteRole = async (roleSlug: string) => {
        if (['ADMIN', 'GESTAO', 'CLIENTE', 'MASTER', 'OPERACIONAL', 'SPA'].includes(roleSlug.toUpperCase())) {
            alert('Este cargo é protegido pelo sistema.');
            return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir o cargo ${roleSlug}? Usuários vinculados podem perder acesso.`)) return;
        try {
            await api.delete(`/management/roles/${roleSlug}`);
            if (selectedConfigRole === roleSlug) setSelectedConfigRole('OPERACIONAL');
            fetchUsers();
            toast.success('Cargo excluído');
        } catch (err) {
            alert('Erro ao excluir cargo');
        }
    };

    const handleSaveRoleConfig = async () => {
        if (!window.confirm(`Deseja salvar as alterações para o cargo ${editingRoleLabel}?`)) return;
        try {
            await api.put(`/management/roles/${selectedConfigRole}/permissions`, {
                label: editingRoleLabel,
                permissions: JSON.stringify(editingRolePerms)
            });
            toast.success('Configurações de cargo salvas!');
            setHasRoleChanges(false);
            fetchUsers();
        } catch (err) {
            toast.error('Erro ao salvar configurações do cargo');
        }
    };

    const togglePermission = (moduleId: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(moduleId);
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter(p => p !== moduleId)
                    : [...prev.permissions, moduleId]
            };
        });
    };

    const filteredUsers = users
        .filter(u => {
            const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.document?.includes(searchTerm) ||
                u.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDivision = filterDivision === 'ALL' || u.division === filterDivision;

            return matchesSearch && matchesDivision;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') {
                const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.name || '';
                const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.name || '';
                comparison = nameA.localeCompare(nameB);
            } else if (sortBy === 'date') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'id') {
                const idA = a.staffId || a.seqId || 0;
                const idB = b.staffId || b.seqId || 0;
                comparison = idA - idB;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'MASTER' && currentUser?.division !== 'DIRETORIA' && currentUser?.division !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-12 rounded-[48px] shadow-2xl max-w-md border border-gray-100"
                >
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                        <Shield size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-secondary mb-4">Acesso Restrito</h2>
                    <p className="text-gray-400 font-bold mb-10 leading-relaxed">
                        Esta área é exclusiva para administradores. <br />
                        Seu nível atual de acesso não permite gerenciar usuários.
                    </p>
                    <BackButton />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10 pb-28 md:pb-10">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Gestão de <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Acessos</span></h1>
                            <p className="text-gray-500 mt-3 font-medium">Controle total sobre usuários, permissões e hierarquias.</p>
                        </div>

                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                            <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
                                <span className="text-xs font-bold text-secondary">{users.length} Colaboradores</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsRoleModalOpen(true)}
                                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-secondary transition-colors group flex items-center gap-2"
                                >
                                    <Lock size={18} className="text-gray-400 group-hover:text-secondary" />
                                    <span className="text-xs font-bold pr-2">Cargos</span>
                                </button>
                                <button
                                    onClick={handleAddNewUser}
                                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Novo Usuário
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Active/Trash */}
                    <div className="mt-8 flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
                        <button
                            onClick={() => { setTab('active'); setSelectedIds([]); }}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'active' ? 'bg-secondary text-white shadow-lg scale-105' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => { setTab('trash'); setSelectedIds([]); }}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab === 'trash' ? 'bg-red-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Trash size={14} /> Lixeira
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar colaboradores..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all font-medium"
                            />
                        </div>

                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar flex-1 min-w-0">
                            {[
                                { division: 'ALL', label: 'Todos', color: 'bg-gray-200 text-gray-700' },
                                { division: DIVISIONS.SPA, label: DIVISION_LABELS.SPA, color: getDivisionBgClass(DIVISIONS.SPA) + ' ' + getDivisionTextClass(DIVISIONS.SPA) },
                                { division: DIVISIONS.COMERCIAL, label: DIVISION_LABELS.COMERCIAL, color: getDivisionBgClass(DIVISIONS.COMERCIAL) + ' ' + getDivisionTextClass(DIVISIONS.COMERCIAL) },
                                { division: DIVISIONS.LOGISTICA, label: DIVISION_LABELS.LOGISTICA, color: getDivisionBgClass(DIVISIONS.LOGISTICA) + ' ' + getDivisionTextClass(DIVISIONS.LOGISTICA) },
                                { division: DIVISIONS.GERENCIA, label: DIVISION_LABELS.GERENCIA, color: getDivisionBgClass(DIVISIONS.GERENCIA) + ' ' + getDivisionTextClass(DIVISIONS.GERENCIA) },
                                { division: DIVISIONS.DIRETORIA, label: DIVISION_LABELS.DIRETORIA, color: getDivisionBgClass(DIVISIONS.DIRETORIA) + ' ' + getDivisionTextClass(DIVISIONS.DIRETORIA) },
                                { division: DIVISIONS.ADMIN, label: DIVISION_LABELS.ADMIN, color: getDivisionBgClass(DIVISIONS.ADMIN) + ' ' + getDivisionTextClass(DIVISIONS.ADMIN) },
                            ].map(filter => (
                                <button
                                    key={filter.division}
                                    onClick={() => setFilterDivision(filter.division)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterDivision === filter.division
                                        ? filter.color + ' shadow-md'
                                        : 'text-gray-400 hover:text-secondary hover:bg-gray-50'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchUsers}
                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm group active:rotate-180 duration-500"
                                title="Recarregar Lista"
                            >
                                <RotateCcw size={16} className={isLoading ? 'animate-spin text-primary' : ''} />
                            </button>

                            <button
                                onClick={() => setSortBy(prev => prev === 'name' ? 'date' : prev === 'date' ? 'id' : 'name')}
                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-secondary transition-colors shadow-sm flex items-center gap-2"
                            >
                                <ArrowUpDown size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{sortBy === 'name' ? 'Nome' : sortBy === 'date' ? 'Data' : 'ID'}</span>
                            </button>

                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-secondary transition-colors shadow-sm"
                            >
                                <Filter size={16} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Bulk Action Bar */}
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="px-8 pb-6 flex items-center gap-6"
                            >
                                <div className="bg-secondary text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 flex-1">
                                    <span className="bg-primary text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center">
                                        {selectedIds.length}
                                    </span>
                                    <p className="text-sm font-bold">Usuários Selecionados</p>
                                    <div className="h-6 w-px bg-white/20 ml-auto"></div>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> EXCLUIR EM MASSA
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="text-white/50 hover:text-white text-xs font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <div className="h-6 w-px bg-white/20"></div>
                                    {tab === 'trash' && (
                                        <button
                                            onClick={handleBulkRestore}
                                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                                        >
                                            <RotateCcw size={14} /> RESTAURAR SELECIONADOS
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">
                                        <input
                                            type="checkbox"
                                            checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Departamento</th>
                                    {isMaster && (
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha</th>
                                    )}
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cadastro</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((u) => {
                                    const isSelected = selectedIds.includes(u.id);
                                    return (
                                        <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}>
                                            <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(u.id)}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${getDivisionBgClass(u.division || u.role || 'CLIENTE')} ${getDivisionTextClass(u.division || u.role || 'CLIENTE')}`}
                                                        style={u.color ? { backgroundColor: u.color, color: 'white' } : undefined}
                                                    >
                                                        {(u.firstName?.[0] || u.name?.[0] || u.email[0]).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-secondary text-sm">
                                                                {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.name || u.email.split('@')[0]}
                                                            </span>
                                                            <span className="bg-indigo-50 text-indigo-500 text-[9px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">
                                                                {u.division === 'CLIENTE' ? 'CL' : 'OP'}-{String(u.staffId ?? u.seqId).padStart(4, '0')}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 font-bold">{u.email}</span>
                                                        {u.document && (
                                                            <span className="text-[10px] text-primary font-black mt-1 flex items-center gap-1">
                                                                <FileText size={10} /> {u.document}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                {u.division !== 'CLIENTE' ? (
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isEligible !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${u.isEligible !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        {u.isEligible !== false ? 'Disponível' : 'Bloqueado'}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">-</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`w-3 h-3 rounded-full ${getDivisionBgClass(u.division || u.role || 'CLIENTE')}`}
                                                            title={DIVISION_LABELS[(u.division || u.role) as keyof typeof DIVISION_LABELS] || u.division || u.role}
                                                        />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full w-fit ${getDivisionBgClass(u.division || u.role || 'CLIENTE')} ${getDivisionTextClass(u.division || u.role || 'CLIENTE')}`}>
                                                            {DIVISION_LABELS[(u.division || u.role) as keyof typeof DIVISION_LABELS] || u.division || u.role || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {u.role && u.division && (
                                                        <span className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-tight">
                                                            Cargo: {u.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {
                                                isMaster && (
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    togglePasswordVisibility(u.id);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-all ${visiblePasswordIds.includes(u.id) ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 hover:text-secondary'}`}
                                                                title={visiblePasswordIds.includes(u.id) ? "Ocultar Senha" : "Ver Senha"}
                                                            >
                                                                {visiblePasswordIds.includes(u.id) ? <Unlock size={14} /> : <Lock size={14} />}
                                                            </button>
                                                            <span className={`text-[11px] font-black tracking-tight select-all transition-all ${visiblePasswordIds.includes(u.id) ? 'text-secondary font-mono' : 'text-gray-300'}`}>
                                                                {visiblePasswordIds.includes(u.id) ? (u.plainPassword || 'SEM SENHA') : '••••••••'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )
                                            }
                                            <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {tab === 'trash' ? (
                                                        <button onClick={() => handleRestoreUser(u)} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all" title="Restaurar Usuário">
                                                            <RotateCcw size={18} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {u.customer?.id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenCustomerDetail(u.customer!.id);
                                                                    }}
                                                                    className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-all flex items-center justify-center"
                                                                    title="Ver Perfil de Cliente Completo (Popup)"
                                                                >
                                                                    <User size={18} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleOpenUser(u)} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-secondary transition-all">
                                                                <ChevronRight size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main >

            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[80]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[80] flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-black text-secondary">{selectedUser ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                                    <p className="text-sm font-bold text-gray-400">{formData.email || 'Cadastre os dados abaixo'}</p>
                                </div>
                                <X size={24} className="cursor-pointer text-gray-400" onClick={() => setIsModalOpen(false)} />
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Primeiro Nome</label>
                                        <input
                                            value={formData.firstName}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Sobrenome</label>
                                        <input
                                            value={formData.lastName}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">E-mail</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                                            {selectedUser ? 'Redefinir Senha' : 'Senha Provisória'}
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={selectedUser ? "Deixe em branco para manter a atual" : "••••••••"}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        {isMaster && selectedUser?.plainPassword && (
                                            <div className="mt-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Shield size={14} className="text-primary" />
                                                        <span className="text-[10px] font-black text-secondary uppercase tracking-tight">Senha Atual Registrada</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowModalPassword(!showModalPassword)}
                                                        className={`p-1.5 rounded-lg transition-all ${showModalPassword ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-400 shadow-sm'}`}
                                                    >
                                                        {showModalPassword ? <Unlock size={14} /> : <Lock size={14} />}
                                                    </button>
                                                </div>
                                                <div className="mt-2 flex items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-inner">
                                                    <span className={`text-sm font-black tracking-widest ${showModalPassword ? 'text-secondary font-mono select-all' : 'text-gray-200'}`}>
                                                        {showModalPassword ? selectedUser.plainPassword : '••••••••'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase"><Briefcase size={14} /> Divisão & Cargo</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-gray-400 mb-1">Divisão / Departamento</label>
                                            <select
                                                value={formData.division}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const isCliente = val === 'CLIENTE';
                                                    setFormData({
                                                        ...formData,
                                                        division: val,
                                                        role: isCliente ? 'CLIENTE' : (formData.role === 'CLIENTE' ? 'OPERACIONAL' : formData.role),
                                                        permissions: isCliente ? [] : formData.permissions
                                                    });
                                                }}
                                                className={`w-full border-none rounded-xl px-4 py-3 font-bold ${getDivisionBgClass(formData.division)} ${getDivisionTextClass(formData.division)}`}
                                            >
                                                {Object.entries(DIVISION_LABELS)
                                                    .map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                            </select>
                                            <p className="text-[9px] text-gray-400 mt-1 italic">A divisão determina os acessos padrão do usuário no sistema.</p>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-gray-400 mb-1">Cargo / Função</label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={(formData as any).isCustomRole ? 'CUSTOM' : formData.role || 'OPERACIONAL'}
                                                    onChange={async (e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM') {
                                                            setFormData({ ...formData, role: '', isCustomRole: true } as any);
                                                        } else {
                                                            const isCliente = val === 'CLIENTE';
                                                            const newPermissions = isCliente ? [] : JSON.parse(rolePermissions.find(rp => rp.role === val)?.permissions || '[]');

                                                            setFormData({
                                                                ...formData,
                                                                role: val,
                                                                division: isCliente ? 'CLIENTE' : (formData.division === 'CLIENTE' ? 'COMERCIAL' : formData.division),
                                                                isCustomRole: false,
                                                                permissions: newPermissions
                                                            } as any);
                                                        }
                                                    }}
                                                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 font-bold text-secondary"
                                                >
                                                    <option value="CLIENTE">Perfil: Cliente (Predefinido)</option>

                                                    {/* Only Master can create other Masters */}
                                                    {isMaster && <option value="MASTER">👑 MASTER (Super Usuário)</option>}

                                                    {rolePermissions
                                                        .filter(rp => rp.role !== 'CLIENTE' && rp.role !== 'MASTER')
                                                        // Only Master can create Admins
                                                        .filter(rp => isMaster || rp.role !== 'ADMIN')
                                                        .map(rp => (
                                                            <option key={rp.role} value={rp.role}>
                                                                {rp.label || rp.role}
                                                            </option>
                                                        ))
                                                    }
                                                    <option value="CUSTOM">+ Digitar novo cargo...</option>
                                                </select>
                                            </div>

                                            {(formData as any).isCustomRole && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-3"
                                                >
                                                    <input
                                                        type="text"
                                                        value={formData.role}
                                                        onChange={e => setFormData({ ...formData, role: e.target.value.toUpperCase() })}
                                                        placeholder="Digite o nome do novo cargo..."
                                                        className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 font-bold text-secondary"
                                                        autoFocus
                                                    />
                                                    <p className="text-[9px] text-primary font-bold mt-1 uppercase italic">Este cargo será salvo e poderá ser usado em outros perfis.</p>
                                                </motion.div>
                                            )}

                                            {/* (Link removido daqui e movido para a seção de status abaixo para melhor organização) */}
                                        </div>

                                    </div>
                                </div>

                                {formData.division !== 'CLIENTE' && (
                                    <div className="pt-4 border-t border-gray-50 mt-4">
                                        <label className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors border border-primary/10">
                                            <input
                                                type="checkbox"
                                                checked={formData.isEligible}
                                                onChange={e => setFormData({ ...formData, isEligible: e.target.checked })}
                                                className="w-5 h-5 rounded-lg text-primary focus:ring-primary transition-all"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-secondary uppercase tracking-tight">Elegível para Execução</div>
                                                <div className="text-[10px] font-bold text-gray-400">Define se este profissional aparece nas listas de seleção para serviços e logística.</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.isEligible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {formData.isEligible ? 'ATIVO' : 'INATIVO'}
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors border border-blue-100 mt-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.isSupportAgent}
                                                onChange={e => setFormData({ ...formData, isSupportAgent: e.target.checked })}
                                                className="w-5 h-5 rounded-lg text-blue-500 focus:ring-blue-500 transition-all"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-secondary uppercase tracking-tight">Agente de Suporte</div>
                                                <div className="text-[10px] font-bold text-gray-400">Permite que clientes iniciem conversas de suporte com este colaborador.</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.isSupportAgent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {formData.isSupportAgent ? 'HABILITADO' : 'DESABILITADO'}
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* STATUS E ACESSO DO CLIENTE */}
                                {formData.division === 'CLIENTE' && (
                                    <div className="pt-4 border-t border-gray-50 mt-4 space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                                            <Shield size={14} /> Status e Acesso do Cliente
                                        </h4>

                                        {/* Classificação de Nível (Discreto) */}
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Nível de Classificação</div>
                                                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-sm ${(formData as any).customer?.riskLevel === 'Nivel 3' ? 'bg-red-500 text-white shadow-red-100' :
                                                    (formData as any).customer?.riskLevel === 'Nivel 2' ? 'bg-amber-500 text-white shadow-amber-100' :
                                                        'bg-green-500 text-white shadow-green-100'
                                                    }`}>
                                                    {(formData as any).customer?.riskLevel || 'Nivel 1'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['Nivel 1', 'Nivel 2', 'Nivel 3'].map(lvl => (
                                                    <button
                                                        key={lvl}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            customer: {
                                                                ...((formData as any).customer || {}),
                                                                riskLevel: lvl
                                                            }
                                                        } as any)}
                                                        className={`py-2 rounded-xl text-[10px] font-black transition-all border ${((formData as any).customer?.riskLevel || 'Nivel 1') === lvl
                                                            ? (lvl === 'Nivel 3' ? 'bg-red-500 border-red-500 text-white shadow-md' :
                                                                lvl === 'Nivel 2' ? 'bg-amber-500 border-amber-500 text-white shadow-md' :
                                                                    'bg-green-600 border-green-600 text-white shadow-md')
                                                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-400 italic leading-tight">
                                                {(formData as any).customer?.riskLevel === 'Nivel 3' ? '⚠️ CRÍTICO: Problemas graves ou comportamento indesejado.' :
                                                    (formData as any).customer?.riskLevel === 'Nivel 2' ? '🔶 ATENÇÃO: Requer cuidados ou possui histórico de pendências.' :
                                                        '✅ NORMAL: Cliente exemplar sem restrições registradas.'}
                                            </p>
                                        </div>

                                        {/* Status Geral: Disponível (Tudo OK) */}
                                        {!((formData as any).customer?.isBlocked) && ((formData as any).customer?.canRequestQuotes !== false) && (
                                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                                                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                                                    <Check size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-black text-green-700 uppercase tracking-tight">Disponível (Tudo OK)</div>
                                                    <div className="text-[10px] font-bold text-green-600/70">O cliente possui acesso total ao sistema e orçamentos.</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bloquear Orçamentos */}
                                        <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200">
                                            <input
                                                type="checkbox"
                                                checked={!((formData as any).customer?.canRequestQuotes ?? true)}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...((formData as any).customer || {}),
                                                        canRequestQuotes: !e.target.checked
                                                    }
                                                } as any)}
                                                className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500 transition-all transition-all"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-amber-700 uppercase tracking-tight">Bloquear Orçamentos</div>
                                                <div className="text-[10px] font-bold text-amber-600/70">Inadimplência ou restrição. Impede novos pedidos.</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${!((formData as any).customer?.canRequestQuotes ?? true) ? 'bg-amber-200 text-amber-700' : 'bg-green-100 text-green-600'}`}>
                                                {!((formData as any).customer?.canRequestQuotes ?? true) ? 'BLOQUEADO' : 'LIBERADO'}
                                            </div>
                                        </label>

                                        {/* Bloquear Acesso Total */}
                                        <label className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl cursor-pointer hover:bg-red-100 transition-colors border border-red-200">
                                            <input
                                                type="checkbox"
                                                checked={(formData as any).customer?.isBlocked ?? false}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...((formData as any).customer || {}),
                                                        isBlocked: e.target.checked
                                                    }
                                                } as any)}
                                                className="w-5 h-5 rounded-lg text-red-500 focus:ring-red-500 transition-all transition-all"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-red-700 uppercase tracking-tight">Bloquear Acesso ao Sistema</div>
                                                <div className="text-[10px] font-bold text-red-600/70">Impede login e recuperação de senha. Histórico mantido.</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${(formData as any).customer?.isBlocked ? 'bg-red-200 text-red-700' : 'bg-green-100 text-green-600'}`}>
                                                {(formData as any).customer?.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                                            </div>
                                        </label>

                                        {/* Link para perfil completo (Se existir ID) */}
                                        {(formData as any).customer?.id && (
                                            <button
                                                onClick={() => handleOpenCustomerDetail((formData as any).customer.id)}
                                                className="w-full flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-50 transition-all group mt-2 text-left"
                                            >
                                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                                    <Briefcase size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-black text-blue-700 uppercase">Ver Perfil Completo do Cliente</div>
                                                    <div className="text-[9px] font-bold text-blue-400 italic">Ver pets, histórico de orçamentos e faturamento.</div>
                                                </div>
                                                <ChevronRight size={16} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase"><Lock size={14} /> Permissões Específicas</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {MODULES.map(m => (
                                            <label key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(m.id)}
                                                    onChange={() => togglePermission(m.id)}
                                                    className="w-4 h-4 rounded text-primary"
                                                />
                                                <span className="text-xs font-bold text-secondary">{m.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                {selectedUser && (
                                    <button onClick={handleDeleteUser} className="flex items-center gap-2 text-red-500 font-black text-xs hover:underline">
                                        <Trash2 size={16} /> Excluir Conta
                                    </button>
                                )}
                                <div className="flex gap-3 ml-auto">
                                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-400">Cancelar</button>
                                    <button onClick={handleSaveUser} className="btn-primary px-8 py-3 flex items-center gap-2">
                                        <Save size={18} /> Salvar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )
                }
            </AnimatePresence >

            {/* Modal de Configuração de Cargos (Top-Left) */}
            <AnimatePresence>
                {
                    isRoleModalOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoleModalOpen(false)} className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[90]" />
                            <motion.div
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                style={{
                                    position: 'fixed', left: window.innerWidth > 768 ? '280px' : '5%', top: '40px',
                                    zIndex: 100, width: 'calc(100% - 320px)', maxWidth: '850px', maxHeight: '90vh',
                                    display: 'flex', flexDirection: 'column'
                                }}
                                className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
                            >
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                                    <div>
                                        <h3 className="text-2xl font-black text-secondary flex items-center gap-3"><Lock size={22} className="text-primary" /> Configurar Cargos</h3>
                                        <p className="text-sm font-bold text-gray-400">Personalize o nome e permissões padrão de cada função</p>
                                    </div>
                                    <X size={24} className="cursor-pointer text-gray-400" onClick={() => setIsRoleModalOpen(false)} />
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                    <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-50">
                                        {rolePermissions.map(rp => (
                                            <div key={rp.role} className="relative group">
                                                <button
                                                    onClick={() => setSelectedConfigRole(rp.role)}
                                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedConfigRole === rp.role ? 'bg-secondary text-white shadow-xl scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                >
                                                    {rp.label || rp.role}
                                                </button>
                                                {!['ADMIN', 'GESTAO', 'CLIENTE', 'MASTER', 'OPERACIONAL', 'SPA'].includes(rp.role) && (
                                                    <div onClick={() => handleDeleteRole(rp.role)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform cursor-pointer shadow-lg"><X size={10} /></div>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => setIsAddingRole(!isAddingRole)} className="px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-[10px] font-black uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                                            <Plus size={14} /> Novo Cargo
                                        </button>
                                    </div>

                                    {isAddingRole && (
                                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 grid grid-cols-2 gap-4">
                                            <input placeholder="CÓDIGO (EX: VENDEDOR)" value={newRoleData.slug} onChange={e => setNewRoleData({ ...newRoleData, slug: e.target.value.toUpperCase() })} className="bg-white px-5 py-3 rounded-2xl font-bold text-xs" />
                                            <input placeholder="NOME (EX: Vendedor)" value={newRoleData.label} onChange={e => setNewRoleData({ ...newRoleData, label: e.target.value })} className="bg-white px-5 py-3 rounded-2xl font-bold text-xs" />
                                            <button onClick={handleCreateRole} className="col-span-2 bg-primary text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Criar Cargo</button>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Editar Nome de Exibição</label>
                                            <input
                                                value={editingRoleLabel}
                                                onChange={e => { setEditingRoleLabel(e.target.value); setHasRoleChanges(true); }}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-secondary text-lg"
                                            />
                                        </div>

                                        <div>
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4">Módulos Liberados por Padrão</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {MODULES.map(m => {
                                                    const active = editingRolePerms.includes(m.id);
                                                    return (
                                                        <div
                                                            key={m.id}
                                                            onClick={() => {
                                                                setEditingRolePerms(prev => active ? prev.filter(p => p !== m.id) : [...prev, m.id]);
                                                                setHasRoleChanges(true);
                                                            }}
                                                            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-white border-primary shadow-xl shadow-primary/5' : 'bg-white/50 border-transparent opacity-60'}`}
                                                        >
                                                            <span className={`text-xs font-black ${active ? 'text-secondary' : 'text-gray-400'}`}>{m.label}</span>
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${active ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                                                                {active && <Check size={14} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <p className="text-[10px] font-extra-bold text-gray-400 uppercase tracking-widest">{hasRoleChanges ? '⚠ Você tem alterações não salvas' : '✅ Configurações salvas'}</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setIsRoleModalOpen(false)} className="font-bold text-gray-400">Fechar</button>
                                        <button
                                            onClick={handleSaveRoleConfig}
                                            disabled={!hasRoleChanges}
                                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${hasRoleChanges ? 'bg-primary text-white shadow-xl hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >
            {/* MODAL DE DETALHES DO CLIENTE (POPUP SINGLE PAGE) */}
            < CustomerDetailsModal
                isOpen={isCustomerModalVisible}
                onClose={() => setIsCustomerModalVisible(false)}
                customerId={viewCustomerId}
                onUpdate={fetchUsers}
            />
        </div >
    );
}

