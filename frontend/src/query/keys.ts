/**
 * Query Keys Centralizadas - Hierárquicas e Contextuais
 * 
 * Estrutura:
 * [domain, entity, action, ...params]
 * 
 * Exemplos:
 * ['customers', 'list', 'active'] - Lista de clientes ativos
 * ['customers', 'detail', '123'] - Detalhe do cliente 123
 * ['agenda', 'day', '2024-01-24', 'SPA'] - Agenda do dia 24/01/2024 módulo SPA
 */

export const queryKeys = {
  // ========================================
  // AUTH & USER DOMAIN
  // ========================================
  auth: {
    me: ['auth', 'me'] as const,
    permissions: ['auth', 'permissions'] as const,
    profile: ['auth', 'profile'] as const,
  },

  // ========================================
  // STAFF DOMAIN
  // ========================================
  staff: {
    metrics: ['staff', 'metrics'] as const,
    goals: ['staff', 'goals'] as const,
    widgets: ['staff', 'widgets'] as const,
    notifications: ['staff', 'notifications'] as const,
    users: {
      list: (tab?: string, filters?: Record<string, any>) =>
        ['staff', 'users', 'list', tab, filters] as const,
      detail: (id: string) => ['staff', 'users', 'detail', id] as const,
      search: (query: string) => ['staff', 'users', 'search', query] as const,
    },
  },

  // ========================================
  // CUSTOMERS DOMAIN
  // ========================================
  customers: {
    list: (tab?: string, filters?: Record<string, any>) =>
      ['customers', 'list', tab, filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    search: (query: string, limit?: number) =>
      ['customers', 'search', query, limit] as const,
    pets: (customerId: string) => ['customers', 'pets', customerId] as const,
    financial: (customerId: string) => ['customers', 'financial', customerId] as const,
  },

  // ========================================
  // AGENDA DOMAIN
  // ========================================
  agenda: {
    day: (date: string, module?: string, filters?: Record<string, any>) =>
      ['agenda', 'day', date, module, filters] as const,
    week: (startDate: string, endDate: string, module?: string) =>
      ['agenda', 'week', startDate, endDate, module] as const,
    month: (month: string, module?: string) =>
      ['agenda', 'month', month, module] as const,
    detail: (id: string) => ['agenda', 'detail', id] as const,
    availableSlots: (date: string, serviceIds?: string[]) =>
      ['agenda', 'slots', date, serviceIds] as const,
    conflicts: (startDate: string, endDate: string) =>
      ['agenda', 'conflicts', startDate, endDate] as const,
  },

  // ========================================
  // QUOTES DOMAIN
  // ========================================
  quotes: {
    list: (view?: 'active' | 'trash' | 'archived', filters?: Record<string, any>) =>
      ['quotes', 'list', view, filters] as const,
    detail: (id: string) => ['quotes', 'detail', id] as const,
    search: (query: string) => ['quotes', 'search', query] as const,
    metrics: (filters?: Record<string, any>) => ['quotes', 'metrics', filters] as const,
  },

  // ========================================
  // INVOICES DOMAIN
  // ========================================
  invoices: {
    list: (filters?: Record<string, any>) => ['invoices', 'list', filters] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
    metrics: (filters?: Record<string, any>) => ['invoices', 'metrics', filters] as const,
    payments: (invoiceId: string) => ['invoices', 'payments', invoiceId] as const,
  },

  // ========================================
  // SERVICES & PRODUCTS DOMAIN
  // ========================================
  services: {
    list: (category?: string, activeOnly?: boolean) =>
      ['services', 'list', category, activeOnly] as const,
    detail: (id: string) => ['services', 'detail', id] as const,
    search: (query: string) => ['services', 'search', query] as const,
  },

  products: {
    list: (category?: string, activeOnly?: boolean) =>
      ['products', 'list', category, activeOnly] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    search: (query: string) => ['products', 'search', query] as const,
    stock: (productId?: string) => ['products', 'stock', productId] as const,
  },

  // ========================================
  // PETS DOMAIN
  // ========================================
  pets: {
    list: (customerId?: string, filters?: Record<string, any>) =>
      ['pets', 'list', customerId, filters] as const,
    detail: (id: string) => ['pets', 'detail', id] as const,
    search: (query: string, customerId?: string) =>
      ['pets', 'search', query, customerId] as const,
    medical: (petId: string) => ['pets', 'medical', petId] as const,
    history: (petId: string) => ['pets', 'history', petId] as const,
  },

  // ========================================
  // CHAT DOMAIN
  // ========================================
  chat: {
    conversations: () => ['chat', 'conversations'] as const,
    messages: (conversationId: string, page?: number) =>
      ['chat', 'messages', conversationId, page] as const,
    users: (search?: string) => ['chat', 'users', search] as const,
    unread: () => ['chat', 'unread'] as const,
    typing: (conversationId: string) => ['chat', 'typing', conversationId] as const,
  },

  // ========================================
  // TRANSPORT DOMAIN
  // ========================================
  transport: {
    calculate: (data: any) => ['transport', 'calculate', data] as const,
    providers: (filters?: Record<string, any>) =>
      ['transport', 'providers', filters] as const,
    history: (customerId?: string) => ['transport', 'history', customerId] as const,
    routes: (origin: string, destination: string) =>
      ['transport', 'routes', origin, destination] as const,
  },

  // ========================================
  // CLIENT DOMAIN
  // ========================================
  client: {
    dashboard: () => ['client', 'dashboard'] as const,
    profile: () => ['client', 'profile'] as const,
    pets: () => ['client', 'pets'] as const,
    appointments: (filters?: Record<string, any>) =>
      ['client', 'appointments', filters] as const,
    quotes: (view?: 'active' | 'completed' | 'archived') =>
      ['client', 'quotes', view] as const,
    invoices: (view?: 'pending' | 'paid' | 'overdue') =>
      ['client', 'invoices', view] as const,
  },

  // ========================================
  // NOTIFICATIONS DOMAIN
  // ========================================
  notifications: {
    list: (tab?: 'all' | 'unread' | 'important', filters?: Record<string, any>) =>
      ['notifications', 'list', tab, filters] as const,
    count: () => ['notifications', 'count'] as const,
    settings: () => ['notifications', 'settings'] as const,
  },

  // ========================================
  // ANALYTICS & REPORTS
  // ========================================
  analytics: {
    revenue: (period: string, filters?: Record<string, any>) =>
      ['analytics', 'revenue', period, filters] as const,
    appointments: (period: string, filters?: Record<string, any>) =>
      ['analytics', 'appointments', period, filters] as const,
    customers: (period: string, filters?: Record<string, any>) =>
      ['analytics', 'customers', period, filters] as const,
    services: (period: string, filters?: Record<string, any>) =>
      ['analytics', 'services', period, filters] as const,
  },

  // ========================================
  // SYSTEM & UTILITIES
  // ========================================
  system: {
    health: () => ['system', 'health'] as const,
    cache: () => ['system', 'cache'] as const,
    config: () => ['system', 'config'] as const,
  },
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Gera query key para listas com paginação
 */
export const createPaginatedKey = (
  baseKey: readonly string[],
  page: number,
  pageSize: number,
  filters?: Record<string, any>
) => [...baseKey, 'paginated', page, pageSize, filters] as const;

/**
 * Gera query key para busca com debounce
 */
export const createSearchKey = (
  baseKey: readonly string[],
  query: string,
  options?: Record<string, any>
) => [...baseKey, 'search', query, options] as const;

/**
 * Verifica se uma query key pertence a um domínio específico
 */
export const isQueryKeyInDomain = (
  queryKey: readonly string[],
  domain: keyof typeof queryKeys
): boolean => {
  return queryKey[0] === domain;
};

/**
 * Extrai o domínio de uma query key
 */
export const getDomainFromKey = (queryKey: readonly string[]): string | null => {
  return queryKey[0] || null;
};

/**
 * Verifica se uma query é de listagem
 */
export const isListQuery = (queryKey: readonly string[]): boolean => {
  const [, secondLevel] = queryKey;
  return secondLevel === 'list';
};

/**
 * Verifica se uma query é de detalhe
 */
export const isDetailQuery = (queryKey: readonly string[]): boolean => {
  const [, secondLevel] = queryKey;
  return secondLevel === 'detail';
};

/**
 * Gera predicado para invalidação de queries de um domínio
 */
export const createDomainPredicate = (domain: keyof typeof queryKeys) => {
  const baseKey = domain as string;
  return (query: { queryKey: readonly string[] }) => {
    return query.queryKey[0] === baseKey;
  };
};

/**
 * Gera predicado para invalidação de queries de múltiplos domínios
 */
export const createMultiDomainPredicate = (domains: (keyof typeof queryKeys)[]) => {
  const baseKeys = domains.map(domain => domain as string);
  return (query: { queryKey: readonly string[] }) => {
    return baseKeys.includes(query.queryKey[0] as string);
  };
};

// ========================================
// CONSTANTS FOR STALE TIME
// ========================================
export const STALE_TIME = {
  // Tempo real - 15s (agenda, chat)
  REAL_TIME: 15 * 1000,

  // Listas - 1min mobile, 2min web
  LISTS: {
    MOBILE: 60 * 1000,
    WEB: 120 * 1000,
  },

  // Detalhes - 25min (dados mudam pouco)
  DETAIL: 25 * 60 * 1000,

  // Dashboards - 5min
  DASHBOARD: 5 * 60 * 1000,

  // Buscas - 30s
  SEARCH: 30 * 1000,

  // Análiticos - 10min
  ANALYTICS: 10 * 60 * 1000,

  // Configurações - 30min
  SETTINGS: 30 * 60 * 1000,
} as const;

/**
 * Detecta se é mobile para stale time otimizado
 */
export const getMobileStaleTime = (baseStaleTime: number): number => {
  // Se for mobile ou dispositivo com pouca memória, reduz tempo
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const isLowEnd = deviceMemory <= 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isLowEnd || isMobile) {
    return Math.min(baseStaleTime, STALE_TIME.LISTS.MOBILE);
  }

  return baseStaleTime;
};

/**
 * Verifica se uma query deve ser persistida (cache seguro)
 */
export const shouldPersistQuery = (queryKey: readonly unknown[]): boolean => {
  const domain = queryKey[0] as string;

  // Domínios seguros para persistência
  const safeDomains = [
    'customers',
    'agenda',
    'quotes',
    'services',
    'products',
    'pets',
    'transport',
    'client',
    'notifications',
  ];

  // Não persistir dados sensíveis
  const sensitiveDomains = [
    'auth',
    'staff',
    'analytics',
    'system',
    'invoices', // dados financeiros
  ];

  return safeDomains.includes(domain) && !sensitiveDomains.includes(domain);
};