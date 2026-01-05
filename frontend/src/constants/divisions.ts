// Sistema de Divisões/Departamentos
// As divisões determinam as permissões e hierarquia no sistema

export const DIVISIONS = {
    CLIENTE: 'CLIENTE',
    SPA: 'SPA',
    COMERCIAL: 'COMERCIAL',
    LOGISTICA: 'LOGISTICA',
    GERENCIA: 'GERENCIA',
    DIRETORIA: 'DIRETORIA',
    ADMIN: 'ADMIN',
} as const;

export type Division = typeof DIVISIONS[keyof typeof DIVISIONS];

// Cores padronizadas para cada divisão (tons pastéis)
export const DIVISION_COLORS = {
    CLIENTE: '#E5E7EB',      // Cinza claro
    SPA: '#BBF7D0',          // Verde pastel
    COMERCIAL: '#BFDBFE',    // Azul pastel
    LOGISTICA: '#FED7AA',    // Laranja pastel
    GERENCIA: '#FEF08A',     // Amarelo pastel
    DIRETORIA: '#D9C7B8',    // Marrom pastel
    ADMIN: '#C4B5A0',        // Marrom pastel escuro
} as const;

// Labels amigáveis
export const DIVISION_LABELS = {
    CLIENTE: 'Cliente',
    SPA: 'SPA',
    COMERCIAL: 'Atendimento Comercial',
    LOGISTICA: 'Logística',
    GERENCIA: 'Gerência',
    DIRETORIA: 'Diretoria',
    ADMIN: 'Diretoria/ADMIN',
} as const;

// Hierarquia de permissões (níveis de acesso)
export const DIVISION_HIERARCHY = {
    CLIENTE: 0,
    SPA: 1,
    COMERCIAL: 1,
    LOGISTICA: 1,
    GERENCIA: 2,
    DIRETORIA: 3,
    ADMIN: 4,
} as const;

// Módulos do sistema acessíveis por divisão
export const DIVISION_PERMISSIONS = {
    CLIENTE: ['dashboard'],
    SPA: ['dashboard', 'kanban', 'customers', 'services'],
    COMERCIAL: ['dashboard', 'kanban', 'customers', 'quotes', 'services'],
    LOGISTICA: ['dashboard', 'transport', 'kanban'],
    GERENCIA: ['dashboard', 'kanban', 'transport', 'quotes', 'customers', 'services', 'billing', 'reports'],
    DIRETORIA: ['dashboard', 'kanban', 'transport', 'quotes', 'customers', 'services', 'billing', 'management', 'reports', 'users'],
    ADMIN: ['dashboard', 'kanban', 'transport', 'quotes', 'customers', 'services', 'billing', 'management', 'reports', 'users'],
} as const;

// Helper function para verificar se uma divisão tem permissão
export function hasDivisionPermission(division: Division, module: string): boolean {
    const permissions = DIVISION_PERMISSIONS[division as keyof typeof DIVISION_PERMISSIONS] as readonly string[] || [];
    return (permissions as readonly string[]).includes(module);
}

// Helper function para verificar se uma divisão tem nível hierárquico suficiente
export function hasHierarchyLevel(division: Division, requiredLevel: number): boolean {
    const level = DIVISION_HIERARCHY[division as keyof typeof DIVISION_HIERARCHY] || 0;
    return level >= requiredLevel;
}

// Helper para obter cor da divisão
export function getDivisionColor(division: Division | string): string {
    return DIVISION_COLORS[division as keyof typeof DIVISION_COLORS] || DIVISION_COLORS.CLIENTE;
}

// Helper para obter label da divisão
export function getDivisionLabel(division: Division | string): string {
    return DIVISION_LABELS[division as keyof typeof DIVISION_LABELS] || division;
}

// Helper para obter texto de cor (para uso em className do Tailwind)
export function getDivisionBgClass(division: Division | string): string {
    const colorMap: Record<string, string> = {
        CLIENTE: 'bg-gray-200',
        SPA: 'bg-green-200',
        COMERCIAL: 'bg-blue-200',
        LOGISTICA: 'bg-orange-200',
        GERENCIA: 'bg-yellow-200',
        DIRETORIA: 'bg-stone-300',      // Marrom pastel
        ADMIN: 'bg-stone-400',           // Marrom escuro
    };
    return colorMap[division] || 'bg-gray-200';
}

export function getDivisionTextClass(division: Division | string): string {
    const colorMap: Record<string, string> = {
        CLIENTE: 'text-gray-700',
        SPA: 'text-green-700',
        COMERCIAL: 'text-blue-700',
        LOGISTICA: 'text-orange-700',
        GERENCIA: 'text-yellow-700',
        DIRETORIA: 'text-stone-800',    // Marrom pastel
        ADMIN: 'text-stone-900',         // Marrom escuro
    };
    return colorMap[division] || 'text-gray-700';
}

