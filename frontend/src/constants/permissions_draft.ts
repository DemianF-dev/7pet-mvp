export const PERMISSION_MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chat', label: 'Bate-papo' },
    { id: 'feed', label: 'Mural' },
    { id: 'quotes', label: 'Orçamentos' },
    { id: 'agenda-spa', label: 'Agenda SPA' },
    { id: 'agenda-log', label: 'Agenda LOG' },
    { id: 'customers', label: 'Clientes' },
    { id: 'services', label: 'Serviços' },
    { id: 'products', label: 'Produtos' },
    { id: 'billing', label: 'Financeiro' },
    { id: 'reports', label: 'Relatórios' },
    { id: 'management', label: 'Gestão' },
    { id: 'transport-config', label: 'Config. Transporte' },
    { id: 'users', label: 'Usuários' },
    { id: 'hr-collaborators', label: 'RH - Colaboradores' },
    { id: 'hr-pay-periods', label: 'RH - Fechamentos' },
    { id: 'support', label: 'Chamados Técnicos' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'profile', label: 'Meu Perfil' },
    { id: 'my-hr', label: 'Meu RH' },
    { id: 'settings', label: 'Configurações App' },
    // Pausa is handled separately by pauseMenuEnabled, but if we wanted to unify:
    // { id: 'pausa', label: 'Menu Pausa' } 
];

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<string, string[]> = {
    'MASTER': PERMISSION_MODULES.map(m => m.id),
    'ADMIN': PERMISSION_MODULES.map(m => m.id), // Filter out maybe some strict ones if needed
    'GESTAO': ['dashboard', 'chat', 'feed', 'quotes', 'agenda-spa', 'agenda-log', 'customers', 'services', 'products', 'billing', 'reports', 'management', 'transport-config', 'hr-collaborators', 'hr-pay-periods', 'support', 'notifications', 'profile', 'my-hr', 'settings'],
    'OPERACIONAL': ['dashboard', 'chat', 'feed', 'agenda-spa', 'agenda-log', 'support', 'notifications', 'profile', 'my-hr', 'settings'],
    'CLIENTE': [], // Clients don't use StaffSidebar usually, they have their own layout. 
    'SPA': ['agenda-spa', 'chat', 'feed', 'support', 'notifications', 'profile', 'my-hr', 'settings']
};
