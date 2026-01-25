import { UserData, UserFormData, ValidationResult } from '../types';
import { getDivisionBgClass, getDivisionTextClass, DIVISION_LABELS } from '../../../../constants/divisions';

/**
 * User utility functions for the User Management module
 */

/**
 * Format user name for display
 */
export const formatUserDisplayName = (user: UserData): string => {
    if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.name || user.email.split('@')[0];
};

/**
 * Format user initials for avatar
 */
export const getUserInitials = (user: UserData): string => {
    const firstName = user.firstName?.[0] || user.name?.[0] || user.email[0];
    return firstName?.toUpperCase() || '?';
};

/**
 * Get user display code (CL/OP + ID)
 */
export const getUserDisplayCode = (user: UserData): string => {
    const code = user.division === 'CLIENTE' ? 'CL' : 'OP';
    const id = String(user.staffId ?? user.seqId).padStart(4, '0');
    return `${code}-${id}`;
};

/**
 * Get user last seen text
 */
export const getLastSeenText = (user: UserData): string => {
    if (user.isOnline) {
        return 'Online agora';
    }
    
    if (user.lastSeenAt) {
        return `Último acesso em ${new Date(user.lastSeenAt).toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
    }
    
    return 'Offline';
};

/**
 * Check if user is eligible for execution
 */
export const isUserEligible = (user: UserData): boolean => {
    return user.division !== 'CLIENTE' && user.isEligible !== false;
};

/**
 * Get user status display
 */
export const getUserStatusDisplay = (user: UserData): { text: string; color: string } => {
    if (user.division === 'CLIENTE') {
        return { text: '-', color: 'text-gray-300' };
    }
    
    if (user.isEligible !== false) {
        return { 
            text: 'Disponível', 
            color: 'bg-green-100 text-green-600' 
        };
    }
    
    return { 
        text: 'Bloqueado', 
        color: 'bg-red-100 text-red-600' 
    };
};

/**
 * Get division display label
 */
export const getDivisionDisplay = (user: UserData): string => {
    const division = user.division || user.role || 'CLIENTE';
    return DIVISION_LABELS[division as keyof typeof DIVISION_LABELS] || division || 'N/A';
};

/**
 * Parse permissions from string or array
 */
export const parsePermissions = (permissions?: string | string[]): string[] => {
    if (!permissions) return [];
    
    if (typeof permissions === 'string') {
        try {
            return JSON.parse(permissions);
        } catch (e) {
            console.error('Error parsing permissions:', e);
            return [];
        }
    }
    
    return permissions;
};

/**
 * Stringify permissions for storage
 */
export const stringifyPermissions = (permissions: string[]): string => {
    return JSON.stringify(permissions);
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user: UserData, permissionId: string): boolean => {
    const permissions = parsePermissions(user.permissions);
    return permissions.includes(permissionId);
};

/**
 * Get user avatar style
 */
export const getUserAvatarStyle = (user: UserData): React.CSSProperties => {
    if (user.color) {
        return { backgroundColor: user.color, color: 'white' };
    }
    
    return {};
};

/**
 * Get user avatar classes
 */
export const getUserAvatarClasses = (user: UserData): string => {
    const division = user.division || user.role || 'CLIENTE';
    return `${getDivisionBgClass(division)} ${getDivisionTextClass(division)}`;
};

/**
 * Prepare form data from user for editing
 */
export const prepareFormDataFromUser = (user: UserData): UserFormData => {
    const permissions = parsePermissions(user.permissions);
    
    // Check if role is standard or custom
    const isStandardRole = user.role === 'MASTER' || user.role === 'CLIENTE';
    
    return {
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
    };
};

/**
 * Validate user form data
 */
export const validateUserFormData = (formData: UserFormData): ValidationResult => {
    const errors: string[] = [];
    
    // Basic validation
    if (!formData.firstName.trim() && !formData.lastName.trim() && !formData.name.trim()) {
        errors.push('Nome é obrigatório');
    }
    
    if (!formData.email.trim()) {
        errors.push('E-mail é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('E-mail inválido');
    }
    
    if (!formData.division) {
        errors.push('Divisão é obrigatória');
    }
    
    if (!formData.role) {
        errors.push('Cargo é obrigatório');
    }
    
    // Client-specific validation
    if (formData.division === 'CLIENTE') {
        if (!formData.customer?.id && !formData.name) {
            errors.push('Nome do cliente é obrigatório');
        }
    }
    
    // Staff-specific validation
    if (formData.division !== 'CLIENTE') {
        if (!formData.document?.trim()) {
            errors.push('Documento é obrigatório para colaboradores');
        }
    }
    
    // Password validation for new users (no ID means new user)
    if (!formData.password) {
        errors.push('Senha é obrigatória para novos usuários');
    } else if (formData.password.length < 6) {
        errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Filter users by search term
 */
export const filterUsersBySearchTerm = (users: UserData[], searchTerm: string): UserData[] => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    
    return users.filter(u => {
        return u.email.toLowerCase().includes(term) ||
            u.firstName?.toLowerCase().includes(term) ||
            u.lastName?.toLowerCase().includes(term) ||
            u.name?.toLowerCase().includes(term) ||
            u.document?.includes(term) ||
            u.customer?.name?.toLowerCase().includes(term);
    });
};

/**
 * Sort users by specified criteria
 */
export const sortUsers = (users: UserData[], sortBy: 'name' | 'date' | 'id', sortOrder: 'asc' | 'desc'): UserData[] => {
    return [...users].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'name') {
            const nameA = formatUserDisplayName(a);
            const nameB = formatUserDisplayName(b);
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
};

/**
 * Check if user can be edited by current user
 */
export const canEditUser = (targetUser: UserData, _currentUser: any, isMaster: boolean): boolean => {
    // Master can edit everyone
    if (isMaster) return true;
    
    // Cannot edit ADMIN or MASTER users if not Master
    if (targetUser.role?.toUpperCase() === 'ADMIN' || targetUser.role?.toUpperCase() === 'MASTER') {
        return false;
    }
    
    return true;
};

/**
 * Check if user can be deleted by current user
 */
export const canDeleteUser = (targetUser: UserData, currentUser: any, isMaster: boolean): boolean => {
    // Master can delete everyone
    if (isMaster) return true;
    
    // Cannot delete ADMIN or MASTER users if not Master
    if (targetUser.role?.toUpperCase() === 'ADMIN' || targetUser.role?.toUpperCase() === 'MASTER') {
        return false;
    }
    
    // Cannot delete self
    if (targetUser.id === currentUser?.id) {
        return false;
    }
    
    return true;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};