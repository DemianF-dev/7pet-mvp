import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useDiagnosticsStore } from '../store/diagnosticsStore';
import logger from '../utils/logger';

// Validate and sanitize API URL to prevent common configuration errors
const getApiUrl = (): string => {
    const envUrl = import.meta.env.VITE_API_URL;

    // Se estivermos em produção (Vercel), usamos /api por padrão se nada for definido
    if (import.meta.env.PROD && !envUrl) {
        return '/api';
    }

    const defaultUrl = import.meta.env.PROD ? '/api' : 'http://localhost:3001';
    let apiUrl = envUrl || defaultUrl;

    // 🚀 Robustness Fix: Ensure the URL has a protocol if it's not a relative path
    if (apiUrl && !apiUrl.startsWith('http') && !apiUrl.startsWith('/')) {
        logger.warn('API URL missing protocol, fixing', { url: apiUrl });
        apiUrl = `https://${apiUrl}`;
    }

    logger.debug('Using API URL', { url: apiUrl });
    return apiUrl ? apiUrl.replace(/\/$/, "") : apiUrl;
};

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const api = axios.create({
    baseURL: getApiUrl(),
    timeout: isMobile() ? 12000 : 20000,
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('7pet-token');
    if (token) {
        config.headers.authorization = `Bearer ${token}`;
    }
    return config;
});

// Retry Logic Helper
const MAX_RETRIES = 2;
const RETRIABLE_STATUSES = [502, 503, 504];

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;

        // 🚀 Retry Logic
        const isNetworkError = !response;
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isRetriableStatus = response && RETRIABLE_STATUSES.includes(response.status);

        // 📝 Log failure to diagnostics (sanitized)
        useDiagnosticsStore.getState().addLog({
            type: 'request',
            message: `Failed: ${config?.url?.split('?')[0] || 'unknown'}`,
            details: {
                status: response?.status,
                error: error.message,
                code: error.code,
                method: config?.method
            }
        });

        if (config && (isNetworkError || isTimeout || isRetriableStatus)) {
            config._retryCount = config._retryCount || 0;

            if (config._retryCount < MAX_RETRIES) {
                config._retryCount++;
                const delay = Math.pow(2, config._retryCount) * 500; // 1s, 2s

                logger.debug('Retrying request', {
                    url: config.url?.split('?')[0],
                    attempt: config._retryCount,
                    maxAttempts: MAX_RETRIES,
                    delay
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                return api(config);
            }
        }

        // Network Error or Server Down
        if (!response) {
            const attemptedUrl = error.config?.url || '';

            // 🔇 Silently fail for polling endpoints like notifications
            if (attemptedUrl.includes('/notifications')) {
                return Promise.reject(error);
            }

            toast.error(`Falha na conexão. Tentando reconectar...`, {
                id: 'network-error',
                duration: 5000,
                icon: '📡'
            });
        }
        // 401 Unauthorized
        else if (response.status === 401) {
            localStorage.removeItem('7pet-token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = window.location.pathname.startsWith('/client')
                    ? '/client/login'
                    : '/staff/login';
            }
        }
        // 500+ Errors
        else if (response.status >= 500) {
            const data = response.data;
            let message = 'Erro no servidor.';
            if (data && typeof data === 'object') {
                message = data.error || data.message || message;
            }
            toast.error(`${message} (${response.status})`, { id: 'server-error' });
        }

        return Promise.reject(error);
    }
);

/**
 * Premium request helper with automatic cancellation and error boundary integration
 */
export const requestSafe = async <T = any>(config: any): Promise<T> => {
    const controller = new AbortController();
    const finalConfig = {
        ...config,
        signal: controller.signal
    };

    try {
        const response = await api(finalConfig);
        return response.data;
    } catch (error: any) {
        if (axios.isCancel(error)) {
            logger.debug('Request canceled', { url: config?.url?.split('?')[0] });
        }
        throw error;
    }
};

export default api;
