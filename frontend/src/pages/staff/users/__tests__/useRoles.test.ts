import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRoles } from '../hooks/useRoles';
import { UserData } from '../types';

// Mock data
const mockUsers: UserData[] = [
    {
        id: '1',
        email: 'test@example.com',
        division: 'CLIENTE',
        role: 'CLIENTE',
        name: 'Test User',
        createdAt: '2023-01-01',
        isEligible: false,
        isSupportAgent: false,
        active: true
    }
];

// Mock API
const mockApi = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
};

vi.mock('../../../../services/api', () => mockApi);

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn()
};

vi.mock('react-hot-toast', () => mockToast);

describe('useRoles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.get.mockResolvedValue({ data: [] });
        mockToast.success.mockClear();
        mockToast.error.mockClear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: false }));
        
        expect(result.current.rolePermissions).toEqual([]);
        expect(result.current.selectedConfigRole).toBe('OPERACIONAL');
        expect(result.current.editingRoleLabel).toBe('');
        expect(result.current.editingRolePerms).toEqual([]);
        expect(result.current.hasRoleChanges).toBe(false);
        expect(result.current.isAddingRole).toBe(false);
        expect(result.current.newRoleData).toEqual({ slug: '', label: '' });
    });

    it('should fetch role configs on mount', async () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        expect(mockApi.get).toHaveBeenCalledWith('/management/roles');
    });

    it('should handle save role config', async () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        // Set up editing state
        act(() => {
            result.current.setEditingRoleLabel('Test Role');
            result.current.setEditingRolePerms(['dashboard', 'users']);
            result.current.setHasRoleChanges(true);
        });

        await act(async () => {
            await result.current.handleSaveRoleConfig();
        });

        expect(mockApi.put).toHaveBeenCalledWith('/management/roles/OPERACIONAL', {
            label: 'Test Role',
            permissions: ['dashboard', 'users']
        });
        expect(mockToast.success).toHaveBeenCalledWith('Configurações do cargo salvas!');
    });

    it('should handle create role', async () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        act(() => {
            result.current.setNewRoleData({ slug: 'TEST', label: 'Test Role' });
            result.current.setIsAddingRole(true);
        });

        await act(async () => {
            await result.current.handleCreateRole();
        });

        expect(mockApi.put).toHaveBeenCalledWith('/management/roles/TEST', {
            label: 'Test Role',
            permissions: []
        });
        expect(mockToast.success).toHaveBeenCalledWith('Novo cargo criado!');
    });

    it('should handle delete role', async () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        // Mock window.confirm
        const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => {
            await result.current.handleDeleteRole('TEST');
        });

        expect(mockConfirm).toHaveBeenCalled();
        expect(mockApi.delete).toHaveBeenCalledWith('/management/roles/TEST');
        expect(mockToast.success).toHaveBeenCalledWith('Cargo excluído com sucesso');
    });

    it('should prevent deleting MASTER role', async () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        await act(async () => {
            await result.current.handleDeleteRole('MASTER');
        });

        expect(mockToast.error).toHaveBeenCalledWith('O cargo MASTER é vitalício e não pode ser excluído.');
        expect(mockApi.delete).not.toHaveBeenCalled();
    });

    it('should handle permission toggle', () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        
        act(() => {
            result.current.togglePermission('dashboard');
        });

        expect(result.current.editingRolePerms).toContain('dashboard');
        expect(result.current.hasRoleChanges).toBe(true);
    });

    it('should handle role change for form data', () => {
        const { result } = renderHook(() => useRoles({ users: mockUsers, isMaster: true }));
        const mockSetFormData = vi.fn();
        
        const mockRolePermissions = [
            { role: 'OPERACIONAL', permissions: '[\"dashboard\"]' }
        ];
        mockApi.get.mockResolvedValue({ data: mockRolePermissions });

        act(() => {
            result.current.handleRoleChange('OPERACIONAL', mockSetFormData);
        });

        expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({
            role: 'OPERACIONAL',
            division: 'COMERCIAL',
            permissions: ['dashboard'],
            isCustomRole: false
        }));
    });
});