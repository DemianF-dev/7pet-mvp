import { useState, useEffect } from 'react';
import {
    Shield,
    Lock,
    ChevronRight,
    Search as SearchIcon,
    X,
    User,
    Phone,
    FileText,
    Trash2,
    Save,
    MapPin,
    Calendar,
    Briefcase,
    CreditCard,
    Plus
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

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
    // new fields
    admissionDate?: string;
    birthday?: string;
    document?: string;
    address?: string;
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

    const { user: currentUser } = useAuthStore();

    // Edit Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // New password (optional)
        phone: '',
        notes: '',
        role: '',
        permissions: [] as string[],
        birthday: '',
        admissionDate: '',
        document: '',
        address: ''
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/management/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenUser = (user: UserData) => {
        setSelectedUser(user);
        let permissions: string[] = [];
        try {
            if (user.permissions) permissions = JSON.parse(user.permissions);
        } catch (e) { console.error("Error parsing permissions", e); }

        setFormData({
            name: user.name || user.customer?.name || '',
            email: user.email,
            password: '', // Always start blank
            phone: user.phone || '',
            notes: user.notes || '',
            role: user.role,
            permissions,
            birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
            admissionDate: user.admissionDate ? new Date(user.admissionDate).toISOString().split('T')[0] : '',
            document: user.document || '',
            address: user.address || ''
        });
        setIsModalOpen(true);
    };

    const handleAddNewUser = () => {
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            notes: '',
            role: 'OPERACIONAL',
            permissions: [],
            birthday: '',
            admissionDate: '',
            document: '',
            address: ''
        });
        setIsModalOpen(true);
    };

    const handleSaveUser = async () => {
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

            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert('Erro ao salvar usuário');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return;
        try {
            await api.delete(`/management/users/${selectedUser.id}`);
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert('Erro ao excluir usuário');
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/management/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err) {
            alert('Erro ao atualizar permissão');
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

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Gestão de <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Acessos</span></h1>
                            <p className="text-gray-500 mt-3 font-medium">Gerencie usuários, permissões e níveis de acesso do sistema.</p>
                        </div>

                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
                            <div className="flex items-center gap-2 border-r border-gray-100 pr-4">
                                <div className="flex -space-x-2 overflow-hidden px-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200"></div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-secondary">{users.length} Colaboradores</span>
                            </div>
                            <button
                                onClick={handleAddNewUser}
                                className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Novo Usuário
                            </button>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Shield size={22} />
                            </div>
                            <h2 className="text-xl font-bold text-secondary">Níveis de Permissão</h2>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar usuários..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-80 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo Atual</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Criado em</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                                                    {u.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-secondary text-sm">{u.customer?.name || 'Sistema'}</span>
                                                    <span className="text-xs text-gray-400 font-medium">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                className={`text-[10px] font-black uppercase tracking-tight px-4 py-2 rounded-full border-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${u.role === 'ADMIN' ? 'bg-secondary text-white' :
                                                    u.role === 'SPA' ? 'bg-purple-100 text-purple-600' :
                                                        u.role === 'GESTAO' ? 'bg-primary/20 text-primary' :
                                                            'bg-gray-100 text-gray-500'
                                                    }`}
                                            >
                                                <option value="CLIENTE">Cliente</option>
                                                <option value="OPERACIONAL">Operacional</option>
                                                <option value="SPA">SPA (Agenda/Serviços)</option>
                                                <option value="GESTAO">Gestão</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-gray-400">
                                            {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenUser(u)}
                                                    className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-gray-300 font-bold italic opacity-50">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
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
                            className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h3 className="text-xl font-black text-secondary">
                                        {selectedUser ? 'Detalhes do Usuário' : 'Novo Colaborador'}
                                    </h3>
                                    <p className="text-sm text-gray-400 font-bold">
                                        {selectedUser ? selectedUser.email : 'Preencha os dados de acesso'}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    {currentUser?.role === 'ADMIN' && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Shield size={14} /> Credenciais de Acesso
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-2xl border border-red-50">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">E-mail de Login</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        placeholder="email@7pet.com"
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">
                                                        {selectedUser ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={formData.password}
                                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder={selectedUser ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} /> Informações Pessoais
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Telefone / WhatsApp</label>
                                                <div className="relative">
                                                    <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.phone}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">CPF</label>
                                                <div className="relative">
                                                    <CreditCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.document}
                                                        onChange={e => setFormData({ ...formData, document: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Data de Nascimento</label>
                                                <div className="relative">
                                                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={formData.birthday}
                                                        onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Endereço Completo</label>
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.address}
                                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase size={14} /> Dados da Empresa
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Cargo / Função</label>
                                                <select
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                                                >
                                                    <option value="CLIENTE">Cliente</option>
                                                    <option value="OPERACIONAL">Operacional</option>
                                                    <option value="SPA">SPA</option>
                                                    <option value="GESTAO">Gestão</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Data de Admissão</label>
                                                <div className="relative">
                                                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={formData.admissionDate}
                                                        onChange={e => setFormData({ ...formData, admissionDate: e.target.value })}
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-secondary font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Permissions */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Lock size={14} /> Permissões Personalizadas
                                        </h4>
                                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-4 font-medium">
                                                Selecione os módulos que este usuário pode acessar. Se nenhuma opção for marcada,
                                                o sistema usará as permissões padrão do cargo <strong>{formData.role}</strong>.
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {MODULES.map(module => (
                                                    <label
                                                        key={module.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.permissions.includes(module.id)
                                                            ? 'bg-primary/5 border-primary/20'
                                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.permissions.includes(module.id)
                                                            ? 'bg-primary border-primary text-white'
                                                            : 'border-gray-300 bg-white'
                                                            }`}>
                                                            {formData.permissions.includes(module.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] font-bold">✓</motion.div>}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={formData.permissions.includes(module.id)}
                                                            onChange={() => togglePermission(module.id)}
                                                        />
                                                        <span className={`text-sm font-bold ${formData.permissions.includes(module.id) ? 'text-secondary' : 'text-gray-500'}`}>
                                                            {module.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} /> Observações Internas
                                        </h4>
                                        <textarea
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-secondary font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                            placeholder="Adicione notas sobre este colaborador..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                                {selectedUser ? (
                                    <button
                                        onClick={handleDeleteUser}
                                        className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-4 py-3 rounded-xl transition-colors text-sm"
                                    >
                                        <Trash2 size={18} />
                                        Excluir Usuário
                                    </button>
                                ) : <div />}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 font-bold text-gray-500 hover:text-secondary transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveUser}
                                        className="px-8 py-3 bg-secondary text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {selectedUser ? 'Salvar Alterações' : 'Criar Colaborador'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
