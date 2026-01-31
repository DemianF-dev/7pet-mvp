import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Shield, Lock, Plus, Trash, Check, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { Container, Stack } from '../../../components/layout/LayoutHelpers';
import BackButton from '../../../components/BackButton';
import Breadcrumbs from '../../../components/staff/Breadcrumbs';
import CustomerDetailsModal from '../../../components/staff/CustomerDetailsModal';

// Import modular components
import { useUsers } from './hooks/useUsers';
import { useUserMutations } from './hooks/useUserMutations';
import { useRoles } from './hooks/useRoles';
import { UserFilters } from './components/UserFilters';
import UserTable from './components/UserTable';
import { UserFormModal } from './components/UserFormModal';
import { RoleManagerModal } from './components/RoleManagerModal';
import { MobileUsers } from './components/MobileUsers';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { prepareFormDataFromUser, canEditUser } from './utils/userHelpers';
import { UserData, UserFormData } from './types';

/**
 * Main User Management Controller Component
 * This is the modular replacement for the monolithic UserManager.tsx
 */
export default function UserManager() {
    console.log('[UserManager] Component rendering...');
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: currentUser } = useAuthStore();

    // Role and permission checks
    const isMaster = currentUser?.role === 'MASTER' || currentUser?.email === 'oidemianf@gmail.com';

    // Access control
    const canAccess = currentUser?.role?.toUpperCase() === 'ADMIN' ||
        currentUser?.role?.toUpperCase() === 'MASTER' ||
        currentUser?.division?.toUpperCase() === 'DIRETORIA' ||
        currentUser?.division?.toUpperCase() === 'ADMIN';

    // Data fetching and state management
    const {
        users,
        filteredUsers,
        allFilteredUsers,
        isLoading,
        searchTerm,
        filterDivision,
        sortBy,
        sortOrder,
        tab,
        itemsPerPage,
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        visiblePasswordIds,
        showModalPassword,
        setSearchTerm,
        setFilterDivision,
        setSortBy,
        setSortOrder,
        setTab,
        setItemsPerPage,
        setCurrentPage,
        togglePasswordVisibility,
        setShowModalPassword,
        fetchUsers
    } = useUsers();

    // User mutations
    const {
        saveUser,
        deleteUser,
        restoreUser,
        bulkDelete,
        bulkRestore,
        bulkStatusChange
    } = useUserMutations({
        onUserSaved: () => fetchUsers(),
        onUserDeleted: () => fetchUsers(),
        onUserRestored: () => fetchUsers()
    });

    // Role management
    const {
        rolePermissions,
        fetchRoleConfigs,
        togglePermission,
        handleRoleChange
    } = useRoles({ users, isMaster });

    // Local state for modals and selection
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal visibility states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false);
    const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);

    const { isMobile } = useIsMobile();

    // Form data state - formData is managed by UserFormModal internally
    const [, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        notes: '',
        division: 'CLIENTE',
        role: '',
        permissions: [],
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

    // Initialize role configurations
    useEffect(() => {
        fetchRoleConfigs();
    }, []);

    // Handle opening user for editing
    const handleOpenUser = (user: UserData) => {
        if (!canEditUser(user, currentUser, isMaster)) {
            return;
        }

        setSelectedUser(user);
        const preparedFormData = prepareFormDataFromUser(user);
        setFormData(preparedFormData);
        setShowModalPassword(false);
        setIsModalOpen(true);
    };

    // Handle adding new user
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
            permissions: [],
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

    // Handle customer detail view
    const handleOpenCustomerDetail = (cid: string) => {
        setViewCustomerId(cid);
        setIsCustomerModalVisible(true);
    };

    // Handle user selection
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

    // Handle bulk operations
    const handleBulkDelete = async () => {
        await bulkDelete(selectedIds, tab === 'trash');
        setSelectedIds([]);
    };

    const handleBulkRestore = async () => {
        await bulkRestore(selectedIds);
        setSelectedIds([]);
    };

    const handleBulkStatusChange = async (action: 'available' | 'blockQuotes' | 'blockSystem') => {
        await bulkStatusChange(selectedIds, action, users);
        setSelectedIds([]);
    };

    // Handle tab changes
    const handleTabChange = (newTab: 'active' | 'trash') => {
        setTab(newTab);
        setSelectedIds([]);
    };

    // Deep link handling
    useEffect(() => {
        if (!isLoading && users.length > 0) {
            const editId = searchParams.get('editId');
            const emailParam = searchParams.get('email');

            if (editId || emailParam) {
                const foundUser = users.find(u => u.id === editId || u.email === emailParam);
                if (foundUser) {
                    handleOpenUser(foundUser);
                    setSearchParams({}, { replace: true });
                }
            }
        }
    }, [isLoading, users, searchParams, handleOpenUser, setSearchParams]);

    if (isMobile) {
        return (
            <MobileUsers
                users={users}
                isLoading={isLoading}
                onEdit={handleOpenUser}
                onDelete={(id) => deleteUser(id, false)}
                onRestore={restoreUser}
                onNew={() => {
                    setSelectedUser(null);
                    setIsModalOpen(true);
                }}
                onTogglePassword={togglePasswordVisibility}
                visiblePasswordIds={visiblePasswordIds}
            />
        );
    }

    // Render access denied page
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
        <Container>
            <Stack gap={10} className="py-10">
                <header>
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
                                {isMaster && (
                                    <button
                                        onClick={() => setIsRoleModalOpen(true)}
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-secondary transition-colors group flex items-center gap-2"
                                    >
                                        <Lock size={18} className="text-gray-400 group-hover:text-secondary" />
                                        <span className="text-xs font-bold pr-2">Cargos</span>
                                    </button>
                                )}
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
                            onClick={() => handleTabChange('active')}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'active' ? 'bg-secondary text-white shadow-lg scale-105' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => handleTabChange('trash')}
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${tab === 'trash' ? 'bg-red-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Trash size={14} /> Lixeira
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Filters */}
                    <UserFilters
                        searchTerm={searchTerm}
                        filterDivision={filterDivision}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        itemsPerPage={itemsPerPage}
                        isLoading={isLoading}
                        onSearchChange={setSearchTerm}
                        onFilterChange={setFilterDivision}
                        onSortByChange={setSortBy}
                        onSortOrderChange={setSortOrder}
                        onItemsPerPageChange={setItemsPerPage}
                        onRefresh={fetchUsers}
                    />

                    {/* Floating Bulk Action Bar */}
                    <AnimatePresence>
                        {selectedIds.length > 0 && (
                            <div className="fixed bottom-10 left-0 right-0 z-50 px-6 flex justify-center">
                                <motion.div
                                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 100, opacity: 0, scale: 0.9 }}
                                    className="bg-secondary text-white px-8 py-5 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-8 min-w-[600px] max-w-full overflow-x-auto no-scrollbar"
                                >
                                    <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-2">
                                        <span className="bg-primary text-white text-xs font-black min-w-[32px] h-8 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                                            {selectedIds.length}
                                        </span>
                                        <p className="text-sm font-black uppercase tracking-widest whitespace-nowrap">Selecionados</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleBulkStatusChange('available')}
                                            className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-green-500/20 whitespace-nowrap"
                                        >
                                            <Check size={14} /> Disponível
                                        </button>

                                        <button
                                            onClick={() => handleBulkStatusChange('blockQuotes')}
                                            className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-amber-500/20 whitespace-nowrap"
                                        >
                                            <Lock size={14} /> Bloquear Orçamentos
                                        </button>

                                        <button
                                            onClick={() => handleBulkStatusChange('blockSystem')}
                                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-red-500/20 whitespace-nowrap"
                                        >
                                            <Shield size={14} /> Bloquear Acesso
                                        </button>

                                        {tab === 'trash' && (
                                            <button
                                                onClick={handleBulkRestore}
                                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <RotateCcw size={14} /> Restaurar
                                            </button>
                                        )}

                                        <button
                                            onClick={handleBulkDelete}
                                            className="bg-white/10 hover:bg-red-600 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10 hover:border-red-600 whitespace-nowrap ml-2"
                                        >
                                            <Trash size={14} /> {tab === 'trash' ? 'Excluir Permanente' : 'Lixeira'}
                                        </button>
                                    </div>

                                    <div className="ml-auto flex items-center border-l border-white/10 pl-6">
                                        <button
                                            onClick={() => setSelectedIds([])}
                                            className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8">
                    <UserTable
                        users={filteredUsers}
                        isLoading={isLoading}
                        isMaster={isMaster}
                        visiblePasswordIds={visiblePasswordIds}
                        onTogglePassword={togglePasswordVisibility}
                        onViewCustomer={handleOpenCustomerDetail}
                        onEdit={handleOpenUser}
                        onDelete={(user: UserData) => deleteUser(user, false)}
                        onRestore={(user: UserData) => restoreUser(user)}
                        tab={tab}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onSelectAll={handleSelectAll}
                    />
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
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

                {/* User Form Modal */}
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedUser={selectedUser}
                    tab={tab}
                    showModalPassword={showModalPassword}
                    setShowModalPassword={setShowModalPassword}
                    rolePermissions={rolePermissions}
                    isMaster={isMaster}
                    currentUser={currentUser}
                    onSave={(data) => saveUser(data, selectedUser)}
                    onDelete={(user: UserData) => deleteUser(user, false)}
                    onRestore={(user: UserData) => restoreUser(user)}
                    onRoleChange={handleRoleChange}
                    togglePermission={togglePermission}
                    onViewCustomer={handleOpenCustomerDetail}
                />

                {/* Role Manager Modal */}
                <RoleManagerModal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    users={users}
                />

                {/* Customer Details Modal */}
                <CustomerDetailsModal
                    isOpen={isCustomerModalVisible}
                    onClose={() => setIsCustomerModalVisible(false)}
                    customerId={viewCustomerId}
                    onUpdate={fetchUsers}
                />
            </Stack>
        </Container>
    );
}