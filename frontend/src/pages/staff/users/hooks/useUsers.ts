import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socketManager } from '../../../../services/socketManager';
import api from '../../../../services/api';
import { UserData } from '../types';

export interface UseUsersReturn {
    // Data
    users: UserData[];
    filteredUsers: UserData[];
    allFilteredUsers: UserData[];
    isLoading: boolean;
    
    // Filters
    searchTerm: string;
    filterDivision: string;
    sortBy: 'name' | 'date' | 'id';
    sortOrder: 'asc' | 'desc';
    tab: 'active' | 'trash';
    
    // Pagination
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    
    // Password visibility
    visiblePasswordIds: string[];
    showModalPassword: boolean;
    
    // Actions
    setSearchTerm: (term: string) => void;
    setFilterDivision: (division: string) => void;
    setSortBy: (sortBy: 'name' | 'date' | 'id') => void;
    setSortOrder: (order: 'asc' | 'desc') => void;
    setTab: (tab: 'active' | 'trash') => void;
    setItemsPerPage: (items: number) => void;
    setCurrentPage: (page: number) => void;
    togglePasswordVisibility: (id: string) => void;
    setShowModalPassword: (show: boolean) => void;
    
    // Methods
    fetchUsers: () => Promise<void>;
    updateUserOnlineStatus: (userId: string, status: 'online' | 'offline') => void;
}

export function useUsers(): UseUsersReturn {
    const [searchParams] = useSearchParams();

    // Data state
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivision, setFilterDivision] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'id'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [tab, setTab] = useState<'active' | 'trash'>('active');

    // Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);

    // Password visibility state
    const [visiblePasswordIds, setVisiblePasswordIds] = useState<string[]>([]);
    const [showModalPassword, setShowModalPassword] = useState(false);

    // Fetch users from API
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/management/users${tab === 'trash' ? '?trash=true' : ''}`);
            console.log('[useUsers] Users fetched:', res.data?.length || 0);
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                console.error('[useUsers] API returned non-array:', res.data);
                setUsers([]);
            }
        } catch (err) {
            console.error('[useUsers] Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [tab]);

    // Real-time status updates
    useEffect(() => {
        const handleStatusUpdate = (data: { userId: string, status: 'online' | 'offline' }) => {
            updateUserOnlineStatus(data.userId, data.status);
        };

        socketManager.on('user_status', handleStatusUpdate);

        return () => {
            socketManager.off('user_status', handleStatusUpdate);
        };
    }, []);

    // Update user online status
    const updateUserOnlineStatus = useCallback((userId: string, status: 'online' | 'offline') => {
        setUsers(prevUsers => prevUsers.map(u =>
            u.id === userId ? { ...u, isOnline: status === 'online' } : u
        ));
    }, []);

    // Toggle password visibility
    const togglePasswordVisibility = useCallback((id: string) => {
        setVisiblePasswordIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    }, []);

    // Filtered and sorted users (for pagination calculation)
    const allFilteredUsers = useMemo(() => {
        return users
            .filter(u => {
                const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.document?.includes(searchTerm) ||
                    u.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

                const matchesDivision = filterDivision === 'ALL' || u.division === filterDivision;

                return matchesSearch && matchesDivision;
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
    }, [users, searchTerm, filterDivision, sortBy, sortOrder]);

    // Pagination logic
    const totalPages = Math.ceil(allFilteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredUsers = allFilteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDivision, sortBy, sortOrder, tab]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchUsers();
    }, [searchParams, fetchUsers]);

    // Deep link logic
    useEffect(() => {
        if (!isLoading && users.length > 0) {
            const editId = searchParams.get('editId');
            const emailParam = searchParams.get('email');

            if (editId || emailParam) {
                const foundUser = users.find(u => u.id === editId || u.email === emailParam);
                if (foundUser) {
                    // This would be handled by the parent component
                    // handleOpenUser(foundUser);
                    // Optional: Clean URL
                    // setSearchParams({}, { replace: true });
                }
            }
        }
    }, [isLoading, users, searchParams]);

    return {
        // Data
        users,
        filteredUsers,
        allFilteredUsers,
        isLoading,

        // Filters
        searchTerm,
        filterDivision,
        sortBy,
        sortOrder,
        tab,

        // Pagination
        itemsPerPage,
        currentPage,
        totalPages,
        startIndex,
        endIndex,

        // Password visibility
        visiblePasswordIds,
        showModalPassword,

        // Actions
        setSearchTerm,
        setFilterDivision,
        setSortBy,
        setSortOrder,
        setTab,
        setItemsPerPage,
        setCurrentPage,
        togglePasswordVisibility,
        setShowModalPassword,

        // Methods
        fetchUsers,
        updateUserOnlineStatus
    };
}