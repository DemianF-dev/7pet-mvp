import { create } from 'zustand';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'paused';

interface SocketState {
    status: SocketStatus;
    socketId: string | null;
    attempts: number;
    lastError: string | null;
    lastConnectedAt: number | null;
    transport: string | null;
    disabledUntil: number | null;

    // Actions
    setStatus: (status: SocketStatus) => void;
    setConnected: (id: string | undefined, transport: string | undefined) => void;
    setError: (message: string, attempts: number) => void;
    setTransport: (transport: string) => void;
    setDisabledUntil: (time: number) => void;
    reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    status: 'disconnected',
    socketId: null,
    attempts: 0,
    lastError: null,
    lastConnectedAt: null,
    transport: null,
    disabledUntil: null,

    setStatus: (status) => set({ status }),

    setConnected: (id, transport) => set({
        status: 'connected',
        socketId: id || null,
        transport: transport || null,
        attempts: 0,
        lastError: null,
        lastConnectedAt: Date.now()
    }),

    setError: (message, attempts) => set({
        status: 'error',
        lastError: message,
        attempts
    }),

    setTransport: (transport) => set({ transport }),

    setDisabledUntil: (time) => set({
        disabledUntil: time,
        status: 'error'
    }),

    reset: () => set({
        status: 'disconnected',
        socketId: null,
        attempts: 0,
        lastError: null,
        lastConnectedAt: null,
        transport: null,
        disabledUntil: null
    })
}));
