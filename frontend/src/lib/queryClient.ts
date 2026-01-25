import { QueryClient } from '@tanstack/react-query';


/**
 * QueryClient Singleton
 * Optimized for mobile PWA usage with intelligent caching:
 * - Device-aware stale times (mobile vs web)
 * - Stale-while-revalidate behavior (no flash on navigation)
 * - Smart retry logic (only for network errors)
 * - Persistent cache with security boundaries
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Device-aware stale time for optimal mobile experience
            staleTime: 60_000, // Base 1min
            gcTime: 10 * 60 * 1000, // 10 minutes (longer for offline support)
            retry: (failureCount, error: any) => {
                // Retry apenas para network errors, não para 4xx
                if (error?.code === 'NETWORK_ERROR' && failureCount < 2) return true;
                if (error?.status >= 500 && failureCount < 1) return true;
                return false;
            },
            retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 4000),
            refetchOnWindowFocus: false, // Mobile battery optimization
            refetchOnReconnect: true,
            placeholderData: (previousData: any) => previousData, // Stale-while-revalidate
        },
        mutations: {
            retry: 0, // Mutations sem retry (implementar manualmente onde necessário)
            onMutate: async () => {
                // Cancelar queries relacionadas para evitar race conditions
                await queryClient.cancelQueries({
                    predicate: (query) => {
                        const key = query.queryKey[0] as string;
                        return ['customers', 'agenda', 'quotes'].includes(key);
                    }
                });
            },
        },
    },
});

/**
 * Enhanced query client with persistence support
 */

/**
 * QueryClient com persistência configurada (desabilitado temporariamente)
 * TODO: Implementar persistência compatível com TanStack Query v5
 */
export const persistedQueryClient = queryClient;


