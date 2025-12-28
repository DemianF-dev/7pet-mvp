import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    role: 'CLIENTE' | 'OPERACIONAL' | 'GESTAO' | 'ADMIN' | 'SPA' | 'MASTER';
    name?: string;
    phone?: string;
    address?: string;
    document?: string;
    birthday?: string;
    notes?: string;
    customer?: {
        id: string; // Added ID here
        name: string;
    };
    permissions?: string[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (user, token) => {
                // Ensure permissions is a proper array
                if (typeof user.permissions === 'string') {
                    try {
                        user.permissions = JSON.parse(user.permissions);
                    } catch (e) {
                        // console.error("Failed to parse permissions", e);
                        // Fallback or keep as is? Better to empty it to avoid crashes
                        user.permissions = [];
                    }
                }
                localStorage.setItem('7pet-token', token);
                set({ user, token });
            },
            updateUser: (user) => {
                if (typeof user.permissions === 'string') {
                    try {
                        user.permissions = JSON.parse(user.permissions);
                    } catch (e) {
                        user.permissions = [];
                    }
                }
                set({ user });
            },
            logout: () => {
                localStorage.removeItem('7pet-token');
                set({ user: null, token: null });
            },
        }),
        {
            name: '7pet-auth-storage',
        }
    )
);
