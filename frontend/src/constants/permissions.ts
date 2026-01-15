export const PERMISSION_MODULES = [
    // === STAFF PERMISSIONS ===
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chat', label: 'Bate-papo' },
    { id: 'feed', label: 'Mural' },
    { id: 'quotes', label: 'Orçamentos' },
    { id: 'agenda-spa', label: 'Agenda SPA' },
    { id: 'agenda-log', label: 'Agenda LOG' },
    { id: 'kanban', label: 'Kanban (Legado)' },
    { id: 'customers', label: 'Clientes' },
    { id: 'services', label: 'Serviços' },
    { id: 'products', label: 'Produtos' },
    { id: 'billing', label: 'Financeiro' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'management', label: 'Gestão' },
    { id: 'transport', label: 'Transporte' },
    { id: 'transport-config', label: 'Config. Transporte' },
    { id: 'users', label: 'Usuários' },
    { id: 'hr-collaborators', label: 'RH - Colaboradores' },
    { id: 'hr-pay-periods', label: 'RH - Fechamentos' },
    { id: 'support', label: 'Chamados Técnicos' },
    { id: 'my-hr', label: 'Meu RH' },
    { id: 'strategy', label: 'Estratégia' },

    // === CLIENT PERMISSIONS ===
    { id: 'client-dashboard', label: 'Dashboard (Cliente)' },
    { id: 'client-pets', label: 'Meus Pets (Cliente)' },
    { id: 'client-chat', label: 'Bate-papo (Cliente)' },
    { id: 'client-schedule', label: 'Agendar Serviço (Cliente)' },
    { id: 'client-appointments', label: 'Agendamentos (Cliente)' },
    { id: 'client-quote-request', label: 'Solicitar Orçamento (Cliente)' },
    { id: 'client-quotes', label: 'Meus Orçamentos (Cliente)' },
    { id: 'client-payments', label: 'Pagamentos (Cliente)' },

    // === SHARED PERMISSIONS (Both Client & Staff) ===
    { id: 'notifications', label: 'Notificações' },
    { id: 'profile', label: 'Meu Perfil' },
    { id: 'settings', label: 'Configurações App' },
];

// Fallback defaults if permission array is empty or undefined
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, string[]> = {
    'MASTER': PERMISSION_MODULES.map(m => m.id),
    'ADMIN': [...PERMISSION_MODULES.filter(m => !m.id.startsWith('client-')).map(m => m.id), 'strategy'],
    'GESTAO': [
        'dashboard', 'chat', 'feed', 'quotes', 'agenda-spa', 'agenda-log',
        'customers', 'services', 'products', 'billing', 'reports', 'management',
        'transport', 'transport-config', 'hr-collaborators', 'hr-pay-periods', 'support',
        'notifications', 'profile', 'my-hr', 'settings', 'users'
    ],
    'OPERACIONAL': [
        'dashboard', 'chat', 'feed', 'agenda-spa', 'agenda-log',
        'transport', 'support', 'notifications', 'profile', 'my-hr', 'settings'
    ],
    'SPA': [
        'agenda-spa', 'chat', 'feed', 'support', 'notifications',
        'profile', 'my-hr', 'settings'
    ],
    'CLIENTE': [
        'client-dashboard', 'client-pets', 'client-chat', 'client-schedule',
        'client-appointments', 'client-quote-request', 'client-quotes', 'client-payments',
        'notifications', 'profile', 'settings'
    ]
};
