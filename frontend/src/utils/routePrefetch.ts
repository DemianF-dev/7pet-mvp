/**
 * Route Prefetch Utility
 * 
 * Preloads route chunks on user interaction (hover/click) before navigation.
 * This creates a snappier experience by eliminating the wait for chunk downloads.
 * 
 * Usage in menu/navigation:
 * ```tsx
 * <button onMouseEnter={() => prefetchRoute('customers')}>
 *   Customers
 * </button>
 * ```
 */

export type RouteKey =
    | 'agenda-spa'
    | 'agenda-log'
    | 'customers'
    | 'customer-detail'
    | 'quotes'
    | 'quote-editor'
    | 'services'
    | 'products'
    | 'billing'
    | 'management'
    | 'reports'
    | 'users'
    | 'transport'
    | 'kanban'
    | 'chat'
    | 'feed'
    | 'hr'
    | 'strategy'
    | 'audit'
    | 'marketing';

/**
 * Map of route keys to their dynamic import functions
 * Only includes heavy routes that benefit from prefetching
 */
const routeImportMap: Record<RouteKey, () => Promise<any>> = {
    'agenda-spa': () => import('../pages/staff/AgendaSPA'),
    'agenda-log': () => import('../pages/staff/AgendaLOG'),
    'customers': () => import('../pages/staff/CustomerManager'),
    'customer-detail': () => import('../pages/staff/CustomerDetail'),
    'quotes': () => import('../pages/staff/QuoteManager'),
    'quote-editor': () => import('../pages/staff/QuoteEditor'),
    'services': () => import('../pages/staff/ServiceManager'),
    'products': () => import('../pages/staff/ProductManager'),
    'billing': () => import('../pages/staff/BillingManager'),
    'management': () => import('../pages/staff/ManagementDashboard'),
    'reports': () => import('../pages/staff/FinancialReports'),
    'users': () => import('../pages/staff/users'),
    'transport': () => import('../pages/staff/TransportManager'),
    'kanban': () => import('../pages/staff/ServiceKanban'),
    'chat': () => import('../pages/staff/ChatPage'),
    'feed': () => import('../pages/staff/FeedPage'),
    'hr': () => import('../pages/staff/MyHR'),
    'strategy': () => import('../pages/staff/StrategyManager'),
    'audit': () => import('../pages/staff/AuditConsole'),
    'marketing': () => import('../pages/staff/marketing/MarketingCenter'),
};

/**
 * Cache to track which routes have already been prefetched
 * Prevents redundant network requests
 */
const prefetchedRoutes = new Set<RouteKey>();

/**
 * Prefetch a route chunk
 * 
 * @param key - Route identifier from RouteKey type
 * @returns Promise that resolves when chunk is loaded (or immediately if already loaded)
 */
export function prefetchRoute(key: RouteKey): Promise<void> {
    // Already prefetched, skip
    if (prefetchedRoutes.has(key)) {
        return Promise.resolve();
    }

    const importFn = routeImportMap[key];
    if (!importFn) {
        console.warn(`[prefetchRoute] Unknown route key: ${key}`);
        return Promise.resolve();
    }

    // Mark as prefetched before starting
    prefetchedRoutes.add(key);

    // Trigger the import
    return importFn()
        .then(() => {
            if (import.meta.env.DEV) {
                console.log(`✅ Prefetched route: ${key}`);
            }
        })
        .catch((error) => {
            // If prefetch fails, remove from cache so it can be retried
            prefetchedRoutes.delete(key);
            console.warn(`Failed to prefetch route ${key}:`, error);
        });
}

/**
 * Prefetch multiple routes at once
 * Useful for preloading likely navigation paths
 */
export function prefetchRoutes(keys: RouteKey[]): Promise<void[]> {
    return Promise.all(keys.map(prefetchRoute));
}

/**
 * Clear prefetch cache (useful for testing or after errors)
 */
export function clearPrefetchCache(): void {
    prefetchedRoutes.clear();
}
