import { AxiosInstance } from 'axios';

// Interface copied from CustomerManager.tsx
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type: 'AVULSO' | 'RECORRENTE';
    legacyBitrixId?: string; // New migration field
    internalNotes?: string;
    recurrenceDiscount?: number;
    user: {
        seqId: number;
        staffId?: number;
        email: string;
        role?: string;
        staffProfile?: { id: string };
    };
    _count: {
        appointments: number;
        quotes: number;
        pets: number;
    };
    pets?: Array<{ name: string }>;
}

export class CustomersService {
    constructor(private api: AxiosInstance) { }

    async list(): Promise<Customer[]> {
        const response = await this.api.get('/customers');
        console.log('[DEBUG] Customers API Response:', response.data);
        const result = Array.isArray(response.data) ? response.data : (response.data.data || []);
        console.log('[DEBUG] Processed Customers List:', result);
        return result;
    }

    async listTrash(): Promise<Customer[]> {
        const response = await this.api.get('/customers/trash');
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    }

    async bulkDelete(ids: string[]): Promise<void> {
        await this.api.post('/customers/bulk-delete', { ids });
    }

    async bulkRestore(ids: string[]): Promise<void> {
        await this.api.post('/customers/bulk-restore', { ids });
    }

    async deletePermanent(id: string): Promise<void> {
        await this.api.delete(`/customers/${id}/permanent`);
    }

    // Copied method signature but simplified as inferred from usage or standard strictness
    // Currently CustomerManager calls list/trash/bulk-delete/bulk-restore/deletePermanent.
    // It does NOT call getById directly (it uses CustomerDetailsModal which likely fetches it, 
    // or passes ID. Checking CustomerDetailsModal code would confirm, but for now this is efficient).
    async getById(id: string): Promise<Customer> {
        const response = await this.api.get(`/customers/${id}`);
        return response.data;
    }

    async search(query: string): Promise<Customer[]> {
        const response = await this.api.get(`/customers/search?q=${query}`);
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    }

    async create(data: { name: string; phone: string; email: string }): Promise<Customer> {
        const response = await this.api.post('/customers', {
            ...data,
            type: 'AVULSO'
        });
        return response.data;
    }
}
