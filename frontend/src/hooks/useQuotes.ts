import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export type QuoteView = 'active' | 'trash' | 'history';

// 1. Hook para buscar orçamentos
export function useQuotes(view: QuoteView = 'active') {
    return useQuery({
        queryKey: ['quotes', view],
        queryFn: () => api.get(view === 'trash' ? '/quotes/trash' : '/quotes'),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
    });
}

// 2. Hook para buscar um orçamento específico
export function useQuote(id?: string) {
    return useQuery({
        queryKey: ['quote', id],
        queryFn: () => api.get(`/quotes/${id}`),
        select: (data) => data.data,
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
}

// 3. Mutações com invalidação otimizada
export function useUpdateQuoteStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quoteId, status, reason }: { quoteId: string, status: string, reason?: string }) =>
            api.patch(`/quotes/${quoteId}/status`, { status, reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Erro ao atualizar status';
            toast.error(message);
        }
    });
}

export function useApproveQuote() {
    const updateStatus = useUpdateQuoteStatus();

    return useMutation({
        mutationFn: (quoteId: string) => updateStatus.mutateAsync({ quoteId, status: 'APROVADO' }),
        onSuccess: () => {
            toast.success('Orçamento aprovado!');
        }
    });
}

export function useRejectQuote() {
    const updateStatus = useUpdateQuoteStatus();

    return useMutation({
        mutationFn: (quoteId: string) => updateStatus.mutateAsync({ quoteId, status: 'REJEITADO' }),
        onSuccess: () => {
            toast.success('Orçamento reprovado');
        }
    });
}

export function useDeleteQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/quotes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Orçamento movido para a lixeira');
        }
    });
}

export function useDuplicateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(`/quotes/${id}/duplicate`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Orçamento duplicado');
        }
    });
}

export function useBulkDeleteQuotes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => api.post('/quotes/bulk-delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Itens excluídos com sucesso');
        }
    });
}

export function useRestoreQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(`/quotes/${id}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Orçamento restaurado');
        }
    });
}

export function usePermanentDeleteQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/quotes/${id}/permanent`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Excluído permanentemente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || 'Erro ao excluir permanentemente';
            toast.error(message);
        }
    });
}

export function useReactivateQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.patch(`/quotes/${id}`, { status: 'SOLICITADO' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            toast.success('Orçamento reativado');
        }
    });
}

export function useApproveAndSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ quoteId, performerId }: { quoteId: string, performerId?: string }) =>
            api.post(`/quotes/${quoteId}/approve-and-schedule`, { performerId }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['quote'] });
            queryClient.invalidateQueries({ queryKey: ['staff-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast.success('Orçamento aprovado e agendado com sucesso!');
            return data.data;
        },
        onError: (error: any) => {
            const message = error.response?.data?.error || 'Erro ao agendar automaticamente';
            toast.error(message);
        }
    });
}
