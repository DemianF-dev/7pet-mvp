import { AxiosInstance } from 'axios';

export interface CartItem {
    id: string; // unique for cart
    productId?: string;
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
}

export interface POSSession {
    id: string;
    status: 'OPEN' | 'CLOSED';
    openedAt: string;
    openedBy?: {
        name?: string;
    };
    openingBalance: number;
}

export class POSService {
    constructor(private api: AxiosInstance) { }

    async getActiveSession(): Promise<POSSession | null> {
        const response = await this.api.get('/pos/session/active');
        return response.data;
    }

    async openSession(data: { openingBalance: number; notes?: string }): Promise<POSSession> {
        const response = await this.api.post('/pos/session/open', data);
        return response.data;
    }

    async closeSession(id: string, data: { closingBalance: number; notes?: string }): Promise<void> {
        await this.api.post(`/pos/session/close/${id}`, data);
    }

    async searchItems(q: string): Promise<{ products: any[], services: any[] }> {
        const response = await this.api.get(`/pos/search?q=${q}`);
        return response.data;
    }

    async createOrder(data: any): Promise<any> {
        const response = await this.api.post('/pos/orders', data);
        return response.data;
    }

    async addPayment(orderId: string, payments: any[]): Promise<any> {
        const response = await this.api.post(`/pos/orders/${orderId}/payments`, { payments });
        return response.data;
    }

    async getCheckoutData(appointmentId: string): Promise<any> {
        const response = await this.api.get(`/pos/checkout-appointment/${appointmentId}`);
        return response.data;
    }

    async createQuickProduct(data: any): Promise<any> {
        const response = await this.api.post('/products', data);
        return response.data;
    }

    async getOrder(id: string): Promise<any> {
        const response = await this.api.get(`/pos/orders/${id}`);
        return response.data;
    }

    async cancelOrder(id: string, reason: string): Promise<any> {
        const response = await this.api.post(`/pos/orders/${id}/cancel`, { reason });
        return response.data;
    }
}
