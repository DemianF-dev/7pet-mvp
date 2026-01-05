import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    seqId: number;
    email: string;
    extraEmails?: string[];
    role?: 'CLIENTE' | 'OPERACIONAL' | 'GESTAO' | 'ADMIN' | 'SPA' | 'MASTER' | string;
    division: 'CLIENTE' | 'SPA' | 'COMERCIAL' | 'LOGISTICA' | 'GERENCIA' | 'DIRETORIA' | 'ADMIN';
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    extraPhones?: string[];
    address?: string;
    extraAddresses?: string[];
    document?: string;
    birthday?: string;
    notes?: string;
    staffId?: number;
    customer?: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
        type?: string;
        discountPercentage?: number;
        recurringFrequency?: string;
        discoverySource?: string;
        communicationPrefs?: string[];
        communicationOther?: string;
        additionalGuardians?: any[];
        // Legacy
        secondaryGuardianName?: string;
        secondaryGuardianPhone?: string;
        secondaryGuardianEmail?: string;
        secondaryGuardianAddress?: string;
    };
    showTutorial?: boolean;
    createdAt?: string;
    color?: string;
    permissions?: string[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isTutorialActive: boolean;
    tutorialStep: number;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: User) => void;
    setTutorial: (active: boolean, step?: number) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isTutorialActive: false,
            tutorialStep: 0,
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
            setTutorial: (active, step) => {
                set((state) => ({
                    isTutorialActive: active,
                    tutorialStep: step !== undefined ? step : state.tutorialStep
                }));
            },
            logout: () => {
                localStorage.removeItem('7pet-token');
                set({ user: null, token: null, isTutorialActive: false, tutorialStep: 0 });
            },
        }),
        {
            name: '7pet-auth-storage',
        }
    )
);
