import { create } from 'zustand';

interface MobileActionsState {
    handlers: Record<string, () => void>;
    registerHandler: (type: string, handler: () => void) => void;
    unregisterHandler: (type: string) => void;
    triggerAction: (type: string) => void;
}

export const useMobileActions = create<MobileActionsState>((set, get) => ({
    handlers: {},
    registerHandler: (type, handler) => set((state) => ({
        handlers: { ...state.handlers, [type]: handler }
    })),
    unregisterHandler: (type) => set((state) => {
        const newHandlers = { ...state.handlers };
        delete newHandlers[type];
        return { handlers: newHandlers };
    }),
    triggerAction: (type) => {
        const handler = get().handlers[type];
        if (handler) {
            handler();
        } else {
            console.warn(`No handler registered for mobile action: ${type}`);
        }
    }
}));

import { useEffect } from 'react';

/**
 * Hook for pages to register their mobile action handler (e.g., FAB click).
 * @param type The action type (e.g., 'new_customer')
 * @param handler The function to execute
 */
export function useRegisterMobileAction(type: string, handler: () => void) {
    const register = useMobileActions(s => s.registerHandler);
    const unregister = useMobileActions(s => s.unregisterHandler);

    useEffect(() => {
        register(type, handler);
        return () => unregister(type);
    }, [type, handler, register, unregister]);
}
