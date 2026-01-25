import { AxiosInstance } from 'axios';
import { AgendaItem } from '../domain/types';

// Types for extended API responses
interface AgendaDayResponse {
    appointments: AgendaItem[];
    summary: {
        total: number;
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        revenue: number;
    };
    conflicts: Array<{
        id: string;
        description: string;
        type: 'OVERLAP' | 'UNAVAILABLE_PERFORMER' | 'RESOURCE_CONFLICT';
        severity: 'low' | 'medium' | 'high';
    }>;
}

interface AgendaWeekResponse {
    days: Array<{
        date: string;
        appointments: AgendaItem[];
        availableSlots: number[];
        conflicts: any[];
    }>;
    summary: {
        totalAppointments: number;
        totalRevenue: number;
        totalSlots: number;
    };
}

interface AgendaMonthResponse {
    weeks: Array<{
        startDate: string;
        endDate: string;
        days: AgendaWeekResponse['days'];
    }>;
    summary: {
        totalAppointments: number;
        totalRevenue: number;
        utilization: number;
    };
}

export class AppointmentsService {
    constructor(private api: AxiosInstance) { }

    async list(params?: { category?: string }): Promise<AgendaItem[]> {
        const queryParams = new URLSearchParams();
        if (params?.category) {
            queryParams.append('category', params.category);
        }

        const response = await this.api.get(`/appointments?${queryParams.toString()}`);
        return Array.isArray(response.data) ? response.data : (response.data.data || []);
    }

    async listTrash(): Promise<AgendaItem[]> {
        const response = await this.api.get('/appointments/trash');
        const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        return rawData;
    }

    async getAppointment(id: string): Promise<AgendaItem> {
        const response = await this.api.get(`/appointments/${id}`);
        return response.data;
    }

    // Generic create - payload typing can be refined if needed, using any for flexibility during refactor
    async createAppointment(payload: any): Promise<AgendaItem> {
        const response = await this.api.post('/appointments', payload);
        return response.data;
    }

    async updateAppointment(id: string, payload: any): Promise<AgendaItem> {
        const response = await this.api.put(`/appointments/${id}`, payload);
        return response.data;
    }

    async cancelAppointment(id: string, reason: string): Promise<void> {
        await this.api.post(`/appointments/${id}/cancel`, { reason });
    }

    async bulkDelete(ids: string[]): Promise<void> {
        await this.api.post('/appointments/bulk-delete', { ids });
    }

    async bulkPermanentDelete(ids: string[]): Promise<void> {
        await this.api.post('/appointments/bulk-permanent', { ids });
    }

async bulkRestore(ids: string[]): Promise<void> {
        await this.api.post('/appointments/bulk-restore', { ids });
    }

    // Extended methods for agenda hooks
    async getDay(date: string, filters: any = {}): Promise<AgendaDayResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append('date', date);
        if (filters.module) {
            queryParams.append('module', filters.module);
        }
        Object.keys(filters).forEach(key => {
            if (filters[key] && key !== 'module') {
                queryParams.append(key, filters[key]);
            }
        });

        const response = await this.api.get(`/appointments/day?${queryParams.toString()}`);
        return response.data;
    }

    async getWeek(startDate: string, endDate: string, options: any = {}): Promise<AgendaWeekResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        if (options.module) {
            queryParams.append('module', options.module);
        }

        const response = await this.api.get(`/appointments/week?${queryParams.toString()}`);
        return response.data;
    }

    async getMonth(month: string, options: any = {}): Promise<AgendaMonthResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append('month', month);
        if (options.module) {
            queryParams.append('module', options.module);
        }

        const response = await this.api.get(`/appointments/month?${queryParams.toString()}`);
        return response.data;
    }

    async getAvailableSlots(date: string, options: any = {}): Promise<{ slots: any[] }> {
        const queryParams = new URLSearchParams();
        queryParams.append('date', date);
        if (options.serviceIds) {
            options.serviceIds.forEach((id: string) => queryParams.append('serviceIds', id));
        }

        const response = await this.api.get(`/appointments/slots?${queryParams.toString()}`);
        return response.data;
    }

    async getConflicts(startDate: string, endDate: string, options: any = {}): Promise<{ conflicts: any[] }> {
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        if (options.excludeId) {
            queryParams.append('excludeId', options.excludeId);
        }

        const response = await this.api.get(`/appointments/conflicts?${queryParams.toString()}`);
        return response.data;
    }

    async search(options: any): Promise<{ appointments: any[]; total: number }> {
        const queryParams = new URLSearchParams();
        if (options.query) {
            queryParams.append('query', options.query);
        }

        const response = await this.api.get(`/appointments/search?${queryParams.toString()}`);
        return response.data;
    }
}
