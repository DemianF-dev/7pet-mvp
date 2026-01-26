import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME, getMobileStaleTime } from '../keys';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';
import { AppointmentsService } from '../../features/agenda/services/appointments.service';
import api from '../../services/api';

const appointmentsService = new AppointmentsService(api);

/**
 * Filtros disponíveis para agenda
 */
export interface AgendaFilters {
  module?: 'SPA' | 'LOG' | 'ALL';
  performerId?: string;
  status?: string;
  customerId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  transportType?: string;
  search?: string;
  category?: string;
}

/**
 * Resposta da API de agenda formatada
 */
export interface AgendaDayResponse {
  appointments: Array<{
    id: string;
    customerId: string;
    customer: {
      name: string;
      phone?: string;
      user: { email: string };
      type: string;
    };
    petId: string;
    pet: {
      name: string;
      species?: string;
      breed?: string;
    };
    services?: Array<{
      id: string;
      name: string;
      duration: number;
      basePrice?: number;
      price?: number;
    }>;
    startAt: string;
    endAt: string;
    status: string;
    category?: string;
    performer?: {
      id: string;
      name: string;
      color?: string;
    };
    notes?: string;
    transport?: {
      origin?: string;
      destination?: string;
      type?: string;
    };
    conflicts?: Array<{
      type: string;
      description: string;
    }>;
  }>;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    revenue: number;
  };
  conflicts: Array<{
    id: string;
    description: string;
    type: 'OVERLAP' | 'UNAVAILABLE_PERFORMER' | 'RESOURCE_CONFLICT';
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface AgendaWeekResponse {
  days: Array<{
    date: string;
    appointments: any[];
    availableSlots: number[];
    conflicts: any[];
  }>;
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    totalSlots: number;
  };
}

export interface AgendaMonthResponse {
  weeks: Array<{
    startDate: string;
    endDate: string;
    days: AgendaWeekResponse['days'];
  }>;
  summary: {
    totalAppointments: number;
    totalRevenue: number;
    utilization: number;
  };
}

/**
 * Hook para agenda diária - O mais crítico da aplicação
 */
export function useAgendaDay(
  date: string,
  filters: AgendaFilters = {},
  options?: {
    enabled?: boolean;
    suspense?: boolean;
  }
) {
  const { isMobile, isSlowConnection } = useDeviceInfo();

  return useQuery({
    queryKey: queryKeys.agenda.day(date, filters.module, filters),
    queryFn: () => appointmentsService.getDay(date, filters),

    // Stale time otimizado para mobile
    staleTime: isMobile
      ? getMobileStaleTime(STALE_TIME.REAL_TIME) // 15s mobile
      : STALE_TIME.REAL_TIME, // 15s web
    gcTime: 5 * 60 * 1000, // 5 minutos

    // Manter dados visíveis enquanto atualiza (stale-while-revalidate)
    placeholderData: (previousData: any) => previousData,

    enabled: options?.enabled !== false && !!date,

    // Optimizações para mobile/conexão lenta
    refetchOnWindowFocus: false, // Mobile battery
    retry: isSlowConnection ? 0 : 1, // Sem retry em conexão lenta

    select: (data: AgendaDayResponse) => ({
      appointments: data.appointments || [],
      summary: data.summary || {
        total: 0,
        byStatus: {},
        byCategory: {},
        revenue: 0,
      },
      conflicts: data.conflicts || [],
      hasConflicts: (data.conflicts || []).length > 0,
      isLoadingMore: false,
    }),
  });
}

/**
 * Hook para agenda semanal (Dashboard e Calendar)
 */
export function useAgendaWeek(
  startDate: string,
  endDate: string,
  module?: string,
  options?: {
    enabled?: boolean;
  }
) {
  const { isMobile } = useDeviceInfo();

  return useQuery({
    queryKey: queryKeys.agenda.week(startDate, endDate, module),
    queryFn: () => appointmentsService.getWeek(startDate, endDate, { module }),

    // Stale time maior para semana (menos sensível a mudanças)
    staleTime: isMobile
      ? getMobileStaleTime(STALE_TIME.LISTS.WEB) // 2min mobile
      : STALE_TIME.LISTS.WEB, // 2min web
    gcTime: 10 * 60 * 1000, // 10 minutos

    placeholderData: (previousData: any) => previousData,

    enabled: options?.enabled !== false && !!startDate && !!endDate,

    select: (data: any) => ({
      days: data?.days || [],
      summary: data?.summary || {},
      hasData: (data?.days || []).length > 0,
      hasConflicts: (data?.days || []).some((d: any) => d.conflicts?.length > 0),
    }),
  });
}

/**
 * Hook para detectar conflitos na agenda
 */
export function useAgendaConflicts(
  startDate: string,
  endDate: string,
  excludeId?: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: queryKeys.agenda.conflicts(startDate, endDate),
    queryFn: () => appointmentsService.getConflicts(startDate, endDate, { excludeId }),

    // Conflitos precisam estar muito atualizados
    staleTime: 10 * 1000, // 10s
    gcTime: 1 * 60 * 1000, // 1 minuto

    enabled: options?.enabled !== false && !!startDate && !!endDate,

    select: (data: any) => ({
      conflicts: data?.conflicts || [],
      hasConflicts: (data?.conflicts || []).length > 0,
      hasHighSeverityConflicts: (data?.conflicts || []).some((c: any) => c.severity === 'high'),
    }),
  });
}

/**
 * Hook para buscar rápida de agendamentos
 */
export function useAgendaSearch(
  query: string,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
  }
) {
  return useQuery({
    queryKey: queryKeys.agenda.day('search', 'ALL', { search: query }),
    queryFn: () => appointmentsService.search({ query }),

    // Search pode ter stale time curto
    staleTime: 20 * 1000, // 20s
    gcTime: 1 * 60 * 1000, // 1 minuto

    enabled: options?.enabled !== false && query.length >= 2,

    select: (data: any) => ({
      appointments: data?.appointments || [],
      total: data?.total || 0,
    }),
  });
}

/**
 * Hook combinado para dashboard (day + week + summary)
 */
export function useAgendaDashboard(
  selectedDate: string,
  weekRange: { start: string; end: string },
  filters: AgendaFilters = {}
) {
  const dayQuery = useAgendaDay(selectedDate, filters);
  const weekQuery = useAgendaWeek(weekRange.start, weekRange.end, filters.module);

  return {
    day: dayQuery.data,
    week: weekQuery.data,

    // Loading states
    isLoading: dayQuery.isLoading || weekQuery.isLoading,
    isRefetching: dayQuery.isFetching || weekQuery.isFetching,

    // Error states
    error: dayQuery.error || weekQuery.error,

    // Utility functions
    refetch: () => {
      dayQuery.refetch();
      weekQuery.refetch();
    },

    // Combined data
    summary: {
      today: dayQuery.data?.summary,
      week: weekQuery.data?.summary,
    },

    // Performance metrics
    hasData: !!(dayQuery.data?.appointments?.length === 0 && weekQuery.data?.days?.length === 0),
    hasConflicts: dayQuery.data?.hasConflicts || (weekQuery.data?.days || []).some((day: any) => day.conflicts?.length > 0),
  };
}