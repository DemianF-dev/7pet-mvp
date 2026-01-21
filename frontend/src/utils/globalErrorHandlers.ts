/**
 * Global Error Handlers
 * Centralized error handling for window.onerror and unhandledrejection
 * Integrates with ErrorStore for diagnostics
 */

import { useErrorStore } from '../store/errorStore';

/**
 * Check if error is chunk-related (handled separately by chunkRecovery)
 */
function isChunkError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    const chunkPatterns = [
        'Failed to fetch dynamically imported module',
        'ChunkLoadError',
        'Loading chunk',
        'Importing a module script failed'
    ];
    return chunkPatterns.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Install global error handlers
 * Should be called once in main.tsx before rendering
 */
export function installGlobalErrorHandlers(): void {
    // Window error handler
    window.addEventListener('error', (event) => {
        // Skip chunk errors (handled by chunkRecovery)
        if (event.error && isChunkError(event.error)) {
            return;
        }

        useErrorStore.getState().addError({
            message: event.message || event.error?.message || 'Unknown error',
            name: event.error?.name || 'Error',
            type: 'runtime',
            stack: event.error?.stack,
        });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        // Skip chunk errors (handled by chunkRecovery)
        if (event.reason && isChunkError(event.reason)) {
            return;
        }

        const reason = event.reason;
        const message = reason?.message || reason?.toString() || 'Unhandled rejection';

        useErrorStore.getState().addError({
            message,
            name: reason?.name || 'UnhandledRejection',
            type: 'unhandled',
            stack: reason?.stack,
        });
    });

    console.log('✅ Global error handlers installed');
}
