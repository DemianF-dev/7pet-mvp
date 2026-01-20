import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LogEntry {
    timestamp: number;
    message: string;
    type: 'error' | 'request' | 'route' | 'socket';
    details?: any;
}

interface DiagnosticsState {
    logs: LogEntry[];
    addLog: (entry: Omit<LogEntry, 'timestamp'>) => void;
    clearLogs: () => void;
}

export const useDiagnosticsStore = create<DiagnosticsState>()(
    persist(
        (set) => ({
            logs: [],
            addLog: (entry) => set((state) => {
                const newLog = { ...entry, timestamp: Date.now() };
                const updatedLogs = [newLog, ...state.logs].slice(0, 50); // Keep last 50
                return { logs: updatedLogs };
            }),
            clearLogs: () => set({ logs: [] }),
        }),
        {
            name: '7pet-diagnostics-v1',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
