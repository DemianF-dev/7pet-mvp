import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '../keys';
import { getOptimizedStaleTime, useDeviceInfo } from '../../hooks/useDeviceInfo';
import { CustomersService, type Customer } from '../../services/domains/customers.service';
import api from '../../services/api';

/**
 * Filtros disponíveis para clientes
 */
export interface CustomerFilters {
  tab?: 'active' | 'trash' | 'archived';
  search?: string;
  status?: string;
  category?: string;
  dateRange?: { start: string; end: string };
  region?: string;
}

/**
 * Resposta da API de clientes formatada
 */
export interface CustomerResponse {
  customers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    avatar?: string;
    type: string;
    since: string;
    lastSeen?: string;
    isInactive?: boolean;
    balance?: number;
    stats: {
      totalAppointments: number;
      totalRevenue: number;
      lastAppointment?: string;
    };
  }>;
  pagination?: {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    hasPrevious: boolean;
    nextPage: string | null;
  };
  summary: {
    total: number;
    activeCount: number;
    inactiveCount: number;
    balanceTotal: number;
    revenue: number;
    growthRate: number;
    byRegion: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

/**
 * Hook para lista de clientes com paginação
 */
export function useCustomersList(
  tab: string = 'active',
  filters: CustomerFilters = {},
  options?: {
    enabled?: boolean;
  }
) {
  const { isMobile, isSlowConnection } = useDeviceInfo();
  const customersService = new CustomersService(api);
  
  return useQuery({
    queryKey: queryKeys.customers.list(tab, filters),
    queryFn: () => {
      if (tab === 'trash') {
        return customersService.listTrash();
      }
      return customersService.list();
    },
    staleTime: getOptimizedStaleTime(isMobile ? STALE_TIME.LISTS.MOBILE : STALE_TIME.LISTS.WEB),
    gcTime: isMobile ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5min mobile, 10min web
    retry: isSlowConnection ? 0 : 1,
    placeholderData: (previousData) => previousData, // Stale-while-revalidate
    enabled: options?.enabled !== false,
    
    select: (data: Customer[]) => {
      // Transform the data to match both the Response interface and original Customer interface
      const transformedData: CustomerResponse = {
        customers: data.map(customer => ({
          // Original Customer interface properties
          ...customer,
          // Additional properties for Response interface
          document: undefined,
          avatar: undefined,
          since: '',
          lastSeen: undefined,
          isInactive: customer.type === 'AVULSO',
          balance: undefined,
          stats: {
            totalAppointments: customer._count?.appointments || 0,
            totalRevenue: 0,
            lastAppointment: undefined,
          },
        })),
        summary: {
          total: data.length,
          activeCount: data.filter(c => c.type === 'RECORRENTE').length,
          inactiveCount: data.filter(c => c.type === 'AVULSO').length,
          balanceTotal: 0,
          revenue: 0,
          growthRate: 0,
          byRegion: {},
          byCategory: {
            AVULSO: data.filter(c => c.type === 'AVULSO').length,
            RECORRENTE: data.filter(c => c.type === 'RECORRENTE').length,
          },
        },
        pagination: {
          page: 1,
          total: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          hasPrevious: false,
          nextPage: null,
        },
      };
      
      return transformedData;
    },
  });
}

/**
 * Hook para busca de clientes com infinite scroll
 */
export function useCustomersSearch(
  query: string,
  options?: {
    enabled?: boolean;
    limit?: number;
  }
) {
  const customersService = new CustomersService(api);
  
  return useInfiniteQuery({
    queryKey: queryKeys.customers.search(query, options?.limit),
    queryFn: () => {
      // For now, use the list method and filter client-side
      // TODO: Implement proper search in the service
      return customersService.list().then(customers => 
        customers.filter(customer => 
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.email?.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone.includes(query)
        )
      );
    },
    initialPageParam: 1,
    getNextPageParam: () => {
      // Since we're doing client-side filtering, return null to disable pagination
      return null;
    },
    staleTime: STALE_TIME.SEARCH, // 30s para busca
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 0,
    enabled: query.length >= 2,
    
    select: (data) => ({
      pages: data.pages || [],
      pageParams: data.pageParams || [],
      flatMap: () => data.pages.flat(),
    }),
  });
}

/**
 * Hook para detalhe do cliente
 */
export function useCustomerDetail(id: string, options?: { enabled?: boolean }) {
  const customersService = new CustomersService(api);
  
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersService.list().then(customers => 
      customers.find(customer => customer.id === id)
    ),
    staleTime: STALE_TIME.DETAIL, // 25min para detalhes (mudam pouco)
    enabled: options?.enabled !== false && !!id,
    
    select: (data: Customer | undefined) => {
      if (!data) return null;
      
      return {
        customer: data,
        pets: data.pets || [],
        financial: {}, // Not available in current service
        stats: {
          appointments: data._count?.appointments || 0,
          quotes: data._count?.quotes || 0,
          pets: data._count?.pets || 0,
        },
      };
    },
  });
}

/**
 * Hook para pets de um cliente
 */
export function useCustomerPets(customerId: string, options?: { enabled?: boolean }) {
  const customersService = new CustomersService(api);
  
  return useQuery({
    queryKey: queryKeys.customers.pets(customerId),
    queryFn: () => customersService.list().then(customers => {
      const customer = customers.find(c => c.id === customerId);
      return customer?.pets || [];
    }),
    staleTime: STALE_TIME.LISTS.WEB,
    enabled: options?.enabled !== false && !!customerId,
    
    select: (data: any[]) => ({
      pets: data || [],
      count: data?.length || 0,
      petsWithVaccines: [], // Not available in current service
    }),
  });
}

/**
 * Hook para dados financeiros do cliente
 */
export function useCustomerFinancial(customerId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customers.financial(customerId),
    queryFn: () => Promise.resolve({ // Mock data for now
      balance: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      lastAppointment: null,
    }),
    staleTime: STALE_TIME.DASHBOARD, // 10min para dados financeiros
    enabled: options?.enabled !== false && !!customerId,
  });
}

/**
 * Hook para dashboard do cliente
 */
export function useCustomerDashboard(customerId: string, options?: { enabled?: boolean }) {
  const customersService = new CustomersService(api);
  
  return useQuery({
    queryKey: queryKeys.customers.detail(customerId), // Reuse detail key
    queryFn: () => customersService.list().then(customers => {
      const customer = customers.find(c => c.id === customerId);
      return {
        customer,
        overview: {
          totalRevenue: 0,
          appointmentsCount: customer?._count?.appointments || 0,
          upcomingCount: 0,
          recentActivity: [],
          healthScore: 100,
        },
        stats: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          customerSince: '', // Not available
          appointmentCount: customer?._count?.appointments || 0,
          petCount: customer?._count?.pets || 0,
        },
      };
    }),
    staleTime: STALE_TIME.DASHBOARD, // 5min
    enabled: options?.enabled !== false && !!customerId,
    
    select: (data: any) => data,
  });
}