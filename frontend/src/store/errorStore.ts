/**
 * Error Store - Lightweight error tracking without Sentry
 * Stores last 20 errors for diagnostics (MASTER users only)
 */

import { create } from 'zustand';

export interface ErrorEntry {
    id: string;
    timestamp: number;
    message: string;
    name: string;
    type: 'chunk' | 'network' | 'runtime' | 'boundary' | 'unhandled';
    route: string;
    online: boolean;
    userAgent?: string; // Only stored for MASTER/dev
    stack?: string; // Only stored for MASTER/dev
}

interface ErrorStore {
    errors: ErrorEntry[];
    addError: (error: Partial<ErrorEntry>) => void;
    clearErrors: () => void;
    getErrors: () => ErrorEntry[];
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
    errors: [],

    addError: (error) => {
        const newError: ErrorEntry = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            message: error.message || 'Unknown error',
            name: error.name || 'Error',
            type: error.type || 'runtime',
            route: window.location.pathname,
            online: navigator.onLine,
            userAgent: import.meta.env.DEV ? navigator.userAgent : undefined,
            stack: import.meta.env.DEV ? error.stack : undefined,
        };

        set((state) => ({
            errors: [...state.errors, newError].slice(-20), // Keep last 20
        }));

        // Log to console in dev
        if (import.meta.env.DEV) {
            console.error('📋 Error tracked:', newError);
        }
    },

    clearErrors: () => set({ errors: [] }),

    getErrors: () => get().errors,
}));
