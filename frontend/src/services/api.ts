import axios from 'axios';
import { toast } from 'react-hot-toast';

// Validate and sanitize API URL to prevent common configuration errors
const getApiUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL;
    const defaultUrl = 'http://localhost:3001';

    // Critical validation: never use HTTPS with localhost (causes connection errors)
    if (envUrl?.includes('localhost') && envUrl.startsWith('https')) {
        console.error('[API Config] ❌ INVALID: HTTPS detected on localhost, forcing HTTP');
        const correctedUrl = envUrl.replace('https://', 'http://');
        console.warn('[API Config] ⚠️ Auto-corrected to:', correctedUrl);
        return correctedUrl;
    }

    const apiUrl = envUrl || defaultUrl;
    console.log('[API Config] ✅ Using API URL:', apiUrl);
    console.log('[API Config] Environment:', import.meta.env.MODE);
    return apiUrl;
};

const api = axios.create({
    baseURL: getApiUrl(),
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
            const serverMessage = error.response.data?.message || error.response.data?.error || 'Erro interno no servidor.';
            toast.error(`${serverMessage} Tente novamente mais tarde.`, {
                duration: 5000
            });
        }
        return Promise.reject(error);
    }
);

export default api;
