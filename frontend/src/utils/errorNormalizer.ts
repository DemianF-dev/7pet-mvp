/**
 * Error Normalizer
 * Converts technical errors into user-friendly messages
 */

import { AxiosError } from 'axios';

export interface NormalizedError {
    title: string;
    message: string;
    action?: string;
    severity: 'error' | 'warning' | 'info';
}

/**
 * Normalize axios error to user-friendly message
 */
export function normalizeError(error: any): NormalizedError {
    // Axios error
    if (error.isAxiosError || error.response) {
        const axiosError = error as AxiosError;

        // Network/timeout errors
        if (!axiosError.response) {
            if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
                return {
                    title: 'Conexão Lenta',
                    message: 'A requisição demorou muito. Tente novamente.',
                    action: 'Tentar Novamente',
                    severity: 'warning',
                };
            }

            return {
                title: 'Sem Conexão',
                message: 'Verifique sua conexão com a internet.',
                action: 'Tentar Novamente',
                severity: 'error',
            };
        }

        const status = axiosError.response.status;

        // HTTP status errors
        switch (status) {
            case 401:
                return {
                    title: 'Sessão Expirada',
                    message: 'Faça login novamente para continuar.',
                    action: 'Fazer Login',
                    severity: 'warning',
                };

            case 403:
                return {
                    title: 'Acesso Negado',
                    message: 'Você não tem permissão para realizar esta ação.',
                    severity: 'error',
                };

            case 404:
                return {
                    title: 'Não Encontrado',
                    message: 'O recurso solicitado não foi encontrado.',
                    severity: 'warning',
                };

            case 409:
                return {
                    title: 'Conflito',
                    message: (axiosError.response.data as any)?.error || 'Já existe um registro com estes dados.',
                    severity: 'warning',
                };

            case 422:
                return {
                    title: 'Dados Inválidos',
                    message: (axiosError.response.data as any)?.error || 'Verifique os dados informados.',
                    severity: 'warning',
                };

            case 429:
                return {
                    title: 'Muitas Tentativas',
                    message: 'Aguarde alguns minutos antes de tentar novamente.',
                    severity: 'warning',
                };

            case 500:
            case 502:
            case 503:
            case 504:
                return {
                    title: 'Serviço Indisponível',
                    message: 'Nosso servidor está com problemas. Tente novamente em alguns instantes.',
                    action: 'Tentar Novamente',
                    severity: 'error',
                };

            default:
                return {
                    title: 'Erro Inesperado',
                    message: (axiosError.response.data as any)?.error || 'Ocorreu um erro. Tente novamente.',
                    action: 'Tentar Novamente',
                    severity: 'error',
                };
        }
    }

    // Generic error
    return {
        title: 'Erro',
        message: error.message || 'Ocorreu um erro inesperado.',
        action: 'Tentar Novamente',
        severity: 'error',
    };
}

/**
 * Get a concise error message suitable for toast notifications
 */
export function getErrorMessage(error: any): string {
    const normalized = normalizeError(error);
    return `${normalized.title}: ${normalized.message}`;
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: any): boolean {
    const normalized = normalizeError(error);
    return normalized.severity !== 'error' || !!normalized.action;
}
