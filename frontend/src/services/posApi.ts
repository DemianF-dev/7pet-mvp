import api from './api';

export const getActiveSession = () => api.get('/pos/session/active');
export const openSession = (data: { openingBalance: number; notes?: string }) => api.post('/pos/session/open', data);
export const closeSession = (id: string, data: { closingBalance: number; notes?: string }) => api.post(`/pos/session/close/${id}`, data);

export const searchPOSItems = (q: string) => api.get(`/pos/search?q=${q}`);
export const createOrder = (data: any) => api.post('/pos/orders', data);
export const addPayment = (orderId: string, payments: any[]) => api.post(`/pos/orders/${orderId}/payments`, { payments });

export const getCheckoutData = (appointmentId: string) => api.get(`/pos/checkout-appointment/${appointmentId}`);
export const createProduct = (data: any) => api.post('/products', data);
