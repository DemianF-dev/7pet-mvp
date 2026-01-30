import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../services/api';
import {
    UserData,
    UserFormData,
    BulkStatusAction,
    BulkOperationResult
} from '../types';

export interface UseUserMutationsProps {
    // Callback functions
    onUserSaved?: (user: UserData) => void;
    onUserDeleted?: () => void;
    onUserRestored?: () => void;
    onError?: (error: string) => void;
}

export interface UseUserMutationsReturn {
    // Single user operations
    saveUser: (userData: UserFormData, selectedUser?: UserData | null) => Promise<void>;
    deleteUser: (user: UserData, isPermanent: boolean) => Promise<void>;
    restoreUser: (user: UserData) => Promise<void>;

    // Bulk operations
    bulkDelete: (userIds: string[], isPermanent: boolean) => Promise<BulkOperationResult>;
    bulkRestore: (userIds: string[]) => Promise<BulkOperationResult>;
    bulkStatusChange: (userIds: string[], action: BulkStatusAction, users: UserData[]) => Promise<void>;

    // State
    loading: boolean;
    error: string | null;
}

export const useUserMutations = (props: UseUserMutationsProps = {}): UseUserMutationsReturn => {
    const { onUserSaved, onUserDeleted, onUserRestored, onError } = props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser, updateUser } = useAuthStore();

    const handleError = useCallback((err: any, defaultMessage: string) => {
        const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || defaultMessage;
        setError(errorMsg);
        onError?.(errorMsg);
        toast.error(errorMsg);
    }, [onError]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Save user (create or update)
    const saveUser = useCallback(async (userData: UserFormData, selectedUser?: UserData | null) => {
        setLoading(true);
        clearError();

        const toastId = toast.loading('Salvando dados...');

        try {
            console.log('[useUserMutations] saveUser START', { selectedUser, userData });

            // Validate Payload Preparation
            const finalPermissions = JSON.stringify(userData.permissions);

            const payload = {
                ...userData,
                isEligible: userData.division === 'CLIENTE' ? false : userData.isEligible,
                permissions: finalPermissions
            };

            // Custom Role Registration
            if ((userData as any).isCustomRole && userData.role) {
                try {
                    console.log('[useUserMutations] Registering custom role:', userData.role);
                    await api.put(`/management/roles/${userData.role.toUpperCase()}/permissions`, {
                        label: userData.role,
                        permissions: finalPermissions
                    });
                } catch (e) {
                    console.error("Erro ao registrar novo cargo:", e);
                    // Non-critical
                }
            }

            console.log('💾 Sending Payload:', {
                division: payload.division,
                role: payload.role,
                email: payload.email,
                permissionsLen: payload.permissions?.length
            });

            let savedUser: UserData;
            if (selectedUser) {
                console.log('[useUserMutations] Updating existing user:', selectedUser.id);

                // CRITICAL FIX: Always preserve division and role in payload
                // Previous bug: customer was being deleted unconditionally, potentially removing fields
                const cleanPayload = {
                    ...payload,
                    division: userData.division,  // ✅ Force include - prevents division reset
                    role: userData.role,          // ✅ Force include - prevents role reset
                };

                // Handle customer data properly - only include if it exists
                if ((userData as any).customer) {
                    (cleanPayload as any).customer = (userData as any).customer;
                } else {
                    // Remove customer key if not needed to avoid conflicts
                    delete (cleanPayload as any).customer;
                }

                console.log('🔄 Final Update Payload:', {
                    id: selectedUser.id,
                    division: cleanPayload.division,
                    role: cleanPayload.role,
                    email: cleanPayload.email,
                    hasCustomer: !!(cleanPayload as any).customer,
                    permissionsCount: cleanPayload.permissions?.length
                });

                const res = await api.put(`/management/users/${selectedUser.id}`, cleanPayload);
                savedUser = res.data;

                console.log('✅ User updated successfully:', {
                    id: savedUser.id,
                    division: savedUser.division,
                    role: savedUser.role
                });
            } else {
                console.log('[useUserMutations] Creating new user');
                if (!userData.email || !userData.password) {
                    toast.dismiss(toastId);
                    toast.error('E-mail e senha são obrigatórios para novos usuários');
                    setLoading(false);
                    return;
                }
                const res = await api.post('/management/users', payload);
                savedUser = res.data;
            }

            // Sync with AuthStore if updating current user
            if (savedUser && currentUser && savedUser.id === currentUser.id) {
                const { updateUser: updateAuthUser } = useAuthStore.getState();
                // Convert UserData to User format for AuthStore
                let parsedPermissions: string[] = [];
                try {
                    parsedPermissions = savedUser.permissions ? JSON.parse(savedUser.permissions) : [];
                } catch (e) {
                    console.error('Error parsing permissions for auth store:', e);
                }

                const userForAuthStore = {
                    ...savedUser,
                    seqId: savedUser.seqId || 0, // Ensure seqId is number for AuthStore
                    division: savedUser.division as any, // Type assertion for compatibility
                    permissions: parsedPermissions // Convert string to string[] for AuthStore
                };
                updateAuthUser(userForAuthStore);
                toast.success('Seu perfil foi atualizado!', { id: 'profile-update' });
            }

            toast.success('Usuário salvo com sucesso!', { id: toastId });
            onUserSaved?.(savedUser);

        } catch (err: any) {
            console.error('Erro ao salvar usuário (CATCH):', err);
            handleError(err, 'Erro desconhecido ao salvar');
        } finally {
            setLoading(false);
        }
    }, [currentUser, updateUser, onUserSaved, handleError, clearError]);

    // Delete user (soft or permanent)
    const deleteUser = useCallback(async (user: UserData, isPermanent: boolean = false) => {
        if (!user) return;

        const msg = isPermanent
            ? `ATENÇÃO: Deseja excluir PERMANENTEMENTE o usuário ${user.name}?\n\nEsta ação liberará o e-mail (${user.email}) para novos cadastros e removerá todos os dados vinculados.\n\nPara confirmar, digite EXCLUIR no campo abaixo:`
            : 'Tem certeza que deseja mover este usuário para a lixeira?';

        if (isPermanent) {
            const confirmText = window.prompt(msg);
            if (confirmText?.toUpperCase() !== 'EXCLUIR') {
                if (confirmText !== null) toast.error('Confirmação inválida. Digite EXCLUIR para confirmar.');
                return;
            }
        } else {
            if (!window.confirm(msg)) return;
        }

        setLoading(true);
        clearError();

        const toastId = toast.loading(isPermanent ? 'Excluindo permanentemente...' : 'Movendo para lixeira...');

        try {
            const endpoint = isPermanent
                ? `/management/users/${user.id}/permanent`
                : `/management/users/${user.id}`;

            await api.delete(endpoint);

            toast.success(isPermanent ? 'Usuário removido permanentemente!' : 'Usuário movido para a lixeira!', { id: toastId });
            onUserDeleted?.();

        } catch (err: any) {
            console.error('Erro ao excluir usuário:', err);
            handleError(err, 'Erro ao processar exclusão');
        } finally {
            setLoading(false);
        }
    }, [onUserDeleted, handleError, clearError]);

    // Restore user from trash
    const restoreUser = useCallback(async (user: UserData) => {
        if (!window.confirm(`Deseja restaurar o acesso de ${user.name}?`)) return;

        setLoading(true);
        clearError();

        const toastId = toast.loading('Restaurando usuário...');

        try {
            await api.post(`/management/users/${user.id}/restore`);
            toast.success('Usuário restaurado com sucesso!', { id: toastId });
            onUserRestored?.();

        } catch (err: any) {
            console.error('Erro ao restaurar usuário:', err);
            handleError(err, 'Erro ao restaurar usuário');
        } finally {
            setLoading(false);
        }
    }, [onUserRestored, handleError, clearError]);

    // Bulk operations
    const bulkDelete = useCallback(async (userIds: string[], isPermanent: boolean = false): Promise<BulkOperationResult> => {
        const count = userIds.length;
        if (count === 0) return { success: 0, failed: 0 };

        const msg = isPermanent
            ? `CUIDADO: Você está prestes a excluir PERMANENTEMENTE ${count} usuários.\n\nEsta ação é irreversível e liberará os e-mails para novos cadastros.\n\nPara confirmar, digite EXCLUIR ${count} abaixo:`
            : `Deseja mover ${count} usuários para a lixeira?`;

        if (isPermanent) {
            const confirmText = window.prompt(msg);
            if (confirmText?.toUpperCase() !== `EXCLUIR ${count}`) {
                if (confirmText !== null) toast.error(`Confirmação inválida. Digite EXCLUIR ${count} para confirmar.`);
                return { success: 0, failed: count };
            }
        } else {
            if (!window.confirm(msg)) return { success: 0, failed: count };
        }

        setLoading(true);
        clearError();

        const toastId = toast.loading(isPermanent ? 'Excluindo permanentemente...' : 'Movendo para lixeira...');

        try {
            const results = await Promise.allSettled(
                userIds.map(id => api.delete(`/management/users/${id}${isPermanent ? '/permanent' : ''}`))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.error(`${succeeded} processados com sucesso. ${failed} falharam.`, { id: toastId });
            } else {
                toast.success(`${succeeded} usuários ${isPermanent ? 'removidos permanentemente' : 'movidos para lixeira'}!`, { id: toastId });
            }

            onUserDeleted?.();
            return { success: succeeded, failed };

        } catch (error) {
            toast.error('Erro ao processar exclusão em massa', { id: toastId });
            handleError(error, 'Erro ao processar exclusão em massa');
            return { success: 0, failed: count };
        } finally {
            setLoading(false);
        }
    }, [onUserDeleted, handleError, clearError]);

    const bulkRestore = useCallback(async (userIds: string[]): Promise<BulkOperationResult> => {
        if (!window.confirm(`Deseja restaurar os ${userIds.length} usuários selecionados?`)) {
            return { success: 0, failed: userIds.length };
        }

        setLoading(true);
        clearError();

        const toastId = toast.loading(`Restaurando ${userIds.length} usuários...`);

        try {
            const results = await Promise.allSettled(
                userIds.map(id => api.post(`/management/users/${id}/restore`))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.error(`${succeeded} usuários restaurados. ${failed} falharam.`, { id: toastId });
            } else {
                toast.success(`${succeeded} usuários restaurados!`, { id: toastId });
            }

            onUserRestored?.();
            return { success: succeeded, failed };

        } catch (error) {
            toast.error('Erro ao restaurar um ou mais usuários', { id: toastId });
            handleError(error, 'Erro ao restaurar usuários');
            return { success: 0, failed: userIds.length };
        } finally {
            setLoading(false);
        }
    }, [onUserRestored, handleError, clearError]);

    const bulkStatusChange = useCallback(async (userIds: string[], action: BulkStatusAction, users: UserData[]) => {
        const actionLabels = {
            available: 'Marcar como Disponível',
            blockQuotes: 'Bloquear Orçamentos',
            blockSystem: 'Bloquear Acesso ao Sistema'
        };

        if (!window.confirm(`Deseja ${actionLabels[action]} para ${userIds.length} usuário(s)?`)) return;

        setLoading(true);
        clearError();

        try {
            const updates = userIds.map(async (id) => {
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
            toast.success(`${userIds.length} usuário(s) atualizado(s)!`);
            onUserSaved?.({} as UserData); // Trigger refresh

        } catch (error) {
            handleError(error, 'Erro ao atualizar usuários');
        } finally {
            setLoading(false);
        }
    }, [onUserSaved, handleError, clearError]);

    return {
        // Single user operations
        saveUser,
        deleteUser,
        restoreUser,

        // Bulk operations
        bulkDelete,
        bulkRestore,
        bulkStatusChange,

        // State
        loading,
        error
    };
};

// Legacy export for backward compatibility
export function useUserMutationsLegacy(onSuccess: () => void) {
    const { user: currentUser } = useAuthStore();

    const saveUser = async (formData: UserFormData, selectedUser: UserData | null) => {
        const toastId = toast.loading('Salvando dados...');
        try {
            const finalPermissions = JSON.stringify(formData.permissions);
            const payload = {
                ...formData,
                isEligible: formData.division === 'CLIENTE' ? false : formData.isEligible,
                permissions: finalPermissions
            };

            // Register custom role if needed
            if (formData.isCustomRole && formData.role) {
                try {
                    await api.put(`/management/roles/${formData.role.toUpperCase()}/permissions`, {
                        label: formData.role,
                        permissions: finalPermissions
                    });
                } catch (e) { console.warn("Erro ao registrar novo cargo:", e); }
            }

            let savedUser;
            if (selectedUser) {
                const cleanPayload = { ...payload };
                delete (cleanPayload as any).customer;
                const res = await api.put(`/management/users/${selectedUser.id}`, cleanPayload);
                savedUser = res.data;
            } else {
                const res = await api.post('/management/users', payload);
                savedUser = res.data;
            }

            // Sync with AuthStore if updating current user
            if (savedUser && currentUser && savedUser.id === currentUser.id) {
                useAuthStore.getState().updateUser(savedUser);
            }

            toast.success('Usuário salvo com sucesso!', { id: toastId });
            onSuccess();
        } catch (err: any) {
            console.error('Error saving user:', err);
            const msg = err.response?.data?.details || err.response?.data?.error || err.message || 'Erro ao salvar';
            toast.error(`Erro: ${msg}`, { id: toastId });
        }
    };

    const deleteUser = async (u: UserData, tab: 'active' | 'trash') => {
        const isTrash = tab === 'trash';
        if (isTrash) {
            const confirmText = window.prompt(`ATENÇÃO: Excluir PERMANENTEMENTE ${u.name}?\nDigite EXCLUIR para confirmar:`);
            if (confirmText?.toUpperCase() !== 'EXCLUIR') return;
        } else {
            if (!window.confirm('Mover para lixeira?')) return;
        }

        const toastId = toast.loading('Processando...');
        try {
            if (isTrash) {
                await api.delete(`/management/users/${u.id}/permanent`);
            } else {
                await api.delete(`/management/users/${u.id}`);
            }
            toast.success('Sucesso!', { id: toastId });
            onSuccess();
        } catch (err: any) {
            toast.error('Erro ao excluir', { id: toastId });
        }
    };

    const restoreUser = async (u: UserData) => {
        if (!window.confirm(`Restaurar ${u.name}?`)) return;
        const toastId = toast.loading('Restaurando...');
        try {
            await api.post(`/management/users/${u.id}/restore`);
            toast.success('Restaurado!', { id: toastId });
            onSuccess();
        } catch (err: any) {
            toast.error('Erro ao restaurar', { id: toastId });
        }
    };

    return { saveUser, deleteUser, restoreUser };
}