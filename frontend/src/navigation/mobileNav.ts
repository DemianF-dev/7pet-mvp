import {
    Calendar,
    Users,
    FileText,
    MoreHorizontal,
    Home,
    MessageSquare,
    Settings,
    Gamepad2,
    Truck,
    TrendingUp,
    UserCircle,
    Activity,
    Briefcase
} from 'lucide-react';

export interface MobileNavItem {
    key: string;
    label: string;
    path: string;
    icon: any;
    matchPaths?: string[];
    rolesAllowed?: string[];
    showBadge?: boolean;
}

// TAB 1: Agenda
// TAB 2: Clientes
// TAB 3: Orçamentos
// TAB 4: Atividades/Notificações
// TAB 5: Mais (abre drawer)

export const MOBILE_TABS: MobileNavItem[] = [
    {
        key: 'dashboard',
        label: 'Hoje',
        path: '/staff/dashboard',
        icon: Home,
        rolesAllowed: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL', 'LOGISTICA']
    },
    {
        key: 'agenda',
        label: 'Agenda',
        path: '/staff/agenda-spa',
        icon: Calendar,
        matchPaths: ['/staff/agenda-spa', '/staff/agenda-log'],
        rolesAllowed: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA']
    },
    {
        key: 'clients',
        label: 'Clientes',
        path: '/staff/customers',
        icon: Users,
        rolesAllowed: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL']
    },
    {
        key: 'quotes',
        label: 'Orçamentos',
        path: '/staff/quotes',
        icon: FileText,
        rolesAllowed: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL']
    },
    {
        key: 'activity',
        label: 'Mural',
        path: '/staff/feed',
        icon: Activity,
        rolesAllowed: ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL', 'LOGISTICA']
    },
    {
        key: 'more',
        label: 'Mais',
        path: '#more',
        icon: MoreHorizontal
    }
];

// Items for the "More" Drawer
export const MOBILE_MORE: MobileNavItem[] = [
    {
        key: 'menu-hub',
        label: 'Menu Geral',
        path: '/staff/menu',
        icon: MoreHorizontal
    },
    {
        key: 'profile',
        label: 'Meu Perfil',
        path: '/staff/profile',
        icon: UserCircle
    },
    {
        key: 'chat',
        label: 'Chat Interno',
        path: '/staff/chat',
        icon: MessageSquare
    },
    {
        key: 'pausa',
        label: 'Pausa (Games)',
        path: '/pausa',
        icon: Gamepad2
    },
    {
        key: 'hr',
        label: 'Meu RH',
        path: '/staff/my-hr',
        icon: Briefcase
    },
    {
        key: 'transport',
        label: 'Logística',
        path: '/staff/transport',
        icon: Truck,
        rolesAllowed: ['GESTAO', 'ADMIN', 'MASTER', 'LOGISTICA']
    },
    {
        key: 'strategy',
        label: 'Estratégico',
        path: '/staff/strategy',
        icon: TrendingUp,
        rolesAllowed: ['GESTAO', 'ADMIN', 'MASTER']
    },
    {
        key: 'settings',
        label: 'Configurações',
        path: '/staff/settings',
        icon: Settings
    }
];

// Client specific tabs (if we want to use the same component)
export const CLIENT_MOBILE_TABS: MobileNavItem[] = [
    { key: 'home', label: 'Início', path: '/client/dashboard', icon: Home },
    { key: 'schedule', label: 'Agendar', path: '/client/schedule', icon: Calendar },
    { key: 'quotes', label: 'Orçamentos', path: '/client/quotes', icon: FileText },
    { key: 'chat', label: 'Chat', path: '/client/chat', icon: MessageSquare },
    { key: 'more', label: 'Mais', path: '#more', icon: MoreHorizontal }
];

export const CLIENT_MOBILE_MORE: MobileNavItem[] = [
    { key: 'profile', label: 'Perfil', path: '/client/profile', icon: UserCircle },
    { key: 'pets', label: 'Meus Pets', path: '/client/pets', icon: Users },
    { key: 'pausa', label: 'Pausa', path: '/pausa', icon: Gamepad2 },
    { key: 'settings', label: 'Configurações', path: '/client/settings', icon: Settings }
];

export const NO_BOTTOM_NAV_ROUTES = [
    '/staff/login',
    '/staff/register',
    '/client/login',
    '/client/register',
    '/client/entry',
    '/auth/callback'
];
