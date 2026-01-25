import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { RolePermission, NewRoleData, UserData } from '../types';

export interface UseRolesProps {
    users: UserData[];
    isMaster: boolean;
}

export interface UseRolesReturn {
    rolePermissions: RolePermission[];
    selectedConfigRole: string;
    editingRoleLabel: string;
    editingRolePerms: string[];
    hasRoleChanges: boolean;
    isAddingRole: boolean;
    newRoleData: NewRoleData;
    setSelectedConfigRole: (role: string) => void;
    setEditingRoleLabel: (label: string) => void;
    setEditingRolePerms: (perms: string[]) => void;
    setHasRoleChanges: (has: boolean) => void;
    setIsAddingRole: (adding: boolean) => void;
    setNewRoleData: (data: NewRoleData) => void;
    fetchRoleConfigs: () => Promise<void>;
    handleSaveRoleConfig: () => Promise<void>;
    handleCreateRole: () => Promise<void>;
    handleDeleteRole: (roleSlug: string) => Promise<void>;
    togglePermission: (moduleId: string) => void;
    handleRoleChange: (role: string, setFormData: (data: any) => void) => void;
}

export const useRoles = ({ users }: UseRolesProps): UseRolesReturn => {
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    const [selectedConfigRole, setSelectedConfigRole] = useState('OPERACIONAL');
    const [isAddingRole, setIsAddingRole] = useState(false);
    const [newRoleData, setNewRoleData] = useState<NewRoleData>({ slug: '', label: '' });

    // Role editing local state
    const [editingRoleLabel, setEditingRoleLabel] = useState('');
    const [editingRolePerms, setEditingRolePerms] = useState<string[]>([]);
    const [hasRoleChanges, setHasRoleChanges] = useState(false);

    const fetchRoleConfigs = useCallback(async () => {
        try {
            const { data } = await api.get('/management/roles');
            console.log('[useRoles] Role configs fetched:', data.length);
            setRolePermissions(data);
        } catch (error) {
            console.error('[useRoles] Error fetching role permissions:', error);
        }
    }, []);

    const handleSaveRoleConfig = useCallback(async () => {
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
    }, [editingRoleLabel, editingRolePerms, selectedConfigRole, rolePermissions]);

    const handleCreateRole = useCallback(async () => {
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
    }, [newRoleData, fetchRoleConfigs]);

    const handleDeleteRole = useCallback(async (roleSlug: string) => {
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
    }, [users, selectedConfigRole, rolePermissions, fetchRoleConfigs]);

    const togglePermission = useCallback((moduleId: string) => {
        setEditingRolePerms(prev => {
            const exists = prev.includes(moduleId);
            return exists
                ? prev.filter(p => p !== moduleId)
                : [...prev, moduleId];
        });
        setHasRoleChanges(true);
    }, []);

    const handleRoleChange = useCallback((role: string, setFormData: (data: any) => void) => {
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

        setFormData((prev: any) => ({
            ...prev,
            role,
            division: isCliente ? 'CLIENTE' : (prev.division === 'CLIENTE' ? 'COMERCIAL' : prev.division),
            permissions: isCliente ? [] : newPerms,
            isCustomRole: false
        }));
    }, [rolePermissions]);

    // Initialize editing state when selected role changes
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

    return {
        rolePermissions,
        selectedConfigRole,
        editingRoleLabel,
        editingRolePerms,
        hasRoleChanges,
        isAddingRole,
        newRoleData,
        setSelectedConfigRole,
        setEditingRoleLabel,
        setEditingRolePerms,
        setHasRoleChanges,
        setIsAddingRole,
        setNewRoleData,
        fetchRoleConfigs,
        handleSaveRoleConfig,
        handleCreateRole,
        handleDeleteRole,
        togglePermission,
        handleRoleChange
    };
};

// Legacy export for backward compatibility
export interface RoleConfig {
    role: string;
    label?: string;
    permissions: string;
}

export function useRolesLegacy() {
    const [rolePermissions, setRolePermissions] = useState<RoleConfig[]>([]);

    const fetchRoleConfigs = async () => {
        try {
            const { data } = await api.get('/management/roles');
            setRolePermissions(data);
        } catch (error) {
            console.error('[useRoles] Error fetching roles:', error);
        }
    };

    const saveRoleConfig = async (role: string, label: string, permissions: string[]) => {
        try {
            await api.put(`/management/roles/${role}`, { label, permissions });
            toast.success('Configurações salvas!');
            fetchRoleConfigs();
        } catch (error) {
            toast.error('Erro ao salvar cargo');
        }
    };

    const deleteRole = async (roleSlug: string) => {
        if (!window.confirm(`Excluir cargo ${roleSlug}?`)) return;
        try {
            await api.delete(`/management/roles/${roleSlug}`);
            toast.success('Cargo excluído');
            fetchRoleConfigs();
        } catch (error) {
            toast.error('Erro ao excluir cargo');
        }
    };

    useEffect(() => {
        fetchRoleConfigs();
    }, []);

    return { rolePermissions, refreshRoles: fetchRoleConfigs, saveRoleConfig, deleteRole };
}
