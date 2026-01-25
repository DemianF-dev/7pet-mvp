import { describe, it, expect } from 'vitest';
import {
    formatUserDisplayName,
    getUserInitials,
    getUserDisplayCode,
    getLastSeenText,
    isUserEligible,
    getUserStatusDisplay,
    getDivisionDisplay,
    parsePermissions,
    hasPermission,
    prepareFormDataFromUser,
    validateUserFormData,
    filterUsersBySearchTerm,
    sortUsers,
    canEditUser,
    canDeleteUser
} from '../utils/userHelpers';
import { UserData, UserFormData } from '../types';

describe('userHelpers', () => {
    const mockUser: UserData = {
        id: '1',
        email: 'test@example.com',
        division: 'CLIENTE',
        role: 'CLIENTE',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        notes: 'Test notes',
        createdAt: '2023-01-01',
        customer: {
            id: 'cust1',
            name: 'Test Customer',
            canRequestQuotes: true,
            isBlocked: false,
            riskLevel: 'Nivel 1'
        },
        staffId: 1001,
        birthday: '1990-01-01',
        admissionDate: '2020-01-01',
        document: '12345678901',
        address: 'Test Address',
        color: '#FF0000',
        isEligible: true,
        isSupportAgent: false,
        active: true,
        pauseMenuEnabled: false,
        allowedGames: ['game1', 'game2'],
        isOnline: true,
        lastSeenAt: '2023-01-01T10:00:00'
    };

    const mockStaffUser: UserData = {
        ...mockUser,
        division: 'OPERACIONAL',
        role: 'OPERACIONAL',
        staffId: 1001,
        isEligible: true
    };

    it('formatUserDisplayName should return correct display name', () => {
        expect(formatUserDisplayName(mockUser)).toBe('Test User');
        expect(formatUserDisplayName({ ...mockUser, firstName: '', lastName: '' })).toBe('Test User');
        expect(formatUserDisplayName({ ...mockUser, name: 'Full Name' })).toBe('Full Name');
    });

    it('getUserInitials should return correct initials', () => {
        expect(getUserInitials(mockUser)).toBe('T');
        expect(getUserInitials({ ...mockUser, firstName: 'John', lastName: 'Doe' })).toBe('JD');
    });

    it('getUserDisplayCode should return correct code', () => {
        expect(getUserDisplayCode(mockUser)).toBe('CL-1001');
        expect(getUserDisplayCode(mockStaffUser)).toBe('OP-1001');
    });

    it('getLastSeenText should return correct status text', () => {
        expect(getLastSeenText(mockUser)).toBe('Online agora');
        expect(getLastSeenText({ ...mockUser, isOnline: false, lastSeenAt: '2023-01-01' })).toBe('Último acesso em 01/01/2023, 10:00');
        expect(getLastSeenText({ ...mockUser, isOnline: false, lastSeenAt: null })).toBe('Offline');
    });

    it('isUserEligible should check eligibility correctly', () => {
        expect(isUserEligible(mockUser)).toBe(false);
        expect(isUserEligible(mockStaffUser)).toBe(true);
        expect(isUserEligible({ ...mockUser, division: 'CLIENTE', isEligible: true })).toBe(false); // Clients are never eligible
    });

    it('getUserStatusDisplay should return correct status', () => {
        const staffStatus = getUserStatusDisplay(mockStaffUser);
        expect(staffStatus.text).toBe('Disponível');
        expect(staffStatus.color).toBe('bg-green-100 text-green-600');

        const clientStatus = getUserStatusDisplay(mockUser);
        expect(clientStatus.text).toBe('-');
        expect(clientStatus.color).toBe('text-gray-300');
    });

    it('getDivisionDisplay should return correct label', () => {
        expect(getDivisionDisplay(mockUser)).toBe('Cliente');
        expect(getDivisionDisplay(mockStaffUser)).toBe('Operacional');
    });

    it('parsePermissions should handle JSON strings', () => {
        const permissions = ['dashboard', 'users'];
        const permissionsStr = JSON.stringify(permissions);
        
        expect(parsePermissions(permissionsStr)).toEqual(permissions);
        expect(parsePermissions(permissions)).toEqual(permissions);
        expect(parsePermissions('invalid')).toEqual([]);
        expect(parsePermissions(null)).toEqual([]);
        expect(parsePermissions(undefined)).toEqual([]);
    });

    it('hasPermission should check permissions correctly', () => {
        const userWithPerms = { ...mockUser, permissions: '["dashboard"]' };
        const userWithoutPerms = { ...mockUser, permissions: '[]' };
        
        expect(hasPermission(userWithPerms, 'dashboard')).toBe(true);
        expect(hasPermission(userWithPerms, 'users')).toBe(false);
        expect(hasPermission(userWithoutPerms, 'dashboard')).toBe(false);
    });

    it('prepareFormDataFromUser should convert user to form data', () => {
        const formData = prepareFormDataFromUser(mockUser);
        
        expect(formData.firstName).toBe(mockUser.firstName);
        expect(formData.lastName).toBe(mockUser.lastName);
        expect(formData.email).toBe(mockUser.email);
        expect(formData.password).toBe('');
        expect(formData.division).toBe(mockUser.division);
        expect(formData.role).toBe(mockUser.role);
        expect(formData.isEligible).toBe(mockUser.isEligible);
    });

    it('validateUserFormData should validate required fields', () => {
        const validFormData: UserFormData = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            division: 'CLIENTE',
            role: 'CLIENTE',
            permissions: [],
            birthday: '1990-01-01',
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
        };

        expect(validateUserFormData(validFormData)).toEqual({
            isValid: true,
            errors: []
        });
    });

    it('validateUserFormData should reject invalid email', () => {
        const invalidFormData = { ...validFormData, email: 'invalid-email' };
        
        const result = validateUserFormData(invalidFormData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('E-mail inválido');
    });

    it('validateUserFormData should reject weak password', () => {
        const invalidFormData = { ...validFormData, password: 'weak' };
        
        const result = validateUserFormData(invalidFormData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Senha deve ter pelo menos 6 caracteres');
    });

    it('validateUserFormData should reject missing name', () => {
        const invalidFormData = { ...validFormData, firstName: '', lastName: '', name: '' };
        
        const result = validateUserFormData(invalidFormData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Nome é obrigatório');
    });

    it('validateUserFormData should reject staff without document', () => {
        const invalidFormData = { ...validFormData, division: 'OPERACIONAL', document: '' };
        
        const result = validateUserFormData(invalidFormData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Documento é obrigatório para colaboradores');
    });

    it('filterUsersBySearchTerm should filter correctly', () => {
        const users = [mockUser, mockStaffUser];
        const filtered = filterUsersBySearchTerm(users, 'test');
        
        expect(filtered).toHaveLength(1);
        expect(filtered[0]).toBe(mockUser);
    });

    it('sortUsers should sort by name', () => {
        const users = [mockUser, mockStaffUser];
        const sorted = sortUsers(users, 'name', 'asc');
        
        expect(sorted[0].name).toBe('Test User');
        expect(sorted[1].name).toBe('Test User');
    });

    it('sortUsers should sort by date', () => {
        const users = [mockUser, mockStaffUser];
        const sorted = sortUsers(users, 'date', 'desc');
        
        expect(sorted[0].createdAt).toBeGreaterThan(sorted[1].createdAt);
    });

    it('canEditUser should check edit permissions', () => {
        const adminUser = { ...mockUser, role: 'ADMIN' };
        const masterUser = { ...mockUser, role: 'MASTER' };
        const currentUser = { role: 'USER' };
        
        expect(canEditUser(adminUser, currentUser, false)).toBe(false); // Non-master can't edit admin
        expect(canEditUser(adminUser, currentUser, true)).toBe(true); // Master can edit admin
        expect(canEditUser(masterUser, currentUser, false)).toBe(true); // Non-master can edit master (but master should be able to edit master)
        expect(canEditUser(mockUser, currentUser, true)).toBe(true); // Can edit regular users
    });

    it('canDeleteUser should check delete permissions', () => {
        const adminUser = { ...mockUser, role: 'ADMIN' };
        const masterUser = { ...mockUser, role: 'MASTER' };
        const currentUser = { role: 'USER' };
        const currentUserSelf = { id: '1', role: 'USER' };
        
        expect(canDeleteUser(adminUser, currentUser, false)).toBe(false); // Non-master can't delete admin
        expect(canDeleteUser(adminUser, currentUser, true)).toBe(true); // Master can delete admin
        expect(canDeleteUser(masterUser, currentUser, false)).toBe(true); // Non-master can delete master
        expect(canDeleteUser(currentUserSelf, currentUser, false)).toBe(false); // Can't delete self
    });
});