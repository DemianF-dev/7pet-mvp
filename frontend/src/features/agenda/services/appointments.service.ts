import { AxiosInstance } from 'axios';
import { AgendaItem } from '../domain/types';

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
}
