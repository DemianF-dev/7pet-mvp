import { useState, useEffect, useMemo, useCallback } from 'react';
import { useServices } from '../../../context/ServicesContext';
import { AgendaItem, AgendaDomain, AgendaViewType, AgendaTabType } from '../domain/types';
import { toast } from 'react-hot-toast';

interface UseAgendaViewModelProps {
    domain: AgendaDomain;
}

export function useAgendaViewModel({ domain }: UseAgendaViewModelProps) {
    const { appointments: appointmentsService, users: usersService } = useServices();

    // State
    const [appointments, setAppointments] = useState<AgendaItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<AgendaViewType>('MONTH');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDayDate, setSelectedDayDate] = useState(new Date()); // For COMPACT view day selection

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<AgendaTabType>('active');
    const [performers, setPerformers] = useState<any[]>([]); // Using any[] for Staff to avoid deep dependency import issues for now
    const [selectedPerformerId, setSelectedPerformerId] = useState<string>('ALL');

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<AgendaItem | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [preFillData, setPreFillData] = useState<any>(null);

    // Debug / Performance State
    const [lastFetch, setLastFetch] = useState<{ timestamp: number; durationMs: number; error?: string } | null>(null);

    // Initial Load & Mobile Detection
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const savedView = localStorage.getItem(`agenda${domain}View`);

        if (savedView && !isMobile) {
            setView(savedView as AgendaViewType);
        } else if (isMobile && view !== 'COMPACT') {
            setView('COMPACT');
        }

        fetchPerformers();
    }, [domain]);

    const fetchPerformers = async () => {
        try {
            const staffMembers = await usersService.listManagementUsers();
            setPerformers(staffMembers);
        } catch (err) {
            console.error('Erro ao buscar colaboradores:', err);
        }
    };

    const fetchAppointments = useCallback(async () => {
        const start = performance.now();
        setIsLoading(true);
        try {
            let data: AgendaItem[] = [];
            const category = domain === 'LOG' ? 'LOGISTICA' : 'SPA';

            if (tab === 'trash') {
                const trashData = await appointmentsService.listTrash();
                data = trashData.filter((a: AgendaItem) => a.category === category);
            } else {
                data = await appointmentsService.list({ category });
            }
            setAppointments(data);
            setLastFetch({ timestamp: Date.now(), durationMs: performance.now() - start });
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err);
            toast.error('Erro ao carregar agenda');
            setLastFetch({ timestamp: Date.now(), durationMs: performance.now() - start, error: String(err) });
        } finally {
            setIsLoading(false);
        }
    }, [domain, tab, appointmentsService]);

    // Reload when dependencies change
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);


    // Computed
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const matchesGlobal = a.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.services && a.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                (a.service && a.service.name.toLowerCase().includes(searchTerm.toLowerCase()));

            // Domain specific checks (Logistics)
            const matchesLogistics = domain === 'LOG' ? (
                (a.transport?.origin?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (a.transport?.destination?.toLowerCase().includes(searchTerm.toLowerCase()))
            ) : false;

            const matchesPerformer = selectedPerformerId === 'ALL' || a.performerId === selectedPerformerId;

            return (matchesGlobal || matchesLogistics) && matchesPerformer;
        });
    }, [appointments, searchTerm, selectedPerformerId, domain]);


    // Actions
    const handleViewChange = (v: AgendaViewType) => {
        setView(v);
        localStorage.setItem(`agenda${domain}View`, v);
    };

    const nextDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() + 1);
        else if (view === 'WEEK') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const prevDate = () => {
        const d = new Date(selectedDate);
        if (view === 'DAY') d.setDate(d.getDate() - 1);
        else if (view === 'WEEK') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };

    const setToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setSelectedDayDate(today);
    };

    // Bulk Actions
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredAppointments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAppointments.map(a => a.id));
        }
    };

    const handleBulkDelete = async () => {
        const action = tab === 'trash' ? 'excluir PERMANENTEMENTE' : 'mover para a lixeira';
        if (!window.confirm(`ATENÇÃO: Deseja realmente ${action} os ${selectedIds.length} itens selecionados?`)) return;

        try {
            if (tab === 'trash') {
                await appointmentsService.bulkPermanentDelete(selectedIds);
                toast.success('Itens excluídos permanentemente');
            } else {
                await appointmentsService.bulkDelete(selectedIds);
                toast.success('Itens movidos para a lixeira');
            }
            fetchAppointments();
            setSelectedIds([]);
            setIsBulkMode(false);
        } catch (err) {
            toast.error('Erro ao processar agendamentos');
        }
    };

    const handleBulkRestore = async () => {
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} itens?`)) return;
        try {
            await appointmentsService.bulkRestore(selectedIds);
            fetchAppointments();
            setSelectedIds([]);
            setIsBulkMode(false);
            toast.success('Itens restaurados com sucesso');
        } catch (err) {
            toast.error('Erro ao restaurar agendamentos');
        }
    };

    // Modal Actions
    const openCreateModal = (prefill?: any) => {
        setSelectedAppointment(null);
        setPreFillData(prefill || null);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const openEditModal = (appt: AgendaItem) => {
        setIsDetailsOpen(false);
        setSelectedAppointment(appt);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const openCopyModal = (appt: AgendaItem) => {
        setIsDetailsOpen(false);
        setSelectedAppointment(appt);
        setIsCopying(true);
        setIsFormOpen(true);
    };

    const openDetailsModal = (appt: AgendaItem) => {
        if (isBulkMode) {
            toggleSelect(appt.id);
            return;
        }
        setSelectedAppointment(appt);
        setIsDetailsOpen(true);
    };

    const closeModals = () => {
        setIsFormOpen(false);
        setIsDetailsOpen(false);
        setPreFillData(null);
    };

    return {
        state: {
            appointments: filteredAppointments,
            isLoading,
            view,
            selectedDate,
            selectedDayDate,
            searchTerm,
            tab,
            performers,
            selectedPerformerId,
            selectedIds,
            isBulkMode,
            isFormOpen,
            isDetailsOpen,
            selectedAppointment,
            isCopying,
            preFillData,
            lastFetch
        },
        actions: {
            setView: handleViewChange,
            setSelectedDate,
            setSelectedDayDate,
            setSearchTerm,
            setTab: (t: AgendaTabType) => { setTab(t); setSelectedIds([]); }, // Reset selection on tab change
            setSelectedPerformerId,
            setIsBulkMode,
            refresh: fetchAppointments,
            nextDate,
            prevDate,
            setToday,
            toggleSelect,
            selectAll: handleSelectAll,
            bulkDelete: handleBulkDelete,
            bulkRestore: handleBulkRestore,
            openCreateModal,
            openEditModal,
            openCopyModal,
            openDetailsModal,
            closeModals
        }
    };
}
