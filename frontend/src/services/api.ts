import axios from 'axios';
import { toast } from 'react-hot-toast';

// Validate and sanitize API URL to prevent common configuration errors
const getApiUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL;

    // Se estivermos em produção (Vercel), usamos /api por padrão se nada for definido
    if (import.meta.env.PROD && !envUrl) {
        return '/api';
    }

    const defaultUrl = 'http://localhost:3001';
    let apiUrl = envUrl || defaultUrl;

    // 🚀 Robustness Fix: Ensure the URL has a protocol if it's not a relative path
    if (apiUrl && !apiUrl.startsWith('http') && !apiUrl.startsWith('/')) {
        console.warn(`[API Config] ⚠️ API URL is missing protocol. Prepending https:// to: ${apiUrl}`);
        apiUrl = `https://${apiUrl}`;
    }

    console.log('[API Config] ✅ Using API URL:', apiUrl);
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
            const attemptedUrl = error.config?.url || '';

            // 🔇 Silently fail for polling endpoints like notifications
            if (attemptedUrl.includes('/notifications')) {
                console.warn('[API Polling] 🔇 Silent fail for notifications');
                return Promise.reject(error);
            }

            const baseURL = error.config?.baseURL || '';
            const fullUrl = attemptedUrl.startsWith('http') ? attemptedUrl : `${baseURL}${attemptedUrl}`;

            toast.error(`Sem conexão com a API: ${fullUrl}. Verifique se a variável VITE_API_URL está correta no servidor.`, {
                id: 'network-error', // Prevent duplicate toasts
                duration: 8000,
                icon: '📡'
            });
        }
        // 401 Unauthorized - Token might be expired or JWT_SECRET changed
        else if (error.response.status === 401) {
            console.warn('[API Error] 🔑 Unauthorized (401). Clearing token...');
            localStorage.removeItem('7pet-token');
            toast.error('Sessão expirada. Por favor, faça login novamente.', { id: 'auth-error' });

            if (!window.location.pathname.includes('/login')) {

                window.location.href = window.location.pathname.startsWith('/client')
                    ? '/client/login'
                    : '/staff/login';
            }
        }
        // 500 Internal Server Error
        else if (error.response.status >= 500) {

            console.error('[API Error] 🔴 Server Error Details:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url
            });

            const data = error.response.data;
            let message = 'Erro interno no servidor.';

            if (typeof data === 'string') {
                if (data.includes('<!DOCTYPE html>')) {
                    message = 'Erro crítico (Vercel Function Crash).';
                } else {
                    message = data;
                }
            } else if (data && typeof data === 'object') {
                const errorObj = data.error || data;
                if (typeof errorObj === 'string') {
                    message = errorObj;
                } else if (errorObj && typeof errorObj === 'object') {
                    message = errorObj.message || errorObj.code || JSON.stringify(errorObj);
                }
            }

            toast.error(`${message} (500)`, {
                duration: 6000
            });
        }
        return Promise.reject(error);
    }
);

export default api;
