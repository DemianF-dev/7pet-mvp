import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUsers } from '../hooks/useUsers';
import { UserData } from '../types';

// Mock API and socket
const mockApi = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    post: vi.fn()
};

vi.mock('../../../../services/api', () => mockApi);

// Mock socket manager
const mockSocketManager = {
    on: vi.fn(),
    off: vi.fn()
};

vi.mock('../../../../services/socketManager', () => mockSocketManager);

describe('useUsers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.get.mockResolvedValue({ data: [] });
        mockSocketManager.on.mockClear();
        mockSocketManager.off.mockClear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useUsers());
        
        expect(result.current.users).toEqual([]);
        expect(result.current.isLoading).toBe(true);
        expect(result.current.searchTerm).toBe('');
        expect(result.current.filterDivision).toBe('ALL');
        expect(result.current.sortBy).toBe('date');
        expect(result.current.sortOrder).toBe('desc');
        expect(result.current.tab).toBe('active');
        expect(result.current.itemsPerPage).toBe(50);
        expect(result.current.currentPage).toBe(1);
    });

    it('should fetch users on mount', async () => {
        const { result } = renderHook(() => useUsers());
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockApi.get).toHaveBeenCalledWith('/management/users');
        expect(result.current.isLoading).toBe(false);
    });

    it('should fetch trash users when tab changes', async () => {
        const { result } = renderHook(() => useUsers());
        
        await act(async () => {
            result.current.setTab('trash');
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockApi.get).toHaveBeenCalledWith('/management/users?trash=true');
        expect(result.current.tab).toBe('trash');
    });

    it('should handle socket status updates', () => {
        const { result } = renderHook(() => useUsers());
        const mockSocketHandler = vi.fn();
        
        // Simulate socket setup
        act(() => {
            mockSocketManager.on.mockImplementation((event, handler) => {
                if (event === 'user_status') {
                    return mockSocketHandler;
                }
                return vi.fn();
            });
        });

        // Simulate status update
        act(() => {
            mockSocketHandler({ userId: '1', status: 'online' });
        });

        expect(result.current.updateUserOnlineStatus('1', 'online')).not.toThrow();
        
        // Check if state is updated
        const updatedUsers = result.current.users.map(u => 
            u.id === '1' ? { ...u, isOnline: true } : u
        );
        
        expect(result.current.users).toEqual(updatedUsers);
    });

    it('should handle search term filtering', async () => {
        const { result } = renderHook(() => useUsers());
        const mockUsers = [
            { id: '1', email: 'john@example.com', name: 'John Smith' },
            { id: '2', email: 'jane@example.com', name: 'Jane Doe' }
        ];
        
        mockApi.get.mockResolvedValue({ data: mockUsers });
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.setSearchTerm('john');
        });

        expect(result.current.searchTerm).toBe('john');
        expect(result.current.filteredUsers).toHaveLength(1);
        expect(result.current.filteredUsers[0].name).toBe('John Smith');
    });

    it('should handle pagination correctly', async () => {
        const { result } = renderHook(() => useUsers());
        
        // Mock many users for pagination testing
        const mockUsers = Array.from({ length: 100 }, (_, i) => ({
            id: String(i + 1),
            email: `user${i + 1}@example.com`,
            name: `User ${i + 1}`,
            createdAt: new Date().toISOString()
        }));
        
        mockApi.get.mockResolvedValue({ data: mockUsers });
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.setItemsPerPage(20);
            result.current.setCurrentPage(3);
        });

        expect(result.current.totalPages).toBe(5);
        expect(result.current.startIndex).toBe(40);
        expect(result.current.endIndex).toBe(60);
        expect(result.current.filteredUsers).toHaveLength(20);
    });

    it('should reset page when filters change', () => {
        const { result } = renderHook(() => useUsers());
        
        act(() => {
            result.current.setSearchTerm('test');
        });

        expect(result.current.currentPage).toBe(1); // Should reset when filter changes
    });

    it('should toggle password visibility', () => {
        const { result } = renderHook(() => useUsers());
        const mockUsers = [{ id: '1', plainPassword: 'password123' }];
        
        mockApi.get.mockResolvedValue({ data: mockUsers });
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.togglePasswordVisibility('1');
        });

        expect(result.current.visiblePasswordIds).toContain('1');
    });

    it('should handle empty search results', () => {
        const { result } = renderHook(() => useUsers());
        const mockUsers = [
            { id: '1', email: 'john@example.com', name: 'John Smith' }
        ];
        
        mockApi.get.mockResolvedValue({ data: mockUsers });
        
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.setSearchTerm('nonexistent');
        });

        expect(result.current.filteredUsers).toHaveLength(0);
        expect(result.current.allFilteredUsers).toHaveLength(0);
    });
});