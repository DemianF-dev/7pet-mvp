// Shared interfaces for User Management module

export interface UserData {
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
        canRequestQuotes?: boolean;
        isBlocked?: boolean;
        riskLevel?: string;
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
    lastSeenAt?: string;
    deletedAt?: string;
    photo?: string;
}

export interface UserFormData {
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    password: string;
    phone: string;
    notes: string;
    division: string;
    role: string;
    permissions: string[];
    birthday: string;
    admissionDate: string;
    document: string;
    address: string;
    color: string;
    isEligible: boolean;
    isSupportAgent: boolean;
    active: boolean;
    isCustomRole: boolean;
    pauseMenuEnabled: boolean;
    allowedGames: string[];
    customer?: {
        id?: string;
        name?: string;
        canRequestQuotes?: boolean;
        isBlocked?: boolean;
        riskLevel?: string;
    };
}

export interface RolePermission {
    role: string;
    label?: string;
    permissions: string;
}

export interface NewRoleData {
    slug: string;
    label: string;
}

export interface UserFilters {
    searchTerm: string;
    filterDivision: string;
    sortBy: 'name' | 'date' | 'id';
    sortOrder: 'asc' | 'desc';
    tab: 'active' | 'trash';
}

export interface PaginationState {
    itemsPerPage: number;
    currentPage: number;
}

export interface SelectionState {
    selectedIds: string[];
}

export interface PasswordVisibilityState {
    visiblePasswordIds: string[];
    showModalPassword: boolean;
}

export interface ModalState {
    isModalOpen: boolean;
    isRoleModalOpen: boolean;
    isCustomerModalVisible: boolean;
    selectedUser: UserData | null;
    viewCustomerId: string | null;
}

export type SortBy = 'name' | 'date' | 'id';
export type SortOrder = 'asc' | 'desc';
export type TabType = 'active' | 'trash';
export type BulkStatusAction = 'available' | 'blockQuotes' | 'blockSystem';

// Form validation result
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// API response types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    error?: string;
    details?: string;
}

// User mutation states
export interface UserMutationState {
    loading: boolean;
    error: string | null;
}

// Bulk operation result
export interface BulkOperationResult {
    success: number;
    failed: number;
    errors?: string[];
}