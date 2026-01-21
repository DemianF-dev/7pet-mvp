import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient Singleton
 * Optimized for mobile PWA usage:
 * - Retry logic is light (1 attempt) because Axios already has retries
 * - Refetch on window focus is disabled for mobile performance
 * - Cache times are set to reduce network usage
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute stale time
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
            retry: 1, // Max 1 retry (Axios already has 2)
            retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 4000),
            refetchOnWindowFocus: false, // Disable for mobile battery/performance
            refetchOnReconnect: true,
        },
    },
});
