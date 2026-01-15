import api from './api';

export interface BulkNotificationPayload {
    targetType: 'ALL' | 'CLIENTS' | 'ROLES' | 'USERS';
    targetRoles?: string[];
    targetUserIds?: string[];
    title: string;
    body: string;
    type?: string;
    url?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const marketingService = {
    /**
     * Envia notificação em massa
     */
    async sendBulkNotification(payload: BulkNotificationPayload) {
        const { data } = await api.post('/marketing/send-bulk', payload);
        return data;
    },

    /**
     * Busca cargos disponíveis para filtro
     */
    async getAvailableRoles() {
        const { data } = await api.get('/marketing/roles');
        return data as string[];
    }
};
