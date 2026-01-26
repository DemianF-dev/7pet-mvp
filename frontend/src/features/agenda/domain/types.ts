
export type AgendaDomain = 'SPA' | 'LOG';
export type AgendaViewType = 'KANBAN' | 'DAY' | 'WEEK' | 'MONTH' | 'COMPACT';
export type AgendaTabType = 'active' | 'trash';

export interface AgendaItem {
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    customerId: string;
    customer: {
        name: string;
        phone?: string;
        user: { email: string };
        type: string
    };
    petId: string;
    pet: {
        name: string;
        species?: string;
        breed?: string
    };
    services?: {
        id: string;
        name: string;
        basePrice?: number;
        duration: number
    }[];
    service?: {
        name: string;
        basePrice?: number;
        duration: number
    }; // Legacy support
    transport?: {
        type?: string;
        origin?: string;
        destination?: string;
        price?: number;
    };
    deletedAt?: string;
    performerId?: string;
    performer?: {
        id: string;
        name: string;
        color?: string
    };
    category?: string;
    quote?: {
        appointments?: {
            id: string;
            category: string;
            transport?: { type: string }
        }[];
    };
}
