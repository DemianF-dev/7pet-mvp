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
    Users,
    RotateCcw,
    Unlock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../context/SocketContext';
import { PERMISSION_MODULES } from '../../constants/permissions'; // Import unified permissions
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
    pauseMenuEnabled?: boolean;
    allowedGames?: any;
    isOnline?: boolean;
}


export default function UserManager() {
    console.log('[UserManager] Component rendering...');
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
    const { socket } = useSocket();

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
        isCustomRole: false,
        pauseMenuEnabled: false,
        allowedGames: [] as string[]
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

    // Pagination
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);

    // Password Visibility
    const [visiblePasswordIds, setVisiblePasswordIds] = useState<string[]>([]);
    const [showModalPassword, setShowModalPassword] = useState(false);

    // Customer Detail Modal (Popup)
    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

    // --- REALTIME STATUS UPDATES ---
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { userId: string, status: 'online' | 'offline' }) => {
            // console.log(`[UserManager] User status update: ${data.userId} is ${data.status}`);
            setUsers(prevUsers => prevUsers.map(u =>
                u.id === data.userId ? { ...u, isOnline: data.status === 'online' } : u
            ));

            // Also update selectedUser if open
            if (selectedUser && selectedUser.id === data.userId) {
                setSelectedUser(prev => prev ? { ...prev, isOnline: data.status === 'online' } : null);
            }
        };

        socket.on('user_status', handleStatusUpdate);

        return () => {
            socket.off('user_status', handleStatusUpdate);
        };
    }, [socket, selectedUser]);

    // --- LOAD INITIAL DATA ---
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/management/users${tab === 'trash' ? '?trash=true' : ''}`);
            console.log('[UserManager] Users fetched:', res.data?.length || 0);
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                console.error('[UserManager] API returned non-array:', res.data);
                setUsers([]);
            }
            await fetchRoleConfigs();
        } catch (err) {
            console.error('[UserManager] Error fetching data:', err);
            toast.error('Erro ao carregar dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCustomerDetail = (cid: string) => {
        setViewCustomerId(cid);
        setIsCustomerModalVisible(true);
    };

    // --- EFFECT: Fetch Permissions & Users on Mount ---
    useEffect(() => {
        fetchUsers();
        fetchRoleConfigs();
    }, [searchParams, filterDivision, sortBy, sortOrder, tab]);

    // --- EFFECT: Sync Editing State when Role/Permissions Change ---
    useEffect(() => {
        const current = rolePermissions.find(rp => rp.role === selectedConfigRole);
        if (current) {
            setEditingRoleLabel(current.label || current.role);
            try {
                setEditingRolePerms(typeof current.permissions === 'string' ? JSON.parse(current.permissions) : current.permissions);
            } catch (e) { setEditingRolePerms([]); }
            setHasRoleChanges(false);
        }
    }, [selectedConfigRole, rolePermissions]);

    const fetchRoleConfigs = async () => {
        try {
            const { data } = await api.get('/management/roles');
            console.log('[UserManager] Role configs fetched:', data.length);
            setRolePermissions(data);
        } catch (error) {
            console.error('[UserManager] Error fetching role permissions:', error);
        }
    };

    const handleSaveRoleConfig = async () => {
        try {
            if (!editingRoleLabel) return;

            // Optimistic update
            const updatedRoles = rolePermissions.map(rp =>
                rp.role === selectedConfigRole
                    ? { ...rp, label: editingRoleLabel, permissions: JSON.stringify(editingRolePerms) }
                    : rp
            );

            const exists = rolePermissions.find(rp => rp.role === selectedConfigRole);
            if (!exists) {
                updatedRoles.push({
                    role: selectedConfigRole,
                    label: editingRoleLabel,
                    permissions: JSON.stringify(editingRolePerms)
                });
            }

            setRolePermissions(updatedRoles);

            await api.put(`/management/roles/${selectedConfigRole}`, {
                label: editingRoleLabel,
                permissions: editingRolePerms
            });

            toast.success('Configurações do cargo salvas!');
            setHasRoleChanges(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar configurações do cargo.');
        }
    };

    const handleRoleChange = (role: string) => {
        const isCliente = role === 'CLIENTE';

        let newPerms: string[] = [];

        if (!isCliente) {
            const roleConfig = rolePermissions.find(rp => rp.role === role);
            if (roleConfig && roleConfig.permissions) {
                try {
                    newPerms = typeof roleConfig.permissions === 'string'
                        ? JSON.parse(roleConfig.permissions)
                        : roleConfig.permissions;
                } catch (e) { console.error('Error parsing perms', e); }
            }
        }

        setFormData(prev => ({
            ...prev,
            role,
            division: isCliente ? 'CLIENTE' : (prev.division === 'CLIENTE' ? 'COMERCIAL' : prev.division),
            permissions: isCliente ? [] : newPerms,
            isCustomRole: false
        }));
    };


    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswordIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };


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


    const handleOpenUser = (user: UserData) => {
        setSelectedUser(user);
        let permissions: string[] = [];
        try {
            if (user.permissions) permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
        } catch (e) { console.error("Error parsing permissions", e); }

        // Check if role is standard or custom
        const isStandardRole = user.role === 'MASTER' || user.role === 'CLIENTE' || rolePermissions.some(rp => rp.role === user.role);

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
            isCustomRole: user.role ? !isStandardRole : false,
            pauseMenuEnabled: user.pauseMenuEnabled || false,
            allowedGames: Array.isArray(user.allowedGames) ? user.allowedGames : []
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
            isCustomRole: false,
            pauseMenuEnabled: false,
            allowedGames: []
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

            let savedUser;
            if (selectedUser) {
                const res = await api.put(`/management/users/${selectedUser.id}`, payload);
                savedUser = res.data;
            } else {
                if (!formData.email || !formData.password) {
                    alert('E-mail e senha são obrigatórios para novos usuários');
                    return;
                }
                const res = await api.post('/management/users', payload);
                savedUser = res.data;
            }

            // Sync with AuthStore if updating current user
            if (savedUser && currentUser && savedUser.id === currentUser.id) {
                const { updateUser } = useAuthStore.getState();
                updateUser(savedUser);
                toast.success('Seu perfil foi atualizado!');
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
        const currentPageIds = filteredUsers.map(u => u.id);
        const allSelected = currentPageIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
        }
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

    const handleBulkStatusChange = async (action: 'available' | 'blockQuotes' | 'blockSystem') => {
        const actionLabels = {
            available: 'Marcar como Disponível',
            blockQuotes: 'Bloquear Orçamentos',
            blockSystem: 'Bloquear Acesso ao Sistema'
        };

        if (!window.confirm(`Deseja ${actionLabels[action]} para ${selectedIds.length} usuário(s)?`)) return;

        try {
            const updates = selectedIds.map(async (id) => {
                const user = users.find(u => u.id === id);
                if (!user) return;

                const payload: any = {};

                if (action === 'available') {
                    payload.isEligible = true;
                    if (user.division === 'CLIENTE') {
                        payload.customer = {
                            ...user.customer,
                            canRequestQuotes: true,
                            isBlocked: false
                        };
                    }
                } else if (action === 'blockQuotes') {
                    if (user.division === 'CLIENTE') {
                        payload.customer = {
                            ...user.customer,
                            canRequestQuotes: false
                        };
                    }
                } else if (action === 'blockSystem') {
                    if (user.division === 'CLIENTE') {
                        payload.customer = {
                            ...user.customer,
                            isBlocked: true
                        };
                    } else {
                        payload.isEligible = false;
                    }
                }

                return api.put(`/management/users/${id}`, payload);
            });

            await Promise.all(updates);
            toast.success(`${selectedIds.length} usuário(s) atualizado(s)!`);
            await fetchUsers();
            setSelectedIds([]);
        } catch (error) {
            toast.error('Erro ao atualizar usuários');
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleData.slug || !newRoleData.label) {
            toast.error('Código e Nome do cargo são obrigatórios');
            return;
        }
        const slug = newRoleData.slug.toUpperCase().trim().replace(/\s+/g, '_');
        try {
            await api.put(`/management/roles/${slug}`, {
                label: newRoleData.label,
                permissions: []
            });
            setNewRoleData({ slug: '', label: '' });
            setIsAddingRole(false);
            await fetchRoleConfigs();
            toast.success('Novo cargo criado!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao criar cargo');
        }
    };

    const handleDeleteRole = async (roleSlug: string) => {
        const upRole = roleSlug.toUpperCase();
        if (upRole === 'MASTER') {
            toast.error('O cargo MASTER é vitalício e não pode ser excluído.');
            return;
        }

        // Check if there are users with this role
        const affectedUsers = users.filter(u => u.role?.toUpperCase() === upRole);

        let confirmMsg = `Tem certeza que deseja excluir o cargo ${roleSlug}?`;
        if (affectedUsers.length > 0) {
            confirmMsg = `⚠️ ATENÇÃO: Existem ${affectedUsers.length} usuário(s) utilizando o cargo "${roleSlug}".\n\n` +
                `Se você excluir este cargo, esses colaboradores PERDERÃO TODO O ACESSO ao sistema imediatamente.\n\n` +
                `Você terá que atribuir um novo cargo manualmente para cada um deles.\n\n` +
                `Deseja prosseguir com a exclusão definitiva?`;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/management/roles/${roleSlug}`);
            if (selectedConfigRole === roleSlug) {
                const firstAvailable = rolePermissions.find(rp => rp.role !== roleSlug);
                setSelectedConfigRole(firstAvailable?.role || 'OPERACIONAL');
            }
            await fetchRoleConfigs();
            toast.success('Cargo excluído com sucesso');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao excluir cargo');
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

    const allFilteredUsers = users
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

    // Pagination logic
    const totalPages = Math.ceil(allFilteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredUsers = allFilteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDivision, sortBy, sortOrder, tab]);

    const canAccess = currentUser?.role?.toUpperCase() === 'ADMIN' ||
        currentUser?.role?.toUpperCase() === 'MASTER' ||
        currentUser?.division?.toUpperCase() === 'DIRETORIA' ||
        currentUser?.division?.toUpperCase() === 'ADMIN';

    console.log('[UserManager] Render check:', {
        email: currentUser?.email,
        role: currentUser?.role,
        division: currentUser?.division,
        canAccess
    });

    if (!canAccess) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-xl shadow-red-500/10">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-secondary mb-4 uppercase tracking-tight">Acesso Restrito</h2>
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
        <main className="p-6 md:p-10 pb-28 md:pb-10">
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

                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-600 hover:border-primary transition-colors shadow-sm text-xs font-bold cursor-pointer"
                        >
                            <option value={30}>30 por página</option>
                            <option value={50}>50 por página</option>
                            <option value={100}>100 por página</option>
                            <option value={200}>200 por página</option>
                        </select>

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
                                onClick={() => handleBulkStatusChange('available')}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <Check size={14} /> DISPONÍVEL
                            </button>

                            <button
                                onClick={() => handleBulkStatusChange('blockQuotes')}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <Lock size={14} /> BLOQUEAR ORÇAMENTO
                            </button>

                            <button
                                onClick={() => handleBulkStatusChange('blockSystem')}
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <Shield size={14} /> BLOQUEAR SISTEMA
                            </button>

                            <div className="h-6 w-px bg-white/20"></div>

                            <button
                                onClick={handleBulkDelete}
                                className="bg-red-700 hover:bg-red-800 text-white px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2"
                            >
                                <Trash2 size={14} /> EXCLUIR
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

                                                    {/* Online Status */}
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`}></div>
                                                        <span className={`text-[10px] font-black uppercase tracking-tight ${u.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {u.isOnline ? 'Online agora' : 'Offline'}
                                                        </span>
                                                    </div>

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

                {/* Pagination and Total Count */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-secondary">
                            Exibindo <span className="text-primary">{startIndex + 1}</span> a <span className="text-primary">{Math.min(endIndex, allFilteredUsers.length)}</span> de <span className="text-primary">{allFilteredUsers.length}</span> usuários
                        </div>
                        {filterDivision !== 'ALL' || searchTerm ? (
                            <div className="text-xs font-bold text-gray-400">
                                (Total no sistema: {users.length})
                            </div>
                        ) : null}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Primeira
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                ‹
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum
                                                ? 'bg-primary text-white shadow-lg scale-110'
                                                : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-xl text-xs font-black bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Última
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black text-secondary">{selectedUser ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                                        {selectedUser && (
                                            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${selectedUser.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedUser.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                                {selectedUser.isOnline ? 'Online' : 'Offline'}
                                            </div>
                                        )}
                                    </div>
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
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'CUSTOM') {
                                                            setFormData({ ...formData, role: '', isCustomRole: true } as any);
                                                        } else {
                                                            handleRoleChange(val);
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
                                        {PERMISSION_MODULES.map(m => (
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

                                {/* GAMIFICATION / PAUSE MENU (DEV ONLY) */}
                                {currentUser?.email === 'oidemianf@gmail.com' && (
                                    <div className="pt-4 border-t border-gray-50 mt-4 space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                                            <Shield size={14} /> Gamification & Privilégios (Dev Only)
                                        </h4>
                                        <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200">
                                            <input
                                                type="checkbox"
                                                checked={formData.pauseMenuEnabled}
                                                onChange={e => setFormData({ ...formData, pauseMenuEnabled: e.target.checked })}
                                                className="w-5 h-5 rounded-lg text-purple-600 focus:ring-purple-600 transition-all"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-purple-700 uppercase tracking-tight">Habilitar Menu PAUSA</div>
                                                <div className="text-[10px] font-bold text-purple-600/70">Libera acesso aos mini-games e atividades de pausa.</div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.pauseMenuEnabled ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-400'}`}>
                                                {formData.pauseMenuEnabled ? 'LIBERADO' : 'BLOQUEADO'}
                                            </div>
                                        </label>

                                        {formData.pauseMenuEnabled && (
                                            <div className="space-y-2 mt-2 pl-4 border-l-2 border-purple-100">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase">Jogos Permitidos</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { id: 'paciencia-pet', label: 'Paciência Pet' },
                                                        { id: 'petmatch', label: 'Pet Match' },
                                                        { id: 'zen-espuma', label: 'Zen Pad — Espuma' },
                                                        { id: 'coleira', label: 'Desenrosca a Coleira' }
                                                    ].map(game => {
                                                        const allowed = Array.isArray(formData.allowedGames) ? formData.allowedGames : [];
                                                        const isAllowed = allowed.includes(game.id);
                                                        return (
                                                            <label key={game.id} className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAllowed}
                                                                    onChange={() => {
                                                                        const newGames = isAllowed
                                                                            ? allowed.filter((g: string) => g !== game.id)
                                                                            : [...allowed, game.id];
                                                                        setFormData({ ...formData, allowedGames: newGames });
                                                                    }}
                                                                    className="rounded text-purple-600 focus:ring-purple-500"
                                                                />
                                                                <span className="text-xs font-medium text-gray-600">{game.label}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                )}
            </AnimatePresence>

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
                                                {rp.role.toUpperCase() !== 'MASTER' && (
                                                    <div onClick={() => handleDeleteRole(rp.role)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform cursor-pointer shadow-lg z-10"><X size={10} /></div>
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
                                                {PERMISSION_MODULES.map(m => {
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
                                            <div className="pt-8 border-t border-gray-100">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuários Vinculados ({users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).length})</h4>
                                                </div>

                                                <div className="space-y-3">
                                                    {users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).map(user => (
                                                                <div key={user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 group hover:bg-white hover:shadow-lg transition-all">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg" style={{ backgroundColor: user.color || '#3B82F6' }}>
                                                                        {user.name?.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-secondary text-sm truncate">{user.name}</p>
                                                                        <p className="text-[10px] font-bold text-gray-400 truncate uppercase">{user.email}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-10 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                                                <Users size={20} />
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-400">Nenhum colaborador vinculado a este cargo</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <p className="text-[10px] font-extra-bold text-gray-400 uppercase tracking-widest">{hasRoleChanges ? '⚠ Você tem alterações não salvas' : '✅ Configurações salvas'}</p>
                                    <div className="flex gap-4 items-center">
                                        {selectedConfigRole?.toUpperCase() !== 'MASTER' && (
                                            <button
                                                onClick={() => handleDeleteRole(selectedConfigRole)}
                                                className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Excluir Cargo
                                            </button>
                                        )}
                                        <button onClick={() => setIsRoleModalOpen(false)} className="font-bold text-gray-400 px-4">Fechar</button>
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
            </AnimatePresence>
            <CustomerDetailsModal
                isOpen={isCustomerModalVisible}
                onClose={() => setIsCustomerModalVisible(false)}
                customerId={viewCustomerId}
                onUpdate={fetchUsers}
            />
        </main >
    );
}
