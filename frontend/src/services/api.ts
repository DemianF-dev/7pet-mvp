import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('7pet-token');
    if (token) {
        config.headers.authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Network Error or Server Down
        if (!error.response) {
            const attemptedUrl = error.config?.url || 'URL desconhecida';
            const baseURL = error.config?.baseURL || '';
            const fullUrl = attemptedUrl.startsWith('http') ? attemptedUrl : `${baseURL}${attemptedUrl}`;

            toast.error(`Sem conexão com a API: ${fullUrl}. Verifique se a variável VITE_API_URL está correta no servidor.`, {
                id: 'network-error', // Prevent duplicate toasts
                duration: 8000,
                icon: '📡'
            });
        }
        // 500 Internal Server Error
        else if (error.response.status >= 500) {
            toast.error('Erro interno no servidor. Tente novamente mais tarde.', {
                duration: 4000
            });
        }
        return Promise.reject(error);
    }
);

export default api;
