import { useState, useEffect } from 'react';
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
    RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';

interface UserData {
    id: string;
    email: string;
    role: string;
    name?: string;
    phone?: string;
    notes?: string;
    permissions?: string; // JSON string from DB
    createdAt: string;
    customer?: {
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
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'id'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const { user: currentUser } = useAuthStore();

    // Edit Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        notes: '',
        role: '',
        permissions: [] as string[],
        birthday: '',
        admissionDate: '',
        document: '',
        address: '',
        color: '#3B82F6'
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

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/management/users');
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
        if (currentUser?.role === 'ADMIN' || currentUser?.role === 'MASTER') {
            fetchUsers();
        }
    }, [currentUser]);

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
            role: user.role,
            permissions,
            birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
            admissionDate: user.admissionDate ? new Date(user.admissionDate).toISOString().split('T')[0] : '',
            document: user.document || '',
            address: user.address || '',
            color: user.color || '#3B82F6'
        });
        setIsModalOpen(true);
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
            role: 'OPERACIONAL',
            permissions: [] as string[],
            birthday: '',
            admissionDate: '',
            document: '',
            address: '',
            color: '#3B82F6'
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
        const msg = selectedUser ? 'Deseja salvar as alterações neste usuário?' : 'Deseja criar este novo colaborador?';
        if (!window.confirm(msg)) return;
        try {
            const payload = {
                ...formData,
                permissions: JSON.stringify(formData.permissions)
            };

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
        } catch (err) {
            alert('Erro ao salvar usuário');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return;
        try {
            await api.delete(`/management/users/${selectedUser.id}`);
            toast.success('Usuário excluído');
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert('Erro ao excluir usuário');
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

            const matchesRole = filterRole === 'ALL' || u.role === filterRole;

            return matchesSearch && matchesRole;
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

    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'MASTER') {
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

            <main className="flex-1 md:ml-64 p-6 md:p-10">
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
                                { role: 'ALL', label: 'Todos' },
                                ...rolePermissions.map(rp => ({ role: rp.role, label: rp.label || rp.role }))
                            ].map(filter => (
                                <button
                                    key={filter.role}
                                    onClick={() => setFilterRole(filter.role)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === filter.role
                                        ? 'bg-secondary text-white shadow-md'
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
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo</th>
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
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-sm ${u.role === 'CLIENTE' ? 'bg-slate-300' : ''}`}
                                                        style={{ backgroundColor: u.role === 'CLIENTE' ? undefined : (u.color || '#3B82F6') }}
                                                    >
                                                        {(u.firstName?.[0] || u.name?.[0] || u.email[0]).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-secondary text-sm">
                                                                {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.name || u.email.split('@')[0]}
                                                            </span>
                                                            <span className="bg-indigo-50 text-indigo-500 text-[9px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">
                                                                {u.role === 'CLIENTE' ? 'CL' : 'OP'}-{String(u.staffId ?? u.seqId).padStart(4, '0')}
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
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full w-fit ${u.role === 'ADMIN' ? 'bg-secondary text-white' :
                                                        u.role === 'CLIENTE' ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
                                                        }`}>
                                                        {rolePermissions.find(rp => rp.role === u.role)?.label || u.role}
                                                    </span>
                                                    <span className="text-[9px] font-black text-gray-300 ml-1 uppercase tracking-tighter">
                                                        ID: {u.role === 'CLIENTE' ? 'CL' : 'OP'}-{String(u.staffId ?? u.seqId).padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => handleOpenUser(u)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-secondary">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

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
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase"><Briefcase size={14} /> Cargo & Atribuição</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 mb-1">Nível de Acesso</label>
                                            <select
                                                value={formData.role}
                                                onChange={e => {
                                                    const role = e.target.value;
                                                    const def = rolePermissions.find(rp => rp.role === role);
                                                    setFormData({ ...formData, role, permissions: def ? JSON.parse(def.permissions) : [] });
                                                }}
                                                className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 font-bold text-secondary"
                                            >
                                                {rolePermissions.map(rp => <option key={rp.role} value={rp.role}>{rp.label || rp.role}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-black text-gray-400 mb-1">Cor na Agenda</label>
                                            <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-full h-11 rounded-xl cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

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
        </div >
    );
}

